import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RealPriceCache } from "@zipath/db";
import { RealPriceController } from "./real-price.controller";
import { RealPriceService } from "./real-price.service";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([RealPriceCache])],
  controllers: [RealPriceController],
  providers: [RealPriceService],
})
export class RealPriceModule {}
