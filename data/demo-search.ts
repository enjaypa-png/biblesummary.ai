/** Static demo questions and answers for the landing page hero search. */

export interface DemoAnswer {
  question: string;
  answer: string;
  preview: string;
  verses: { reference: string; text: string }[];
}

export const DEMO_QUESTIONS: DemoAnswer[] = [
  {
    question: "Who was Moses?",
    answer:
      "Moses was one of the most important figures in the Bible. He was chosen by God to lead the Israelites out of slavery in Egypt, received the Ten Commandments on Mount Sinai, and guided his people through 40 years in the wilderness toward the Promised Land. He is considered the greatest prophet in the Old Testament and the author of the first five books of the Bible.",
    preview:
      "Moses was one of the most important figures in the Bible. He was chosen by God to lead the Israelites out of slavery in Egypt, received the Ten Commandments on Mount Sinai, and guided his people through 40 years in the wilderness.",
    verses: [
      {
        reference: "Exodus 3:10",
        text: "Come now therefore, and I will send thee unto Pharaoh, that thou mayest bring forth my people the children of Israel out of Egypt.",
      },
      {
        reference: "Deuteronomy 34:10",
        text: "And there arose not a prophet since in Israel like unto Moses, whom the LORD knew face to face.",
      },
    ],
  },
  {
    question: "What is grace?",
    answer:
      "Grace means God giving kindness, love, and forgiveness that we do not deserve and could never earn on our own. It is the foundation of salvation in the Christian faith \u2014 the idea that God offers eternal life as a free gift through Jesus, not because of anything we have done. Grace also refers to the ongoing strength and favor God gives believers each day.",
    preview:
      "Grace means God giving kindness, love, and forgiveness that we do not deserve and could never earn on our own. It is the foundation of salvation in the Christian faith.",
    verses: [
      {
        reference: "Ephesians 2:8\u20139",
        text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
      },
      {
        reference: "Romans 3:24",
        text: "Being justified freely by his grace through the redemption that is in Christ Jesus.",
      },
    ],
  },
  {
    question: "Explain John 3:16",
    answer:
      "John 3:16 is one of the most well-known verses in all of Scripture. It summarizes the core message of the Gospel: God loved the world so deeply that He gave His only Son so that everyone who believes in Him would not be lost but would have eternal life. It shows that salvation is rooted in God\u2019s love and is available to anyone who believes.",
    preview:
      "John 3:16 is one of the most well-known verses in all of Scripture. It summarizes the core message of the Gospel: God loved the world so deeply that He gave His only Son so that everyone who believes in Him would not be lost.",
    verses: [
      {
        reference: "John 3:16",
        text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      },
      {
        reference: "Romans 5:8",
        text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.",
      },
    ],
  },
];

/** Normalize query for matching against demo questions. */
export function matchDemoQuestion(input: string): DemoAnswer | null {
  const normalized = input.trim().toLowerCase().replace(/[?.!]+$/, "").trim();
  return (
    DEMO_QUESTIONS.find(
      (d) => d.question.toLowerCase().replace(/[?.!]+$/, "").trim() === normalized
    ) ?? null
  );
}
