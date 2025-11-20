export interface NewsDetails {
  id: number;
  title: string;
  description: string | null;
  author: string | null;
  date: string | null; // ISO timestamp string
  content: string | null;
  link: string | null;
  imageLink: string | null;
}
