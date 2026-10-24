"""등록 JSON과 작성 원고를 대조하는 읽기 전용 감사. --write이면 보고서만 저장한다."""
import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_LEGACY_HASH = '6f99d1e1b9eae6fe36e4d304176f85b0bb1584b66c7f20c7a1964989d9bb30e7'
# 실제 후보를 읽고 각 학습 목표를 검토한 결과. 알고리즘이 의미 중복을 판정한 것이 아니다.
DECISIONS = {
 ('IPE-3-103','IPE-3-104'): 'WHERE 없는 UPDATE의 전체 수정과 DELETE의 전체 삭제를 각각 구분한다.',
 ('IPE-5-016','IPE-5-017'): 'RPO의 데이터 손실 시점과 RTO의 서비스 복구 소요 시간을 구분한다.',
 ('IPE-4-014','IPE-4-015'): 'TCP와 UDP의 서로 다른 전송 보장 특성을 구분한다.',
 ('IPE-3-081','IPE-3-082'): 'LEFT OUTER JOIN과 RIGHT OUTER JOIN의 보존 방향이 다르다.',
 ('IPE-4-006','IPE-5-005'): '질문 어미만 비슷하며 프로세스와 대칭키 암호의 다른 개념이다.',
 ('IPE-5-155','IPE-5-156'): 'RAID 5와 RAID 6의 서로 다른 패리티·장애 허용 방식을 구분한다. 숫자만 바꿔 같은 수식에 넣은 변형이 아니다.',
 ('IPE-3-089','IPE-3-090'): 'EXISTS와 NOT EXISTS의 서로 다른 존재 조건을 구분한다.',
 ('IPE-3-091','IPE-3-092'): 'ANY의 존재 비교와 ALL의 전칭 비교를 구분한다.',
 ('IPE-3-018','IPE-5-013'): '일반적인 설명이라는 질문 틀만 비슷하며 SQL 뷰와 침입 탐지·차단의 다른 개념이다.',
 ('IPE-4-090','IPE-4-091'): '*args의 위치 인자 튜플과 **kwargs의 키워드 인자 딕셔너리를 구분한다.',
 ('IPE-2-059','IPE-2-060'): '방향 그래프의 진입 차수와 진출 차수는 다른 지표이다.',
 ('IPE-3-066','IPE-3-067'): 'LIKE의 한 문자 패턴과 임의 길이 패턴이라는 서로 다른 연산 의미를 구분한다.',
 ('IPE-3-054','IPE-3-056'): '관계대수 합집합과 교집합은 서로 다른 집합 연산이다.',
 ('IPE-1-096','IPE-1-097'): '상태 진입 동작과 이탈 동작은 실행 시점과 목적이 다르다.',
}


def normalize(text):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', text)).lower()


def grams(stem):
    stem = normalize(stem.replace('다음 설명에 가장 정확히 해당하는 항목은?', ''))
    return {stem[i:i + 3] for i in range(len(stem) - 2)}


def audit():
    data_path = ROOT / 'src/data/questions-main.json'
    data = json.loads(data_path.read_text())
    assert len(data) == 1000
    assert len({q['id'] for q in data}) == 1000
    assert len({normalize(q['question']) for q in data}) == 1000
    assert len({normalize('|'.join([q['question'], *sorted(q['choices'])])) for q in data}) == 1000
    legacy = json.dumps(data[:100], ensure_ascii=False, separators=(',', ':'))
    assert hashlib.sha256(legacy.encode()).hexdigest() == EXPECTED_LEGACY_HASH
    by_id = {q['id']: q for q in data}
    subjects = list(dict.fromkeys(q['subject'] for q in data[:100]))
    expected_ids = {f'IPE-{s}-{i:03d}' for s in range(1, 6) for i in range(1, 201)}
    assert set(by_id) == expected_ids
    assert Counter(q['subject'] for q in data) == {s: 200 for s in subjects}
    for q in data:
        assert len(q['choices']) == len({normalize(c) for c in q['choices']}) == 4
        assert type(q['answer']) is int and 1 <= q['answer'] <= 4
        assert q['type'] == 'original' and q['verificationStatus'] == 'reviewed'
        assert q['year'] is None and q['session'] is None
        assert 'CC BY 4.0' in q['rights']
        assert '공식 출제기준 대조 미완료' in q['reviewNote']
        assert not q.get('family') and not q.get('calculation')
    objective_ids = set()
    topic_counts = []
    for si in range(1, 6):
        groups = (ROOT / f'scripts/manuscripts/subject-{si}.txt').read_text().split('## ')[1:]
        number = 20
        for group in groups:
            lines = group.strip().splitlines()
            topic = lines[0]
            entries = dict(line.split('|') for line in lines[1:])
            assert len(entries) == 6
            topic_counts.append({'subject': subjects[si-1], 'topic': topic, 'added': 6})
            for term, definition in entries.items():
                number += 1
                q = by_id[f'IPE-{si}-{number:03d}']
                assert q['subject'] == subjects[si-1] and q['topic'] == topic
                assert q['question'].split('\n', 1)[1] == definition
                assert q['choices'][q['answer']-1] == term
                assert set(q['choices']) <= set(entries)
                assert q['learningObjective'] not in objective_ids
                objective_ids.add(q['learningObjective'])
                for choice in q['choices']:
                    assert f'{choice}' in q['explanation'] and entries[choice] in q['explanation']
    assert len(objective_ids) == 900
    candidates = []
    all_grams = [grams(q['question']) for q in data]
    for i in range(len(data)):
        for j in range(i):
            score = len(all_grams[i] & all_grams[j]) / max(1, len(all_grams[i] | all_grams[j]))
            if score < .38:
                continue
            ids = (data[j]['id'], data[i]['id'])
            # JSON order, not string sort, is part of the original IDs preservation contract.
            assert ids in DECISIONS, f'새 유사 후보를 검토해야 합니다: {ids}'
            candidates.append({'ids': ids, 'characterTrigramJaccard': round(score, 3),
                               'internalDisposition': 'distinct-learning-targets', 'reason': DECISIONS[ids]})
    report = {
        'bankSha256': hashlib.sha256(data_path.read_bytes()).hexdigest(),
        'count': len(data), 'target': 1000, 'shortfall': 0,
        'perSubject': dict(Counter(q['subject'] for q in data)),
        'types': dict(Counter(q['type'] for q in data)),
        'past': 0, 'reconstructed': 0, 'numericVariants': 0, 'numericFamilies': 0,
        'internalReviewed': 1000, 'pending': 0, 'expertReviewed': 0,
        'officialCriteriaCrossCheck': 'not-completed',
        'exactNormalizedDuplicates': 0, 'legacy100Preserved': True,
        'authorship': 'AI general knowledge; original educational material; no external source claimed',
        'reviewLimit': 'Internal AI editorial recheck and structural audit. Similarity candidates are manually dispositioned by this agent; neither expert validation nor a semantic-duplicate guarantee.',
        'addedLearningObjectives': len(objective_ids), 'addedTopicGroups': topic_counts,
        'nearTextCandidates': candidates,
    }
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    report = audit()
    if args.write:
        (ROOT / 'docs/bank-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ['addedTopicGroups','nearTextCandidates']},ensure_ascii=False,indent=2))
    print(f'검토한 텍스트 유사 후보: {len(report["nearTextCandidates"])}쌍')
