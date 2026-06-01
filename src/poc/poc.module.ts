import { Module } from '@nestjs/common';
import { PocService } from './poc.service';
import { PocController } from './poc.controller';

@Module({
  controllers: [PocController],
  providers: [PocService],
})
export class PocModule {}
