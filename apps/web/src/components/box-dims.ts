/** Sizes of the 3D packages (square fronts). A plain module so server components can read it too. */
export type BoxSize = "sm" | "md" | "lg";
export const DIM: Record<BoxSize, { w: number; h: number; d: number }> = {
  sm: { w: 170, h: 170, d: 46 },
  md: { w: 232, h: 232, d: 62 },
  lg: { w: 300, h: 300, d: 80 },
};
export const boxWidth = (size: BoxSize): number => DIM[size].w;
