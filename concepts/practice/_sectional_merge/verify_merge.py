#!/usr/bin/env python3
import json,os,glob,collections,sys
BANK=os.path.expanduser('~/mnt/GRE Quant Pro/gre-free/pro/bank')
HERE=os.path.dirname(os.path.abspath(__file__))
fail=[];warn=[]
def L(p): return json.load(open(os.path.join(BANK,p),encoding='utf-8'))

# 1. every json parses
files=[os.path.relpath(f,BANK) for f in glob.glob(os.path.join(BANK,'*','*.json'))]
for f in files:
    try: L(f)
    except Exception as e: fail.append(f'unparseable {f}: {e}')
print(f'1. parsed {len(files)} bank files + index.json')

index=L('index.json')
targets=collections.defaultdict(list); mixedbag={}
for t,subs in index['topics'].items():
    for n,m in subs.items():
        targets[m['id']].append((t,n,m['file']))
        if '_mixed_bag' in os.path.basename(m['file']): mixedbag[t]=m['file']

sec={}
for f in sorted(glob.glob(os.path.join(BANK,'sectional','*_set*.json'))):
    for q in json.load(open(f,encoding='utf-8'))['questions']: sec[q['id']]=q
mapping=[l.strip().split('\t') for l in open(os.path.join(HERE,'mapping.tsv'),encoding='utf-8') if l.strip()]

# 2. placement + content fidelity
cache={f:L(f) for f in files if isinstance(L(f),dict) and 'questions' in L(f)}
byid={}
for f,d in cache.items():
    for q in d['questions']: byid.setdefault(q['id'],[]).append((f,q))
placed=0
for qid,code in mapping:
    want=set()
    for t,n,path in targets[code]:
        want.add(path)
        if mixedbag.get(t): want.add(mixedbag[t])
    for code2, also in {'NUM-REM': ['ARI-REM'], 'NUM-ABS': ['ARI-ABS']}.items():
        if code == code2:
            for other in also:
                for t2, n2, p2_ in targets.get(other, []):
                    want.add(p2_)
                    if mixedbag.get(t2): want.add(mixedbag[t2])
    got={f for f,_ in byid.get(qid,[]) if not f.startswith('sectional/')}
    if got!=want: fail.append(f'{qid}: in {sorted(got)} expected {sorted(want)}')
    for f,q in [x for x in byid.get(qid,[]) if not x[0].startswith('sectional/')]:
        src=dict(sec[qid]); cp=dict(q)
        if cp.pop('origin',None)!='sectional': fail.append(f'{qid} in {f}: origin field missing')
        cp.pop('origin_set',None)
        if cp!=src: fail.append(f'{qid} in {f}: content differs from sectional source')
    placed+=1
print(f'2. checked placement + byte-fidelity for {placed} sectional questions')

# 3. duplicate ids inside a file
for f,d in cache.items():
    c=collections.Counter(q['id'] for q in d['questions'])
    dups=[i for i,n in c.items() if n>1]
    if dups: fail.append(f'{f}: duplicate ids {dups[:5]}')
print('3. duplicate-id check done')

# 4. index counts == reality, totals add up
for t,subs in index['topics'].items():
    for n,m in subs.items():
        real=len(cache[m['file']]['questions'])
        if m['count']!=real: fail.append(f'index {t}/{n}: count {m["count"]} != {real}')
        hdr=cache[m['file']]
        meta=hdr.get('meta') if isinstance(hdr.get('meta'),dict) else hdr
        if meta.get('total_questions') not in (real,None): fail.append(f'{m["file"]}: meta.total_questions {meta.get("total_questions")} != {real}')
        if isinstance(hdr.get('total_questions'),int) and hdr['total_questions']!=real: fail.append(f'{m["file"]}: top-level total_questions != {real}')
        dist=m.get('distribution')
        if dist:
            c=collections.Counter(q.get('difficulty') for q in cache[m['file']]['questions'])
            if sum(dist.values())!=real or any(c.get(k,0)!=v for k,v in dist.items()):
                fail.append(f'index {t}/{n}: distribution {dist} != {dict(c)}')
tot=sum(m['count'] for subs in index['topics'].values() for m in subs.values())
if tot!=index['total_questions']: fail.append(f'index total_questions {index["total_questions"]} != {tot}')
print(f'4. index consistency checked ({tot} question slots across all files)')

# 5. schema sanity on every appended question
DIFF={'easy','medium','hard','extreme_hard'}
TYPES={'mcq','quantitative_comparison','numeric_entry','multiple_answer'}
req=['id','difficulty','type','question','answer','explanation','trap','estimated_time_seconds','tags']
for qid,_ in mapping:
    q=sec[qid]
    for k in req:
        if k not in q or q[k] in (None,'',[]): fail.append(f'{qid}: missing {k}')
    if q['difficulty'] not in DIFF: fail.append(f'{qid}: bad difficulty {q["difficulty"]}')
    if q['type'] not in TYPES: fail.append(f'{qid}: bad type {q["type"]}')
    if q['type']=='numeric_entry':
        if q.get('options') not in (None,): warn.append(f'{qid}: numeric_entry has options')
    else:
        if not isinstance(q.get('options'),list) or len(q['options'])<4: fail.append(f'{qid}: options malformed')
        if q['type']=='quantitative_comparison' and len(q['options'])!=4: fail.append(f'{qid}: QC needs 4 options')
        if q['type']=='multiple_answer' and not (2<=len(q['answer'])<=4): warn.append(f'{qid}: multiple_answer key has {len(q["answer"])} letters')
        if q['type'] in ('mcq',) and q['answer'] not in list('ABCDEFGH'): fail.append(f'{qid}: mcq answer {q["answer"]}')
    if q.get('question','').count('svg')and not q.get('svg'): pass
print('5. schema sanity checked')

# 6. figure-bearing questions kept their svg
nosvg=[qid for qid,_ in mapping if ('figure' in sec[qid]['question'].lower() or 'graph shows' in sec[qid]['question'].lower() or 'table above' in sec[qid]['question'].lower()) and not sec[qid].get('svg')]
if nosvg: fail.append(f'figure questions without svg: {nosvg}')
svgn=sum(1 for qid,_ in mapping if sec[qid].get('svg'))
print(f'6. {svgn} questions carry an inline svg; all figure references have one')

stray=[]
allowed=collections.defaultdict(set)
for qid,code in mapping:
    for t2,n2,path in targets[code]:
        allowed[path].add(qid)
        if mixedbag.get(t2): allowed[mixedbag[t2]].add(qid)
    for code2,also in {'NUM-REM':['ARI-REM'],'NUM-ABS':['ARI-ABS']}.items():
        if code==code2:
            for other in also:
                for t3,n3,p3 in targets.get(other,[]):
                    allowed[p3].add(qid)
                    if mixedbag.get(t3): allowed[mixedbag[t3]].add(qid)
for f,d in cache.items():
    if f.startswith('sectional/'): continue
    for q in d['questions']:
        if q.get('origin')=='sectional' and q['id'] not in allowed[f]:
            stray.append(f'{q["id"]} should not be in {f}')
if stray: fail.extend(stray)
print(f'7. stray-placement check done ({len(stray)} strays)')

print()
if warn:
    print(f'WARNINGS ({len(warn)}):')
    for w in warn[:15]: print('   ',w)
print(('FAILURES (%d):'%len(fail)) if fail else 'ALL CHECKS PASSED')
for f in fail[:40]: print('   ',f)
sys.exit(1 if fail else 0)
