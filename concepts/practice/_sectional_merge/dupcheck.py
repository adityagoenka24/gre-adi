import json,glob,os,re,sys
from difflib import SequenceMatcher
ROOT=os.path.expanduser('~/mnt/GRE Quant Pro/gre-free/pro/bank')
def norm(t):
    t=re.sub(r'<svg.*?</svg>','',t,flags=re.S)
    t=t.lower()
    t=re.sub(r'[^a-z0-9 ]',' ',t)
    return re.sub(r'\s+',' ',t).strip()
def toks(t): return set(norm(t).split())
sec=[];bank=[]
for f in sorted(glob.glob(os.path.join(ROOT,'sectional','*set*.json'))):
    for q in json.load(open(f))['questions']:
        sec.append((q['id'],q['question'],os.path.basename(f)))
for f in sorted(glob.glob(os.path.join(ROOT,'*','*.json'))):
    if f.endswith('index.json') or '/sectional/' in f or '/kmf/' in f: continue
    if 'mixed_bag' in f: continue
    rel=os.path.relpath(f,ROOT)
    try: qs=json.load(open(f))['questions']
    except Exception: continue
    for q in qs: bank.append((q['id'],q.get('question',''),rel))
print('sec',len(sec),'bank(non-mixedbag)',len(bank))
secT=[(i,q,f,toks(q)) for i,q,f in sec]
bankT=[(i,q,f,toks(q)) for i,q,f in bank]
def jac(a,b):
    if not a or not b: return 0
    return len(a&b)/len(a|b)
print('\n=== SEC vs SEC pairs (sim>=0.70) ===')
out=[]
for x in range(len(secT)):
    for y in range(x+1,len(secT)):
        j=jac(secT[x][3],secT[y][3])
        if j>=0.5:
            r=SequenceMatcher(None,norm(secT[x][1]),norm(secT[y][1])).ratio()
            if r>=0.70: out.append((round(r,3),secT[x][0],secT[y][0]))
for r,a,b in sorted(out,reverse=True): print(f'{r}  {a}  <->  {b}')
print(f'({len(out)} pairs)')
print('\n=== SEC vs MAIN BANK (sim>=0.70) ===')
out2=[]
for i,(sid,sq,sf,st) in enumerate(secT):
    for bid,bq,bf,bt in bankT:
        if jac(st,bt)>=0.5:
            r=SequenceMatcher(None,norm(sq),norm(bq)).ratio()
            if r>=0.70: out2.append((round(r,3),sid,bid,bf))
for r,a,b,f in sorted(out2,reverse=True): print(f'{r}  {a}  <->  {b}  ({f})')
print(f'({len(out2)} pairs)')
