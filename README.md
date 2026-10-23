# 정보처리기사 필기 CBT

React · TypeScript · Vite 기반 비공식 학습 앱. 전기기능사 CBT의 화면과 기능을 재사용하고 정보처리기사 전용 설정·데이터·저장 키를 적용했다.

**현재 한계:** 기본 자체 제작 내부 검수 문항 100개, 목표 1,000개 대비 **900개 부족**. 공식 규칙·출제기준 원문 대조와 외부 전문가 검수는 미완료다. 표준 수량 충족이나 공식 시험의 출제 난이도 재현을 주장하지 않는다.

## 기능

- 대시보드, 실전 모의시험, 랜덤 문제풀이, 오답노트, 북마크, 과목별 통계, 문제은행 관리.
- 한 문제씩 표시, 답안 변경·번호 이동, 절대 종료 시각 기반 타이머, 만료 자동 제출, 결과·과목별 과락·전체 해설·오답 복습.
- 실전은 선택 후, 랜덤은 즉시 채점 후 Space로 다음 문제 이동. 미응답·길게 누르기·수정키·입력·메뉴·대화상자 보호. 마지막 문제에서 자동 제출하지 않는다.
- 학습 기준/버전 선택 메뉴 없음. 상단 상시 면책 배너 없음. 비공식 표시는 사이드바와 푸터, 상세 확인 상태는 문제은행과 문서에서 제공한다. 저장 실패·손상 경고는 유지한다.
- 작은 높이·가로 화면에서도 메뉴 독립 스크롤. 실제 휠·터치 입력 회귀 검사 포함.
- JSON/CSV 가져오기·양식 다운로드·중복 제거·검증 대기·근거 입력 후 로컬 승인·검색·필터·페이지·내보내기.

## 시험 설정과 확인 상태

`src/profile.ts`에 규칙을 모았다. **아래는 학습 앱에 적용한 설정이며 공식 원문 확인 완료가 아니다.**

| 항목 | 앱 설정 |
| --- | --- |
| 과목 | 소프트웨어 설계 / 소프트웨어 개발 / 데이터베이스 구축 / 프로그래밍 언어 활용 / 정보시스템 구축관리 |
| 출제 | 각 20문항, 전체 100문항, 객관식 4지선다 |
| 시간 | 150분 |
| 배점 | 각 과목 100점, 문항당 과목 점수 5점; 전체 점수는 5과목 평균 |
| 합격 | 평균 60점 이상 및 **모든 과목 40점 이상** |
| 미응답 | 오답 처리, 결과 오답 수에 포함 |

확인 대상은 [Q-Net 정보처리기사 종목 정보](https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=1320). 2026-10-23 원문 요청이 프록시 CONNECT 403으로 차단되었다. 최신 출제기준 문서를 읽지 못했으며 유효 연도나 문서 판을 임의로 만들지 않았다. [검증 기록](docs/verification.md)을 참고한다.

## 실제 문제은행

| 과목 | 자체 제작 내부 검수 | 기출 | 복원 |
| --- | ---: | ---: | ---: |
| 소프트웨어 설계 | 20 | 0 | 0 |
| 소프트웨어 개발 | 20 | 0 | 0 |
| 데이터베이스 구축 | 20 | 0 | 0 |
| 프로그래밍 언어 활용 | 20 | 0 | 0 |
| 정보시스템 구축관리 | 20 | 0 | 0 |
| 합계 | **100** | **0** | **0** |

- 기본 등록 100개, 내부 검수 100개, 검증 대기 0개, 중복 0개, 숫자 조건 변형 0개. 독립 작성 문항 100개이며 외부 전문가가 검수한 수는 0개다.
- 생성 원고는 `scripts/generate-bank.py`, 기본 데이터는 `src/data/questions-main.json`. 순서·ID·보기 배치는 결정적이다. 각 정답·오답·해설 문장을 내부 검토했으나 자동 구조 검증이 내용의 정답성을 보증하지 않는다.
- AI 일반 지식을 바탕으로 직접 작성했다. 읽지 않은 교재나 공식 자료를 문항 근거로 인용하지 않는다. 각 문항의 저장소 링크는 작성·검토 기록이지 외부 정답 증빙이 아니다.
- 기출 원문·연도·회차·이용 허락을 확인하지 못했으므로 기출·복원은 수록하지 않았다. 모든 연도·회차는 null. 공개 민간 문제 사이트를 대량 복제하지 않았다.
- ID 및 NFKC 정규화 본문·정렬된 보기로 중복을 검사했다. 원고별 의미 중복 내부 검토를 수행했으나 외부 전문가/의미 유사도 모델 검수는 없다. 반복 주제의 서로 다른 학습 요소는 독립 문항으로 남겼다.
- 1회 모의시험 분량은 제공하지만 각 과목의 기본 문제은행은 20개뿐이므로 매 시험에 동일 문항이 순서만 달라져 출제된다. 이는 1,000문항 완성을 대체하지 않는다. 추가 900문항은 권리와 정답 근거를 확인한 뒤 별도 작성·검수해야 한다.
- 새 자체 제작 데이터와 양식은 CC BY 4.0, 앱 코드는 MIT. 외부 가져오기 자료의 권리는 이용자가 별도로 확인해야 한다. 상세는 [LICENSE](LICENSE).

## 로컬 개발

Node.js 24.19.0 (`.node-version`), npm lockfile 사용. 기존 체크아웃을 이용하며 별도 worktree를 만들 필요가 없다.

```bash
cd /workspace/Engineer-Information-Processing-CBT
npm ci --cache /tmp/cbt-npm-cache --no-audit --no-fund
npm run dev -- --port 5173
```

```bash
npm test
npm run build
# 이 클라우드에는 시스템 Chromium이 설치되어 있다.
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
# 시스템 Chromium이 없는 일반 환경/CI에서는 먼저 실행:
# npx playwright install --with-deps chromium
```

프로덕션 base는 `/Engineer-Information-Processing-CBT/`. `npm run preview -- --port 4173 --strictPort`로 프로덕션 산출물을 로컬 확인한다.

```bash
python3 scripts/generate-bank.py
```

재생성은 같은 원고에서 같은 JSON·CSV 양식을 만든다. 기본 JSON을 직접 변경하기보다는 원고 변경 후 검수한다. 기존 문항 ID를 임의 재사용하거나 풀이 기록 참조를 바꾸지 않는다.

## 기록 보존

저장 키는 `information-processing-engineer-cbt:v1`. 같은 GitHub Pages origin의 전기기능사 기록과 분리된다. 최근 응답 5,000개·시험 30회, 진행 중 시험·랜덤 세션·오답·북마크·개인 등록을 localStorage에 저장한다. 통계는 보존된 응답 범위 기준이다. 로그인·서버 동기화 없음. JSON 백업 내보내기를 지원하나 **백업 복원 UI는 없다**. 초기화는 확인 후 개인 기록·로컬 등록만 지우고 기본 문항은 유지한다. 손상된 원본은 자동 덮어쓰지 않는다. 다른 브라우저·origin·시크릿·iframe 저장 제한에 따라 기록 이용 범위가 달라질 수 있다.

## 표준과 테스트

최신 표준 스킬은 `YunSangYeong/electrician-cbt` main의 `76b990b8720adfa85c22a0a8f699b17094aa357b`에서 폴더 전체를 복사했다. 버전 1.4.0을 적용한다. 앱 코드는 표준이 고정한 `b9a682ccff1b460334b78d5bfad9375b7ec4fbb6`의 App/model/styles·설정·테스트·workflow를 재사용·수정했다. 원본 저장소는 수정하거나 재배포하지 않았다. 기존 AGENTS.md가 없어 연결 문서를 새로 만들었다.

검사 명령·수·실행 범위는 [검증 기록](docs/verification.md)에 있다. 실기기·Safari 검사는 수행하지 않았다.

## GitHub 및 배포 상태

`.github/workflows/pages.yml`: **main push → validate 성공 → Pages 자동 배포**, PR은 검증만, 배포 job만 pages/id-token 쓰기 권한을 갖는다. 자동 재시도 없음. push 실행이 있으면 수동 실행을 추가하지 않는다.

이번 배포 사전 확인에서 `git push --dry-run origin HEAD:main`은 통과했지만, GitHub Pages 설정 조회가 아래처럼 처음 차단되었다.

```text
GET https://api.github.com/repos/YunSangYeong/Engineer-Information-Processing-CBT/pages
curl: (56) CONNECT tunnel failed, response 403
HTTP tunnel: 403 Forbidden; destination HTTP: 000
```

사용자의 첫 차단 중단 지시에 따라 **main 반영·CI·Pages 배포는 실행하지 않았다**. 다른 배포 경로·workflow 재실행·추가 배포 푸시도 없다. 코드 보존 전용 브랜치는 `codex/information-processing-cbt`이며 main push 트리거에 해당하지 않는다. Pages의 실제 Source·기존 게시 여부·공개 화면은 확인하지 못했다. 403을 Pages 미설정 404로 해석하지 않는다.

사용자가 지금 할 최소 동작: 클라우드 환경의 네트워크 허용 도메인에 **`api.github.com` 추가 후 저장**. 이후 배포 마무리는 사용자에게 넘기며 에이전트는 재시도하지 않는다. 공식 시험 자료 조사에는 별도로 `www.q-net.or.kr` 접근 허용이 필요하다.

배포 시 예상 기본 주소: `https://YunSangYeong.github.io/Engineer-Information-Processing-CBT/` — **현재 게시 성공 또는 공개 화면 확인을 뜻하지 않는다**.
