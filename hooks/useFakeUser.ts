// hooks/useFakeUser.ts
// Simulated user system (no Firebase Auth yet)

"use client";

import { useState, useEffect } from "react";

type FakeUser = {
  uid: string;
  name: string;
  email: string;
};

export function useFakeUser() {
  const [user, setUser] = useState<FakeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("movigoo_fake_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (error) {
        console.error("Error parsing fake user:", error);
        localStorage.removeItem("movigoo_fake_user");
      }
    }
    setLoading(false);
  }, []);

  function loginFake() {
    const fakeUser: FakeUser = {
      uid: "FAKE_USER_123",
      name: "Guest User",
      email: "guest@example.com",
    };
    localStorage.setItem("movigoo_fake_user", JSON.stringify(fakeUser));
    setUser(fakeUser);
  }

  function logoutFake() {
    localStorage.removeItem("movigoo_fake_user");
    setUser(null);
  }

  // Return user in format compatible with useCurrentUser
  return {
    user: user ? {
      id: user.uid,
      name: user.name,
      email: user.email,
      role: "user" as const,
    } : { id: "", role: "user" as const },
    isOrganizer: false,
    loading,
    loginFake,
    logoutFake,
  };
}

