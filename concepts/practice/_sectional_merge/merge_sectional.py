#!/usr/bin/env python3
"""Append the sectional (KMF-derived) questions into the main topic/subtopic bank.

Source of truth : gre-free/pro/bank/sectional/*_set*.json  (unchanged by this script)
Targets         : the subtopic file named by mapping.tsv, plus that topic's mixed bag
Mapping         : mapping.tsv  ->  "<SEC id>\t<subtopic_id>"

Questions keep their SEC-xxx ids, so a question appears once in the sectional set and
once in the main bank under the same id. Two provenance fields are added:
  origin      = "sectional"
  origin_set  = e.g. "algebra_set4"

Idempotent: a question already present (by id) in a target file is skipped.
Run with --apply to write; default is a dry run.
"""
import json, os, sys, glob, collections

BANK = os.path.expanduser('~/mnt/GRE Quant Pro/gre-free/pro/bank')
HERE = os.path.dirname(os.path.abspath(__file__))
APPLY = '--apply' in sys.argv
DIFFS = ['easy', 'medium', 'hard', 'extreme_hard']
TODAY = '2026-09-26'


def load(p):
    with open(os.path.join(BANK, p), encoding='utf-8') as f:
        return json.load(f)


def save(p, data):
    path = os.path.join(BANK, p)
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.write('\n')
    os.replace(tmp, path)


index = load('index.json')

# subtopic_id -> [(topic, subtopic name, file)] ; REM/ABS appear twice (mirrored files)
targets = collections.defaultdict(list)
mixedbag = {}
for topic, subs in index['topics'].items():
    for name, m in subs.items():
        targets[m['id']].append((topic, name, m['file']))
        if '_mixed_bag' in os.path.basename(m['file']):
            mixedbag[topic] = m['file']

# arithmetic/remainders.json and number_properties/remainders.json are byte-identical
# mirrors of each other (same for absolute_value.json), and the bank keeps them that way.
# A question filed under NUM-REM/NUM-ABS therefore has to land in both copies.
MIRRORS = {'NUM-REM': ['ARI-REM'], 'NUM-ABS': ['ARI-ABS']}
for code, also in MIRRORS.items():
    for other in also:
        for t in targets.get(other, []):
            if t not in targets[code]:
                targets[code].append(t)

# the sectional questions, with provenance
sec = {}
for f in sorted(glob.glob(os.path.join(BANK, 'sectional', '*_set*.json'))):
    setname = os.path.basename(f)[:-5]
    for q in json.load(open(f, encoding='utf-8'))['questions']:
        q = dict(q)
        q['origin'] = 'sectional'
        q['origin_set'] = setname
        sec[q['id']] = q

mapping = []
for line in open(os.path.join(HERE, 'mapping.tsv'), encoding='utf-8'):
    line = line.strip()
    if not line:
        continue
    qid, code = line.split('\t')
    mapping.append((qid, code))

# ---- validate the mapping before touching anything -------------------------
errs = []
for qid, code in mapping:
    if qid not in sec:
        errs.append(f'unknown question id {qid}')
    if code not in targets:
        errs.append(f'unknown subtopic id {code} (for {qid})')
seen = collections.Counter(q for q, _ in mapping)
for qid, n in seen.items():
    if n > 1:
        errs.append(f'{qid} mapped {n} times')
for qid in sec:
    if qid not in seen:
        errs.append(f'{qid} is not mapped')
if errs:
    print('MAPPING ERRORS:')
    for e in errs[:40]:
        print('  ', e)
    sys.exit(1)
print(f'mapping OK: {len(mapping)} questions -> {len({c for _, c in mapping})} subtopics')

# ---- plan: file -> list of questions to append ----------------------------
plan = collections.OrderedDict()
for qid, code in mapping:
    for topic, name, path in targets[code]:
        plan.setdefault(path, []).append(qid)
        mb = mixedbag.get(topic)
        if mb:
            plan.setdefault(mb, []).append(qid)

# ---- prune sectional questions sitting in a file they no longer belong in ---
PRUNE = '--prune' in sys.argv
if PRUNE:
    allfiles = {m['file'] for subs in index['topics'].values() for m in subs.values()}
    for path in sorted(allfiles):
        data = load(path)
        allowed = set(plan.get(path, []))
        keep = [q for q in data['questions']
                if q.get('origin') != 'sectional' or q['id'] in allowed]
        drop = [q['id'] for q in data['questions'] if q not in keep]
        if drop:
            print(f'  PRUNE {path}: removing {len(drop)} misplaced -> {drop}')
            data['questions'] = keep
            plan.setdefault(path, [])
            if APPLY:
                save(path, data)

# ---- apply ----------------------------------------------------------------
report = []
for path, qids in plan.items():
    data = load(path)
    before = json.dumps(data, sort_keys=True)
    have = {q['id'] for q in data['questions']}
    add = [sec[i] for i in sorted(set(qids)) if i not in have]
    data['questions'].extend(add)
    n = len(data['questions'])
    diffc = collections.Counter(q.get('difficulty') for q in data['questions'])
    typec = collections.Counter(q.get('type') for q in data['questions'])
    # subtopic files carry their counts under "meta"; mixed bags carry them at the
    # top level (and sometimes in both places) -- update every holder that has them.
    for holder in (data, data.get('meta')):
        if not isinstance(holder, dict):
            continue
        if 'total_questions' in holder:
            holder['total_questions'] = n
        if 'distribution' in holder:
            holder['distribution'] = {d: diffc.get(d, 0) for d in DIFFS
                                      if diffc.get(d, 0) or d in holder['distribution']}
        for key in ('types', 'question_types'):
            if key in holder:
                holder[key] = {t: c for t, c in sorted(typec.items()) if t}
    if add:
        holder = data.get('meta') if isinstance(data.get('meta'), dict) else data
        holder['sectional_merged'] = TODAY
        if isinstance(data.get('generated_from'), list):
            for e in data['generated_from']:
                if e.get('file') == 'sectional/':
                    e['count'] = e.get('count', 0) + len(add)
                    break
            else:
                data['generated_from'].append(
                    {'subtopic': 'Sectional sets (KMF-derived)', 'file': 'sectional/', 'count': len(add)})
    # keep index.json in step with the file
    for topic, subs in index['topics'].items():
        for name, m in subs.items():
            if m['file'] == path:
                m['count'] = n
                if 'distribution' in m:
                    m['distribution'] = {d: diffc.get(d, 0) for d in DIFFS
                                         if diffc.get(d, 0) or d in m['distribution']}
    report.append((path, len(add), len(data['questions'])))
    # save whenever anything changed -- a prune with no additions still rewrites meta
    if APPLY and json.dumps(data, sort_keys=True) != before:
        save(path, data)

index['total_questions'] = sum(m['count'] for subs in index['topics'].values() for m in subs.values())
index['last_updated'] = TODAY
if APPLY:
    save('index.json', index)

w = max(len(p) for p, _, _ in report)
for path, added, total in report:
    print(f'  {path:<{w}}  +{added:<4} -> {total}')
print(f'\nfiles touched: {sum(1 for _,a,_ in report if a)} / {len(report)}')
print(f'question-insertions: {sum(a for _,a,_ in report)}')
print(f'index total_questions -> {index["total_questions"]}')
print('DRY RUN (pass --apply to write)' if not APPLY else 'WRITTEN')
