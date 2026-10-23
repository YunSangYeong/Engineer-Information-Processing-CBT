# 검증 및 출처 기록

조사일: 2026-10-23. 대상: 정보처리기사, 저장소 `YunSangYeong/Engineer-Information-Processing-CBT`.

## 공식 자료와 권리

- Q-Net 종목 페이지 `https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=1320`를 실제 요청했다. `curl: (56) CONNECT tunnel failed, response 403`, 목적지 HTTP 000. 원문·첨부 출제기준을 읽지 못했다.
- 5과목·각20문항·150분·4지선다·과목별100점·평균60 및 과락40 설정은 일반 지식에 따른 학습용 설정이다. 공식 원문 대조 완료/최신 출제기준 준수로 표시하지 않는다. 과목별 8개 정답이 40점, 전체 60개 정답이 평균60점이며 과목별 조건도 필요하다.
- 기출 재배포 이용 조건을 확보하지 못했으므로 기출·복원 수록 없음. 허락을 받지 않은 제3자 문항을 복제하지 않았다.
- 자체 제작 100문항은 AI 일반 지식으로 작성했으며 모든 year/session은 null. sourceUrl은 이 문서로 연결한다. 저장소가 외부 정답 증빙이라는 뜻은 아니다.
- 원고, 정답 위치, 오답의 배타성, 해설 문장, 각 과목 분류를 내부 검토했다. 외부 전문가 검수 0건, 공식 출제기준 문서 대조 미실행. 정규화·보기 순서 무관 중복 0건이며 같은 개념의 표현 반복을 내부 검토했다. 동시성·정규화·보안의 근접 주제는 서로 다른 목표를 묻는 문항이다.
- 계산 조건 family/생성 변형은 없다. C 정수 나눗셈 7/2 문제는 정수 몫을 직접 검토했다. 숫자 수량 늘리기용 변형은 만들지 않았다.
- 독립 작성 문항100, 기본 내부검수100, 검증대기0, 기출0, 복원0, 숫자변형0, 목표부족900. 구조 단위 테스트는 전문가 내용 검수를 대체하지 않는다.
- 생성 JSON SHA256: `63037960614f2ed3c6a72bacc3a0ea13f8e83ed51ce24089e193465438ed9dfe`. 원고 재실행으로 동일 바이트 확인.

## 검증 환경

작업 디렉터리 `/workspace/Engineer-Information-Processing-CBT`. Node 24.19.0, npm 11.9.0, TypeScript 5.9.3, Vite 7.3.7. npm ci는 잠금 파일 무결성을 유지했다. 처음 기본 npm cache가 샌드박스 밖이라 ENOENT로 실패했고 `/tmp/cbt-npm-cache`를 지정하여 정상 설치했다. TLS·체크섬·서명 검증을 끄지 않았다.

- `npm test`: 단위 118개 통과. 데이터100개 개별 스키마 검사 포함. 평균59/60 경계·과목35/40 경계·전부미응답/전부정답·100개 추출·pending 제외·절대시간·저장 복구·가져오기 원자성·중복 처리·랜덤 순회·오답 해제 확인.
- `npm run build`: TypeScript 및 Vite 프로덕션 빌드 통과.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium ./node_modules/.bin/playwright test`: Chromium 데스크톱과 Pixel 7 모바일 에뮬레이션. 최종 32개 중 **30개 통과·2개 명시적 건너뜀·실패0·flaky0**, 종료 코드0. 소요46.99초. Chromium 154.0.8037.57.
- 브라우저 검사는 실제 버튼·keydown/keyup·파일 등록·JSON/CSV·다운로드·타이머 가상 시간·새로고침·결과·통계·초기화·저장 손상/쿼터 실패를 포함한다. 150분 실제 벽시계 대기는 하지 않았다.
- 390×480 및 740×360 메뉴에서 실제 mouse.wheel 아래/위, 하단 초기화 클릭·상단 대시보드 클릭, 배경 비이동 확인. 모바일 프로젝트에서는 CDP touchStart/move/end 스와이프로 아래/위 이동 후 하단 백업 탭 및 상단 대시보드 탭 확인. scrollTop을 코드로 설정하지 않았다.
- 짧은 데스크톱1000×360 창에 메뉴 글자24px 확대 후 실제 휠 확인. 메뉴 애니메이션 이후 입력했다. 터치가 없는 데스크톱 프로젝트의 터치 전용2개는 명시적으로 건너뛴다.
- 상단 비공식/미검증 배너 부재·학습 기준 메뉴 부재 확인. 통계의 기록 보존 범위 안내는 면책 배너가 아니므로 유지한다. 저장 실패 경고 유지 확인.
- PC/모바일 대시보드·랜덤 캡처를 확인했다. 스크린샷은 무시되는 test-results에 생성한다. 실기기·Safari·Firefox·실제 모바일 주소창 변화·블로그 iframe 내부 동작은 미실행.

## 배포 사전 확인 및 중단

- GitHub 읽기 및 `git push --dry-run origin HEAD:main`: 성공. dry-run은 파일 반영이나 workflow 실행을 하지 않는다. 새 파일을 포함한 실제 push 성공을 보장하는 검사로 해석하지 않는다.
- Pages 설정 GET `https://api.github.com/repos/YunSangYeong/Engineer-Information-Processing-CBT/pages`: 첫 요청에서 CONNECT403, 목적지HTTP000. 네트워크 터널의 거부이며 GitHub 저장소 권한/Pages 설정 응답은 받지 못했다.
- 요청한 첫 차단 중단 정책 적용. main push·workflow 수동 실행·CI·configure-pages·deploy는 미실행. 재시도0. 공개 URL 접근도 미실행이며 기존 게시 여부 미확인.
- `codex/information-processing-cbt` 브랜치는 코드 보존 용도다. push 자동 실행은 main에만 정의되어 있으므로 이 브랜치 push는 배포하지 않는다. 다른 프로젝트에는 쓰기 작업하지 않았다.
- 필요한 사용자 첫 동작: 환경 네트워크 허용 목록에 `api.github.com`을 추가하고 저장. 이후 사용자가 직접 마무리한다. Pages 설정 미확인 상태이므로 지금 Source 변경이 필요하다고 단정하지 않는다.
