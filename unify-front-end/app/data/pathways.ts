export type Lesson = { id: string; title: string };

//This is for the sub-module-presentations
export type Module = {
  id: string;                    // e.g. "m1"
  subtitle: string;              // e.g. "Mastering Banking in Canada"
  lessonsCount: number;          // display only
  progress: number;              // 0..1
  objectives: string[];          // for Module Overview bullet list
  currentLessonId?: string;      // which lesson to resume
  lessons?: Lesson[];            // optional until you wire topics
};

export type Pathway = {
  id: string;                    // e.g. "finance"
  title: string;                 // e.g. "Finance for Newcomers"
  description: string;
  modules: Module[];
};

//example (temp data)
export const PATHWAYS: Pathway[] = [
  {
    id: "finance",
    title: "Finance for Newcomers",
    description:
      "Empower newcomers to confidently manage their money, build financial stability, and grow long-term wealth in Canada.",
    modules: [
      {
        id: "m1",
        subtitle: "Mastering Banking in Canada",
        lessonsCount: 6,
        progress: 0.25,
        objectives: [
          "Know information about the major banking institutions available in Canada",
          "Know how to navigate various financial accounts you will need to settle in",
          "Know how to take action and open or close certain financial accounts",
        ],
        currentLessonId: "l1",
        lessons: [
          { id: "l1", title: "Choosing a Bank" },
          { id: "l2", title: "Account Types" },
          { id: "l3", title: "Fees & Limits" },
        ],
      },
      {
        id: "m2",
        subtitle: "Budgeting & Tracking",
        lessonsCount: 5,
        progress: 0,
        objectives: [
          "Build a starter budget",
          "Track expenses realistically",
          "Cut costs without harming essentials",
        ],
      },
      
      //Here we can add the other modules 
      
    ],
  },
];

export function getPathway(pathId: string) {
  return PATHWAYS.find(p => p.id === pathId);
}

export function getModule(pathId: string, moduleId: string) {
  const p = getPathway(pathId);
  const m = p?.modules.find(m => m.id === moduleId);
  return { pathway: p, module: m };
}