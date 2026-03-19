import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { RealPriceService } from "./real-price.service";

const searchSchema = z.object({
  regionCode: z.string().min(5).max(5),
  yearMonth: z.string().regex(/^\d{6}$/, "YYYYMM 형식이어야 합니다"),
  minArea: z.coerce.number().min(0).optional(),
  maxArea: z.coerce.number().min(0).optional(),
});

const trendSchema = z.object({
  regionCode: z.string().min(5).max(5),
  fromMonth: z.string().regex(/^\d{6}$/, "YYYYMM 형식이어야 합니다"),
  toMonth: z.string().regex(/^\d{6}$/, "YYYYMM 형식이어야 합니다"),
});

@Controller("real-price")
export class RealPriceController {
  constructor(private readonly realPriceService: RealPriceService) {}

  @Get("search")
  async search(
    @Query("regionCode") regionCode: string,
    @Query("yearMonth") yearMonth: string,
    @Query("minArea") minArea?: string,
    @Query("maxArea") maxArea?: string,
  ) {
    const parsed = searchSchema.safeParse({
      regionCode,
      yearMonth,
      minArea: minArea ? Number(minArea) : undefined,
      maxArea: maxArea ? Number(maxArea) : undefined,
    });
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    return this.realPriceService.search(
      parsed.data.regionCode,
      parsed.data.yearMonth,
      parsed.data.minArea,
      parsed.data.maxArea,
    );
  }

  @Get("trend")
  async trend(
    @Query("regionCode") regionCode: string,
    @Query("fromMonth") fromMonth: string,
    @Query("toMonth") toMonth: string,
  ) {
    const parsed = trendSchema.safeParse({ regionCode, fromMonth, toMonth });
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    return this.realPriceService.searchRange(
      parsed.data.regionCode,
      parsed.data.fromMonth,
      parsed.data.toMonth,
    );
  }
}
