// hooks/useAuth.ts
// Real Firebase Authentication hook with real-time user listener

"use client";

import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

