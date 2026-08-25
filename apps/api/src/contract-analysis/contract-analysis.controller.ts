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
  analyzeRequestSchema,
  MAX_IMAGE_SIZE,
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

  @Post("analyze")
  @UseInterceptors(
    FileInterceptor("image", {
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
          callback(new BadRequestException("PNG 또는 JPEG 이미지만 업로드할 수 있습니다."), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  analyze(@UploadedFile() image: UploadedImage | undefined, @Body() body: unknown) {
    const parsed = analyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join(", "));
    }

    const { type, text } = parsed.data;
    if (image && (!ALLOWED_IMAGE_MIME.includes(image.mimetype) || image.size > MAX_IMAGE_SIZE)) {
      throw new BadRequestException(
        image.size > MAX_IMAGE_SIZE
          ? "이미지 파일은 10MB 이하만 업로드할 수 있습니다."
          : "PNG 또는 JPEG 이미지만 업로드할 수 있습니다.",
      );
    }
    if (text === undefined && !image) {
      throw new BadRequestException("분석할 이미지(image) 또는 텍스트(text) 중 하나는 필요합니다.");
    }

    const analysisText = text ?? this.contractAnalysisService.extractText(image!.buffer, type);
    return {
      ...this.contractAnalysisService.analyzeText(type, analysisText),
      isPremium: true,
      premiumNotice: "계약서 분석은 프리미엄 기능(990원)입니다. 현재는 체험용으로 제공됩니다.",
    };
  }
}
