"use client";

import { useMemo } from "react";
import type { User } from "@/types/user";

const MOCK_USER: User = {
  id: "organizer-abc",
  name: "Aarav Kapoor",
  role: "organizer",
  email: "aarav@movigoo.com"
};

/**
 * Temporary client-side auth mock.
 * Replace with real auth provider (Clerk/Auth0/custom) once backend is connected.
 */
export function useCurrentUser() {
  const user = useMemo(() => MOCK_USER, []);
  const isOrganizer = user.role === "organizer";
  return { user, isOrganizer };
}

