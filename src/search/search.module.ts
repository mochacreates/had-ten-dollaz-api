import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { FilterModule } from 'src/filter/filter.module';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports: [FilterModule, ProductModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
