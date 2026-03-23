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

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int' })
  amount!: number; // 원 단위

  @Column({ type: 'varchar' })
  productType!: string; // contract-analysis, premium-monthly, real-price-report

  @Column({ type: 'varchar', default: "pending" })
  status!: string; // pending, confirmed, failed, cancelled

  @Column({ nullable: true, type: "varchar" })
  paymentKey!: string | null; // 토스페이먼츠 paymentKey

  @Column({ nullable: true, type: "varchar" })
  orderId!: string | null;

  @CreateDateColumn()
  paidAt!: Date;
}
