/** Sizes of the 3D boxes. A plain module so server components can read it too. */
export type BoxSize = "sm" | "md" | "lg";
export const DIM: Record<BoxSize, { w: number; h: number; d: number }> = {
  sm: { w: 150, h: 208, d: 22 },
  md: { w: 208, h: 288, d: 30 },
  lg: { w: 268, h: 372, d: 38 },
};
export const boxWidth = (size: BoxSize): number => DIM[size].w;
