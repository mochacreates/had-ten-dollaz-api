import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'filters' })
export class Filter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'brand',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  brand: string;

  @Column({
    name: 'min_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  minPrice: number;

  @Column({
    name: 'max_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  maxPrice: number;

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
