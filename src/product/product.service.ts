import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<void> {
    const product = this.productRepository.create(createProductDto);

    await this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { id } });
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<void> {
    await this.productRepository.update(id, updateProductDto);
  }

  async remove(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  async findByUrl(url: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { product_url: url } });
  }

  async getUnnotifiedProducts(): Promise<Product[]> {
    return this.productRepository.find({ where: { notified: false } });
  }

  async markAsNotified(id: string): Promise<void> {
    const product = await this.findOne(id);

    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    product.notified = true;
    await this.productRepository.save(product);
  }
}
