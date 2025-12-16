"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import type { User } from "@/types/user";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          role: "user", // Default role
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isOrganizer = user?.role === "organizer";
  return { user: user || { id: "", role: "user" }, isOrganizer, loading };
}

