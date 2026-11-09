import json,collections,glob,sys
REQ=['id','difficulty','type','question','options','answer','explanation','trap','estimated_time_seconds','tags']
QC=["A. Quantity A is greater.","B. Quantity B is greater.","C. The two quantities are equal.","D. The relationship cannot be determined from the information given."]
paths=sys.argv[1:] or sorted(glob.glob('patches/*.json'))
allok=True
for p in paths:
    try: d=json.load(open(p))
    except Exception as e: print(p,'BROKEN JSON',e); allok=False; continue
    qs=d['questions']; errs=[]; advisories=[]
    for q in qs:
        for f in REQ:
            if f not in q: errs.append((q.get('id'),'missing '+f))
        t=q.get('type')
        if t=='numeric_entry' and q.get('options') is not None: errs.append((q['id'],'NE options not null'))
        if t=='quantitative_comparison' and q.get('options')!=QC: errs.append((q['id'],'QC options nonstandard'))
        if t=='mcq' and len(q.get('options') or [])!=5: errs.append((q['id'],'mcq opt count'))
        if t=='multiple_answer' and not 3<=len(q.get('options') or [])<=8: errs.append((q['id'],'ma opt count'))
        if t=='multiple_answer':
            a=q.get('answer')
            n=len(q.get('options') or [])
            if not isinstance(a,list) or not (2<=len(a)<=max(2,n-1)): errs.append((q['id'],'MA answer size '+str(a)+f' of {n}'))
        elif t in('mcq','quantitative_comparison') and q.get('answer') not in list('ABCDE'): errs.append((q['id'],'bad key'))
        # Notation is NOT a defect: gre-math.js renders x^2 / x\u00b2, sqrt(5) / \u221a5 and
        # <= / \u2264 identically, and ETS_RUBRIC says so explicitly. Reported as an
        # advisory, never an error -- when these counted as errors there were ~4,400
        # of them, the real failures drowned, and three validator bugs plus 30 broken
        # figures survived unnoticed because nobody read the output.
        # Judged by Unicode category, not a hand-list: maths symbols (Sm), currency
        # (Sc), modifiers (Sk), Greek (names starting GREEK), super/subscripts,
        # vulgar fractions, dashes (Pd) and combining marks (Mn, e.g. the repeating
        # -decimal bar) are all expected. Anything else is a real typo.
        def _mathok(ch):
            import unicodedata as _u
            if _u.category(ch) in ('Sm', 'Sc', 'Sk', 'Pd', 'Mn'):
                return True
            try:
                nm = _u.name(ch)
            except ValueError:
                return False
            return (nm.startswith('GREEK ') or 'SUPERSCRIPT' in nm or 'SUBSCRIPT' in nm
                    or 'VULGAR FRACTION' in nm or nm.startswith('SQUARE ROOT')
                    or nm.startswith('CUBE ROOT') or nm.startswith('FOURTH ROOT')
                    or nm in ('DEGREE SIGN', 'CHECK MARK', 'BALLOT X', 'INFINITY',
                              'UP TACK', 'MULTIPLICATION SIGN', 'DIVISION SIGN',
                              'BLACK DIAMOND', 'RIGHTWARDS ARROW', 'EM DASH',
                              'MIDDLE DOT', 'HORIZONTAL ELLIPSIS',
                              'LEFT FLOOR', 'RIGHT FLOOR',
                              'LEFT CEILING', 'RIGHT CEILING'))
        nonascii = set(ch for ch in (q.get('question', '') + q.get('explanation', '')
                                     + q.get('trap', '')) if ord(ch) > 127)
        odd = {ch for ch in nonascii if not _mathok(ch)}
        if nonascii: advisories.append((q['id'], 'non-ascii ' + repr(''.join(sorted(nonascii)))))
        if odd: errs.append((q['id'], 'unexpected non-ascii ' + repr(''.join(sorted(odd)))))
    dif=collections.Counter(q['difficulty'] for q in qs)
    typ=collections.Counter(q['type'] for q in qs)
    dup=[i for i,c in collections.Counter(q['id'] for q in qs).items() if c>1]
    split_ok = (len(qs)==30 and dif['easy']==5 and dif['medium']==8 and dif['hard']==12 and dif['extreme_hard']==5)
    print("%-16s n=%-3d %s %s" % (p.split('/')[-1], len(qs), dict(dif), dict(typ)))
    print("   split_ok=%s dup=%s new=%s flagged=%s" % (split_ok, dup or '-',
        [q['id'] for q in qs if q.get('is_new')] or '-', [q['id'] for q in qs if q.get('review_flag')] or '-'))
    if advisories: print("   advisory: %d items use math notation (rendered by gre-math.js; not defects)" % len(advisories))
    print("   errors:", errs or 'none')
    if errs or not split_ok or dup: allok=False
print("\nALL OK" if allok else "\nISSUES FOUND")
