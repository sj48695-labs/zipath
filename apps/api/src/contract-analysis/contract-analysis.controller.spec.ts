import { BadRequestException } from "@nestjs/common";
import { ContractAnalysisController } from "./contract-analysis.controller";
import { ContractAnalysisService } from "./contract-analysis.service";

describe("ContractAnalysisController", () => {
  const analysis = {
    contractType: "월세",
    clauses: [],
    detectedCount: 0,
    totalCount: 0,
    missingRequired: [],
    missingRecommended: [],
    riskLevel: "safe" as const,
    riskSummary: "",
    disclaimer: "참고용이며 법적 효력 없음",
  };
  const service = {
    analyzeText: jest.fn(),
    extractText: jest.fn(),
  } as unknown as ContractAnalysisService;
  const controller = new ContractAnalysisController(service);

  beforeEach(() => jest.clearAllMocks());

  it("accepts a PNG upload and sends extracted OCR text to the analyzer", () => {
    jest.spyOn(service, "extractText").mockReturnValue("보증금 월세");
    jest.spyOn(service, "analyzeText").mockReturnValue(analysis);

    const result = controller.analyze(
      { buffer: Buffer.from("image"), mimetype: "image/png", size: 5 },
      { type: "월세" },
    );

    expect(service.extractText).toHaveBeenCalledWith(expect.any(Buffer), "월세");
    expect(result).toMatchObject({ ...analysis, isPremium: true });
  });

  it("rejects non-image and oversized uploads", () => {
    expect(() => controller.analyze(
      { buffer: Buffer.alloc(1), mimetype: "application/pdf", size: 1 },
      { type: "월세" },
    )).toThrow(BadRequestException);
    expect(() => controller.analyze(
      { buffer: Buffer.alloc(1), mimetype: "image/jpeg", size: 10 * 1024 * 1024 + 1 },
      { type: "월세" },
    )).toThrow(BadRequestException);
  });

  it("returns OCR extraction failures so the client can retry", () => {
    jest.spyOn(service, "extractText").mockImplementation(() => {
      throw new BadRequestException("OCR 텍스트를 추출하지 못했습니다.");
    });

    expect(() => controller.analyze(
      { buffer: Buffer.from("image"), mimetype: "image/jpeg", size: 5 },
      { type: "월세" },
    )).toThrow("OCR 텍스트를 추출하지 못했습니다.");
  });
});
