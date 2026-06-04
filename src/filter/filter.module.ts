import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterService } from './filter.service';
import { FilterController } from './filter.controller';
import { Filter } from './entities/filter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Filter])],
  controllers: [FilterController],
  providers: [FilterService],
  exports: [FilterService],
})
export class FilterModule {}
