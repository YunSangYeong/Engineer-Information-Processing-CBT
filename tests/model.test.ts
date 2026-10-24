import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  answerExam,
  BASE_BANK,
  checkPractice,
  createExam,
  emptyStore,
  fingerprint,
  grade,
  importQuestions,
  nextPractice,
  parseCsv,
  remainingSeconds,
  restoreStore,
  startPractice,
  SUBJECTS,
  submitExam,
  validateQuestion,
  type Question,
} from "../src/model";
const bank = BASE_BANK;
describe("문제은행 품질", () => {
  it("1000개 자체 제작·5과목 각200개·중복 없음·부족0개 집계", () => {
    expect(bank).toHaveLength(1000);
    expect(new Set(bank.map(q => q.id)).size).toBe(1000);
    expect(new Set(bank.map(fingerprint)).size).toBe(1000);
    for (const subject of SUBJECTS) expect(bank.filter(q=>q.subject===subject)).toHaveLength(200);
    expect(bank.filter(q=>q.type!=="original" || q.family)).toHaveLength(0);
    expect(1000-bank.length).toBe(0);
  });
  it("기존 100문항의 ID·보기·정답·해설 및 전체 메타데이터 보존", () => {
    expect(createHash("sha256").update(JSON.stringify(bank.slice(0,100))).digest("hex"))
      .toBe("6f99d1e1b9eae6fe36e4d304176f85b0bb1584b66c7f20c7a1964989d9bb30e7");
  });
  it("추가900개는 고유 학습목표·오답별 구별 해설을 가지며 숫자변형이 아니다", () => {
    const added=bank.slice(100);
    expect(added).toHaveLength(900);
    expect(new Set(added.map(q=>q.learningObjective)).size).toBe(900);
    for (const q of added) {
      expect(q.learningObjective?.split("/").at(-1)).toBe(q.choices[q.answer-1]);
      expect(q.family).toBeUndefined();
      expect(q.calculation).toBeUndefined();
      expect(q.explanation).toContain("다른 보기와의 구별:");
      for (const choice of q.choices) expect(q.explanation).toContain(choice);
    }
  });
  for (const q of bank) it(`문항 검증 ${q.id}`, () => {
    expect(() => validateQuestion(q)).not.toThrow();
    expect(q.year).toBeNull(); expect(q.session).toBeNull();
    expect(q.verificationStatus).toBe("reviewed");
    expect(q.reviewNote).toContain("공식 출제기준 대조 미완료");
    expect(q.rights).toContain("CC BY 4.0");
    expect(q.explanation.length).toBeGreaterThan(30);
  });
});
describe("모의시험 및 절대 시간", () => {
  it("100개 고유 문항을 균형 있게 추출하며 검증 대기는 제외한다", () => {
    const exam = createExam(
      [...bank, { ...bank[0], id: "pending", verificationStatus: "pending" }],
      "main",
      1000,
    );
    expect(exam.questions).toHaveLength(100);
    expect(new Set(exam.questions.map((q) => q.id)).size).toBe(100);
    SUBJECTS.forEach((s) =>
      expect(exam.questions.filter((q) => q.subject === s)).toHaveLength(20),
    );
    expect(exam.deadline).toBe(9001000);
    expect(exam.questions.some((q) => q.id === "pending")).toBe(false);
  });
  it("기본 모의시험에서는 같은 숫자 변형 유형을 중복 출제하지 않는다", () => {
    for (let round = 0; round < 20; round++) {
      const exam = createExam(bank, "main");
      const families = exam.questions.flatMap((q) =>
        q.family ? [q.family] : [],
      );
      expect(new Set(families).size).toBe(families.length);
    }
  });
  it("수입 문항의 유형이 20개 미만이어도 문항 수가 충분하면 100문항 시험을 구성한다", () => {
    const imported = bank.map((q) => ({ ...q, family: `only-${q.subject}` }));
    const exam = createExam(imported, "main");
    expect(exam.questions).toHaveLength(100);
    expect(new Set(exam.questions.map((q) => q.id)).size).toBe(100);
  });
  it("미준비 버전과 과목 문항 부족은 시험 시작을 차단한다", () => {
    expect(() => createExam(bank, "missing" as never)).toThrow();
    expect(() =>
      createExam(
        bank.filter((q) => q.subject !== "소프트웨어 설계"),
        "main",
      ),
    ).toThrow();
  });
  function withCounts(counts: number[]) {
    const exam = createExam(bank, "main");
    SUBJECTS.forEach((subject,i) => exam.questions.filter(q=>q.subject===subject).slice(0,counts[i]).forEach(q=>exam.answers[q.id]=q.answer));
    return exam;
  }
  it("평균 59점 불합격·60점 합격, 모든 과목 40점 경계", () => {
    expect(grade(withCounts([11,12,12,12,12]))).toMatchObject({score:59,passed:false});
    expect(grade(withCounts([8,13,13,13,13]))).toMatchObject({score:60,passed:true,correct:60,wrong:40,unanswered:40});
    expect(grade(withCounts([7,20,20,20,20]))).toMatchObject({score:87,passed:false});
    expect(grade(withCounts([8,20,20,20,20])).passed).toBe(true);
  });
  it("전 과목 미응답과 전체 정답의 경계", () => {
    expect(grade(withCounts([0,0,0,0,0]))).toMatchObject({score:0,passed:false,unanswered:100});
    expect(grade(withCounts([20,20,20,20,20]))).toMatchObject({score:100,passed:true,unanswered:0});
  });
  it("답안 변경을 허용하고 종료 시각 이후 변경은 차단한다", () => {
    let state = { ...emptyStore(), exam: createExam(bank, "main", 1000) };
    const id = state.exam.questions[0].id;
    let s = answerExam(state, id, 1, 2000);
    s = answerExam(s, id, 2, 3000);
    expect(s.exam?.answers[id]).toBe(2);
    s = answerExam(s, id, 3, 9001000);
    expect(s.exam).toBeNull();
    expect(s.results[0].answers[id]).toBe(2);
    expect(s.results[0].reason).toBe("timeout");
  });
  it("새로고침 후 절대 시각으로 복원하고 백그라운드 지연을 더하지 않는다", () => {
    const s = { ...emptyStore(), exam: createExam(bank, "main", 1000) };
    const restored = restoreStore(JSON.stringify(s));
    expect(remainingSeconds(restored.exam!.deadline, 1000)).toBe(9000);
    expect(remainingSeconds(restored.exam!.deadline, 4501000)).toBe(4500);
    expect(remainingSeconds(restored.exam!.deadline, 9000999)).toBe(1);
    expect(remainingSeconds(restored.exam!.deadline, 9001000)).toBe(0);
    expect(remainingSeconds(restored.exam!.deadline, 9999999)).toBe(0);
  });
  it("제출은 한 번만 기록되고 미응답은 오답노트에 들어간다", () => {
    const s = { ...emptyStore(), exam: createExam(bank, "main", 1000) };
    const submitted = submitExam(s, 4000);
    expect(submitted.attempts).toHaveLength(100);
    expect(submitted.wrongIds).toHaveLength(100);
    expect(submitted.results).toHaveLength(1);
    expect(submitExam(submitted, 5000)).toEqual(submitted);
  });
});
describe("랜덤 학습", () => {
  it("한 과목의 모든 문항을 순회하기 전에는 중복이 없다", () => {
    let p = startPractice(bank, "main", "소프트웨어 설계");
    const ids = new Set<string>();
    for (let i = 0; i < 200; i++) {
      expect(ids.has(p.currentId)).toBe(false);
      ids.add(p.currentId);
      p = nextPractice(p, bank);
    }
    expect(ids.size).toBe(200);
    expect(p.subject).toBe("소프트웨어 설계");
  });
  it("즉시 채점·연속 정답·통계를 저장하며 중복 채점을 방지한다", () => {
    const p = startPractice(bank, "main");
    const q = bank.find((q) => q.id === p.currentId)!;
    const s = checkPractice(
      {
        ...emptyStore(),
        wrongIds: [q.id],
        practice: { ...p, selected: q.answer },
      },
      bank,
      1234,
    );
    expect(s.practice).toMatchObject({
      revealed: true,
      streak: 1,
      correct: 1,
      answered: 1,
    });
    expect(s.attempts).toHaveLength(1);
    expect(s.wrongIds).not.toContain(q.id);
    expect(checkPractice(s, bank, 3000)).toEqual(s);
    const next = nextPractice(s.practice!, bank);
    const q2 = bank.find((q) => q.id === next.currentId)!;
    const wrong = checkPractice(
      { ...s, practice: { ...next, selected: (q2.answer % 4) + 1 } },
      bank,
    );
    expect(wrong.practice?.streak).toBe(0);
    expect(wrong.wrongIds).toContain(q2.id);
  });
  it("오답만 선택한 복습에서는 해당 문항만 출제하며 1개 문제도 재학습할 수 있다", () => {
    const p = startPractice(bank, "main", "전체", [bank[0].id]);
    expect(p.currentId).toBe(bank[0].id);
    expect(nextPractice({ ...p, revealed: true }, bank)).toMatchObject({
      currentId: bank[0].id,
      revealed: false,
    });
  });
});
describe("가져오기 및 복구", () => {
  const example = {
    ...bank[0],
    id: "CUSTOM-001",
    question: "사용자가 작성한 고유한 질문",
  };
  it("JSON은 검증 대기로 등록하며 ID 및 보기 순서가 다른 동일 문항을 중복 제거한다", () => {
    expect(importQuestions([example], bank).added[0].verificationStatus).toBe(
      "pending",
    );
    expect(
      importQuestions(
        [
          bank[0],
          {
            ...bank[0],
            id: "OTHER",
            choices: [...bank[0].choices].reverse(),
            answer: 5 - bank[0].answer,
          },
        ],
        bank,
      ),
    ).toMatchObject({ added: [], duplicates: 2 });
  });
  it("CSV의 쉼표·줄바꿈·따옴표를 보존하며 JSON과 동등한 문항을 읽는다", () => {
    const q = { ...example, question: '쉼표, 따옴표 "테스트"\n다음 줄' };
    const { choices, ...rest } = q;
    const entries = {
      ...rest,
      choice1: choices[0],
      choice2: choices[1],
      choice3: choices[2],
      choice4: choices[3],
    };
    const escape = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv =
      Object.keys(entries).join(",") +
      "\n" +
      Object.values(entries).map(escape).join(",");
    const parsed = parseCsv(csv);
    expect(importQuestions(parsed, bank).added[0].question).toBe(q.question);
  });
  it("가짜 연도, 잘못된 정답, 중복 보기, 위험한 출처 URL, 미완결 CSV는 차단한다", () => {
    for (const value of [
      { ...example, year: 2020 },
      { ...example, answer: 5 },
      { ...example, choices: ["a", "a", "b", "c"] },
      { ...example, sourceUrl: "javascript:alert(1)" },
      { ...example, sourceUrl: "https://example.com", session: "1" },
    ])
      expect(() => importQuestions([value], bank)).toThrow();
    expect(() => parseCsv('id,question\n"open')).toThrow();
    expect(() => parseCsv("id,id\nx,x")).toThrow();
    expect(() => parseCsv("id,question\none")).toThrow();
  });
  it("1개 오류라도 전체 등록을 중단한다", () => {
    expect(() =>
      importQuestions(
        [example, { ...example, id: "invalid", answer: 99 }],
        bank,
      ),
    ).toThrow("2번 문항");
  });
  it("존재하는 기록은 보존하고 손상된 저장소 형식은 거부한다", () => {
    expect(restoreStore(null)).toEqual(emptyStore());
    expect(restoreStore(JSON.stringify(emptyStore()))).toEqual(emptyStore());
    expect(() => restoreStore("{bad")).toThrow();
    expect(() =>
      restoreStore(
        JSON.stringify({ ...emptyStore(), exam: { questions: [] } }),
      ),
    ).toThrow();
    expect(() =>
      restoreStore(
        JSON.stringify({ ...emptyStore(), practice: { currentId: "invalid" } }),
      ),
    ).toThrow();
  });
});
