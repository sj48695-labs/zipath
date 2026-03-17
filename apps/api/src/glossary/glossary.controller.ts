import { Controller, Get, Query } from "@nestjs/common";
import { GlossaryService } from "./glossary.service";

@Controller("glossary")
export class GlossaryController {
  constructor(private readonly glossaryService: GlossaryService) {}

  @Get()
  getAll(@Query("category") category?: string, @Query("q") q?: string) {
    if (q) {
      return { terms: this.glossaryService.search(q) };
    }
    if (category) {
      return { terms: this.glossaryService.getByCategory(category) };
    }
    return { terms: this.glossaryService.getAll() };
  }

  @Get("categories")
  getCategories() {
    return { categories: this.glossaryService.getCategories() };
  }
}
