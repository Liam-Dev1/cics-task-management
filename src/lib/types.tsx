export type User = { 
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "user" | "admin" | "super admin";
    isActive: boolean;
  }