import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class SubscriptionCriteria {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string; // 1순위, 2순위, 특별공급 등

  @Column({ nullable: true })
  minAge!: number | null;

  @Column({ nullable: true })
  maxIncome!: number | null; // 만원 단위

  @Column({ nullable: true })
  minHomeless!: number | null; // 무주택 기간(월)

  @Column({ nullable: true })
  region!: string | null;

  @Column({ nullable: true, type: "text" })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
