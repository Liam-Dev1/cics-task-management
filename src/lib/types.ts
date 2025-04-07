export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "super admin";
  isActive: boolean;
  jobTitle?: string;
}