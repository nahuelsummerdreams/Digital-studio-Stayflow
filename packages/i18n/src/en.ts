import { es, type Messages } from "./es";
import { enP1 } from "./en/p1";
import { enP2 } from "./en/p2";
import { enP3 } from "./en/p3";
import { enP4 } from "./en/p4";
import { enP5 } from "./en/p5";
import { enP6 } from "./en/p6";
import { enP7 } from "./en/p7";

/**
 * English. Typed as `Messages`, so a missing key is a compile error, not a blank screen.
 * Written by Claude for review by a native speaker: the wording is natural but has not been reviewed by one yet.
 * `landing` is the block of the marketing site, which is Spanish-only for now (it reads Spanish whatever the language), so here it stays as the Spanish original until the site is translated.
 */
export const en: Messages = { ...enP1, ...enP2, ...enP3, ...enP4, ...enP5, ...enP6, ...enP7, landing: es.landing };
