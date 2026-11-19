export type Role = "student" | "admin";
export type Profile = {
  id: string;
  student_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  category: "school" | "jee" | "neet" | null;
  role: Role;
  created_at: string;
  onboarded_at: string | null;
};
