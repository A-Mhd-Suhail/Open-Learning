export const EXAMS = ["JEE", "NEET", "School"] as const;
export type Exam = (typeof EXAMS)[number];

export type Video = {
  id: string;
  video_id: string;
  exam: Exam;
  class: string | null;
  subject: string;
  chapter: string;
  topic: string | null;
  year: number | null;
  title: string;
  youtube_url: string;
  thumbnail_url: string | null;
  description: string | null;
  language: string | null;
  created_at: string;
};

/** Spreadsheet columns, in template order. */
export const COLUMNS = [
  "Video ID", "Exam", "Class", "Subject", "Chapter", "Topic",
  "Year", "Video Title", "YouTube Link", "Thumbnail URL", "Description", "Language",
] as const;

export const CATEGORY_TO_EXAM: Record<string, Exam> = { jee: "JEE", neet: "NEET", school: "School" };
