import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ContractAnalysisService } from "./contract-analysis.service";
import {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_SIZE,
  analyzeRequestSchema,
} from "./dto/analyze-request.dto";

interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Controller("contract-analysis")
export class ContractAnalysisController {
  constructor(
    private readonly contractAnalysisService: ContractAnalysisService,
  ) {}

  @Get("checklist")
  getChecklist(@Query("type") type: string) {
    return this.contractAnalysisService.getChecklist(type);
  }

  @Get("types")
  getContractTypes() {
    return { types: this.contractAnalysisService.getContractTypes() };
  }

  @Get("summary")
  getSummary(@Query("type") type: string) {
    return this.contractAnalysisService.getSummary(type);
  }

  /**
   * 계약서 이미지 업로드 분석.
   *
   * 두 경로를 모두 지원:
   * - 이미지 파일(`image`) 업로드 → 서버에서 텍스트 추출(MVP: 시뮬레이션) 후 분석
   * - `text` 필드만 전송(클라이언트 OCR 결과 직접 전송) → 해당 텍스트로 분석
   */
  @Post("analyze")
  @UseInterceptors(
    // 별도 storage 미지정 시 multer 기본값이 메모리 스토리지라 file.buffer 사용 가능.
    // 이미지는 영구 저장하지 않고 분석 후 폐기.
    FileInterceptor("image", {
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
          cb(
            new BadRequestException("PNG 또는 JPEG 이미지만 업로드할 수 있습니다."),
            false,
          );
        } else {
          cb(null, true);
        }
      },
    }),
  )
  analyze(
    @UploadedFile() image: UploadedImage | undefined,
    @Body() body: unknown,
  ) {
    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    const { type, text } = parsed.data;

    let analysisText: string;
    if (text !== undefined) {
      analysisText = text;
    } else {
      if (!image) {
        throw new BadRequestException(
          "분석할 이미지(image) 또는 텍스트(text) 중 하나는 필요합니다.",
        );
      }
      // 메모리 버퍼로 받아 텍스트 추출 후 폐기 (영구 저장하지 않음)
      analysisText = this.contractAnalysisService.extractText(
        image.buffer,
        type,
      );
    }

    const result = this.contractAnalysisService.analyzeText(type, analysisText);
    // 결정사항 4: MVP에서는 결제 게이팅을 강제하지 않고 안내만 포함
    return {
      ...result,
      isPremium: true,
      premiumNotice:
        "계약서 분석은 프리미엄 기능(990원)입니다. 현재는 체험용으로 제공됩니다.",
    };
  }
}
