import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { RegistryService } from "./registry.service";

const analyzeSchema = z.object({
  address: z.string().min(2, "주소를 입력해주세요"),
});

@Controller("registry")
export class RegistryController {
  constructor(private readonly registryService: RegistryService) {}

  @Get("analyze")
  analyze(@Query() query: unknown) {
    const parsed = analyzeSchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    return this.registryService.analyze(parsed.data.address);
  }

  @Get("terms")
  getTerms() {
    return this.registryService.getTermExplanations();
  }
}
