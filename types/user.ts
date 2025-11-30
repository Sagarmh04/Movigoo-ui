export type UserRole = "user" | "organizer" | "admin";

export type User = {
  id: string;
  name: string;
  role: UserRole;
  email: string;
};

