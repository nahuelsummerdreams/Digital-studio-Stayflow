import { es, type Messages } from "./es";
import { ptP1 } from "./pt/p1";
import { ptP2 } from "./pt/p2";
import { ptP3 } from "./pt/p3";
import { ptP4 } from "./pt/p4";
import { ptP5 } from "./pt/p5";
import { ptP6 } from "./pt/p6";
import { ptP7 } from "./pt/p7";

/**
 * Portuguese (Brazil). Typed as `Messages`, so a missing key is a compile error, not a blank screen.
 * Written by Claude for review by a native speaker: the wording is natural but has not been reviewed by one yet.
 * `landing` is the block of the marketing site, which is Spanish-only for now (it reads Spanish whatever the language), so here it stays as the Spanish original until the site is translated.
 */
export const pt: Messages = { ...ptP1, ...ptP2, ...ptP3, ...ptP4, ...ptP5, ...ptP6, ...ptP7, landing: es.landing };
