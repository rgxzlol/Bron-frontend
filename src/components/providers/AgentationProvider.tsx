"use client";

import { Agentation } from "agentation";

export default function AgentationProvider() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return <Agentation />;
}
