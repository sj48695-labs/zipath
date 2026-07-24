import { z } from "zod";

export const matchRequestSchema = z.object({
  age: z.number().int().finite().min(0).max(150),
  income: z.number().finite().min(0), // 만원 단위
  homelessMonths: z.number().int().finite().min(0),
  dependents: z.number().int().finite().min(0).optional(),
  region: z.string().trim().min(1).optional(),
  isMarried: z.boolean().optional(),
  isFirstHome: z.boolean().optional(),
});

export type MatchRequestDto = z.infer<typeof matchRequestSchema>;
