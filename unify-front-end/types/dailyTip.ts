export interface DailyTip {
  id: string;
  persona: string;
  stage: string;
  date: string;
  category: string;
  title: string;
  description: string;
  tipText: string;
  sourceRefs: { document_title: string; url: string }[] | null;
}
