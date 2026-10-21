import json,collections,glob,sys
REQ=['id','difficulty','type','question','options','answer','explanation','trap','estimated_time_seconds','tags']
QC=["A. Column A is greater","B. Column B is greater","C. The two quantities are equal","D. The relationship cannot be determined from the information given"]
paths=sys.argv[1:] or sorted(glob.glob('patches/*.json'))
allok=True
for p in paths:
    try: d=json.load(open(p))
    except Exception as e: print(p,'BROKEN JSON',e); allok=False; continue
    qs=d['questions']; errs=[]
    for q in qs:
        for f in REQ:
            if f not in q: errs.append((q.get('id'),'missing '+f))
        t=q.get('type')
        if t=='numeric_entry' and q.get('options') is not None: errs.append((q['id'],'NE options not null'))
        if t=='quantitative_comparison' and q.get('options')!=QC: errs.append((q['id'],'QC options nonstandard'))
        if t in('mcq','multiple_answer') and len(q.get('options') or [])!=5: errs.append((q['id'],'opt count'))
        if t=='multiple_answer':
            a=q.get('answer')
            if not isinstance(a,list) or not (2<=len(a)<=4): errs.append((q['id'],'MA answer size '+str(a)))
        elif t in('mcq','quantitative_comparison') and q.get('answer') not in list('ABCDE'): errs.append((q['id'],'bad key'))
        nonascii=set(ch for ch in (q.get('question','')+q.get('explanation','')+q.get('trap','')) if ord(ch)>127)-{'—'}
        if nonascii: errs.append((q['id'],'non-ascii '+repr(''.join(sorted(nonascii)))))
    dif=collections.Counter(q['difficulty'] for q in qs)
    typ=collections.Counter(q['type'] for q in qs)
    dup=[i for i,c in collections.Counter(q['id'] for q in qs).items() if c>1]
    split_ok = (len(qs)==30 and dif['easy']==5 and dif['medium']==8 and dif['hard']==12 and dif['extreme_hard']==5)
    print("%-16s n=%-3d %s %s" % (p.split('/')[-1], len(qs), dict(dif), dict(typ)))
    print("   split_ok=%s dup=%s new=%s flagged=%s" % (split_ok, dup or '-',
        [q['id'] for q in qs if q.get('is_new')] or '-', [q['id'] for q in qs if q.get('review_flag')] or '-'))
    print("   errors:", errs or 'none')
    if errs or not split_ok or dup: allok=False
print("\nALL OK" if allok else "\nISSUES FOUND")
