import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity()
export class NotificationPreference {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "simple-array", default: "" })
  regions!: string[]; // 관심 지역 (예: ["서울 강남구", "서울 서초구"])

  @Column({ type: "bigint", nullable: true })
  priceThresholdMin!: number | null; // 최소 가격 (만원 단위)

  @Column({ type: "bigint", nullable: true })
  priceThresholdMax!: number | null; // 최대 가격 (만원 단위)

  @Column({ type: "simple-array", default: "" })
  announcementKeywords!: string[]; // 공고 키워드 (예: ["신혼", "생애최초"])

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
