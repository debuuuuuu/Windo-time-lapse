export const FPS_OPTIONS = [24, 30, 60] as const
export type FpsOption = (typeof FPS_OPTIONS)[number]
export const DEFAULT_FPS: FpsOption = 30
