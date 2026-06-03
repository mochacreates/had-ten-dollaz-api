import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filter } from './entities/filter.entity';
import { CreateFilterDto } from './dto/create-filter.dto';
import { UpdateFilterDto } from './dto/update-filter.dto';

@Injectable()
export class FilterService {
  constructor(
    @InjectRepository(Filter)
    private readonly filterRepository: Repository<Filter>,
  ) {}

  async create(createFilterDto: CreateFilterDto): Promise<void> {
    const filter = this.filterRepository.create(createFilterDto);
    await this.filterRepository.save(filter);
  }

  async findAll(): Promise<Filter[]> {
    return await this.filterRepository.find();
  }

  async findOne(id: string): Promise<Filter | null> {
    return await this.filterRepository.findOne({ where: { id } });
  }

  async update(id: string, updateFilterDto: UpdateFilterDto): Promise<void> {
    await this.filterRepository.update(id, updateFilterDto);
  }

  async remove(id: string): Promise<void> {
    await this.filterRepository.delete(id);
  }
}
