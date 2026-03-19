import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  amount!: number; // 원 단위

  @Column()
  productType!: string; // contract-analysis, premium-monthly, real-price-report

  @Column({ default: "pending" })
  status!: string; // pending, confirmed, failed, cancelled

  @Column({ nullable: true, type: "varchar" })
  paymentKey!: string | null; // 토스페이먼츠 paymentKey

  @Column({ nullable: true, type: "varchar" })
  orderId!: string | null;

  @CreateDateColumn()
  paidAt!: Date;
}
