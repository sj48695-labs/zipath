import { z } from "zod";
import { ANALYZABLE_CONTRACT_TYPES } from "../data/clause-keywords";

/**
 * 계약서 분석 요청 DTO (multipart/form-data 의 텍스트 필드 검증)
 *
 * - type: 계약 유형 (월세/전세/매매)
 * - text: (선택) 클라이언트가 보유한 OCR 추출 텍스트. 없으면 업로드 이미지로 추출.
 */
export const analyzeRequestSchema = z.object({
  type: z.enum(
    ANALYZABLE_CONTRACT_TYPES as [string, ...string[]],
    {
      errorMap: () => ({
        message: `계약 유형은 ${ANALYZABLE_CONTRACT_TYPES.join(", ")} 중 하나여야 합니다.`,
      }),
    },
  ),
  text: z.string().trim().min(1).optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

/** 허용 이미지 MIME 타입 */
export const ALLOWED_IMAGE_MIME = ["image/png", "image/jpeg", "image/jpg"];

/** 최대 이미지 크기 (10MB) */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
