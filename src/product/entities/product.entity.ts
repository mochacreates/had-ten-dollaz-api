import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  price: number;

  @Column({
    name: 'image_url',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  image_url: string;

  @Column({
    name: 'product_url',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  product_url: string;

  @Column({
    name: 'brand',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  brand: string;

  @Column({
    name: 'seller',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  seller: string;

  @Column({
    name: 'notified',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  notified: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
  })
  deletedAt: Date | null;
}
