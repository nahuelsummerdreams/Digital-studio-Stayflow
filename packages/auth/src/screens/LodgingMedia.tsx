"use client";

import { useState } from "react";
import type { LodgingType } from "../api";
import { LodgingArt } from "./LodgingArt";

/** The photo of a category (served by each app from /categories/<type>.webp). If it cannot load, the illustration takes its place. */
export function LodgingMedia({ type }: { type: LodgingType }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <LodgingArt type={type} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/categories/${type}.webp`} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
  );
}
