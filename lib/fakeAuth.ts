// lib/fakeAuth.ts
// Simulated authentication system (no Firebase Auth)
// NO default user - user must explicitly login

export type FakeUser = {
  id: string;
  name: string;
  email: string;
};

// Get fake user from localStorage (returns null if not logged in)
export function getFakeUser(): FakeUser | null {
  if (typeof window === "undefined") return null;
  
  try {
    // Try both storage keys for compatibility
    const stored = localStorage.getItem("fakeUser") || localStorage.getItem("movigoo_user");
    if (!stored) return null;
    return JSON.parse(stored) as FakeUser;
  } catch {
    return null;
  }
}

// Legacy function - kept for backward compatibility
export function fakeGetUser(): FakeUser | null {
  return getFakeUser();
}

// Login with Google - creates a new user
export function loginWithGoogle(): FakeUser {
  const user: FakeUser = {
    id: crypto.randomUUID(),
    name: "Google User",
    email: "user@gmail.com",
  };
  
  if (typeof window !== "undefined") {
    localStorage.setItem("fakeUser", JSON.stringify(user));
    localStorage.setItem("movigoo_user", JSON.stringify(user)); // Also store for compatibility
  }
  
  return user;
}

// Login with Email - creates a new user
export function loginWithEmail(email: string): FakeUser {
  const user: FakeUser = {
    id: crypto.randomUUID(),
    name: email.split("@")[0],
    email,
  };
  
  if (typeof window !== "undefined") {
    localStorage.setItem("fakeUser", JSON.stringify(user));
    localStorage.setItem("movigoo_user", JSON.stringify(user)); // Also store for compatibility
  }
  
  return user;
}

// Logout - removes user from localStorage
export function logoutFakeUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fakeUser");
    localStorage.removeItem("movigoo_user"); // Also remove for compatibility
  }
}

// Legacy functions - kept for backward compatibility but should not auto-login
export function fakeLogin(user: FakeUser | null = null): FakeUser {
  // Only create user if explicitly provided, otherwise return existing or create minimal
  if (user) {
    if (typeof window !== "undefined") {
      localStorage.setItem("movigoo_user", JSON.stringify(user));
      localStorage.setItem("fakeUser", JSON.stringify(user));
    }
    return user;
  }
  
  // Don't auto-create user - return existing or null
  return getFakeUser() || {
    id: "demo-user",
    name: "Demo User",
    email: "demo@example.com"
  };
}

// Legacy function - kept for backward compatibility
export function fakeLogout(): void {
  logoutFakeUser();
}
