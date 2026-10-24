// Q-Net 원문 접근 차단: 공식 원문 대조 미완료. docs/verification.md 참조.
export const PROFILE = {
  name: "정보처리기사", bankId: "main", questionCount: 100,
  durationMinutes: 150, questionsPerSubject: 20, choiceCount: 4,
  passScore: 60, subjectCutoff: 40,
  subjects: ["소프트웨어 설계", "소프트웨어 개발", "데이터베이스 구축", "프로그래밍 언어 활용", "정보시스템 구축관리"],
  rulesStatus: "pending-official-source",
  rulesSource: "https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=1320",
  storageKey: "information-processing-engineer-cbt:v1",
} as const;
