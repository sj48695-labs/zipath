import { z } from "zod";
import { ANALYZABLE_CONTRACT_TYPES } from "../data/clause-keywords";

export const analyzeRequestSchema = z.object({
  type: z.enum(ANALYZABLE_CONTRACT_TYPES as [string, ...string[]]),
  text: z.string().trim().min(1).optional(),
});

export const ALLOWED_IMAGE_MIME = ["image/png", "image/jpeg", "image/jpg"];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
