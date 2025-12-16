// lib/fakeAuth.ts
// Simulated authentication system (no Firebase Auth)

export type FakeUser = {
  id: string;
  name: string;
  email: string;
};

export function fakeLogin(user: FakeUser | null = null): FakeUser {
  const fakeUser: FakeUser = user ?? {
    id: "demo-user",
    name: "Demo User",
    email: "demo@example.com"
  };
  
  if (typeof window !== "undefined") {
    localStorage.setItem("movigoo_user", JSON.stringify(fakeUser));
  }
  
  return fakeUser;
}

export function fakeGetUser(): FakeUser | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem("movigoo_user");
    if (!stored) return null;
    return JSON.parse(stored) as FakeUser;
  } catch {
    return null;
  }
}

export function fakeLogout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("movigoo_user");
  }
}

