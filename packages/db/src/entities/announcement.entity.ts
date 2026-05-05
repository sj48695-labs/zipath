import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Announcement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  organization!: string; // LH, SH 등

  @Column({ type: 'varchar' })
  region!: string;

  @Column({ type: 'varchar' })
  supplyType!: string; // 공공분양, 국민임대 등

  @Column({ type: "timestamp" })
  startDate!: Date;

  @Column({ type: "timestamp" })
  endDate!: Date;

  @Column({ nullable: true, type: "varchar" })
  detailUrl!: string | null;

  @Column({ nullable: true, type: "text" })
  summary!: string | null;

  @Column({ nullable: true, type: "jsonb" })
  rawData!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
