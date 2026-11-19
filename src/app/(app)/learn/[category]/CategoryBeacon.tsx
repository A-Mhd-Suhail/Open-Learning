"use client";
import { useEffect } from "react";
import { rememberCategory } from "./actions";

/** Records the student's most recently opened category on their profile. */
export function CategoryBeacon({ category }: { category: string }) {
  useEffect(() => { void rememberCategory(category); }, [category]);
  return null;
}
