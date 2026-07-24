import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", nullable: true })
  nickname!: string | null;

  @Column({ type: "varchar", nullable: true })
  provider!: string | null; // 'google', 'kakao', 'naver' 등 (SSO 대비)

  @Column({ type: "varchar", nullable: true, unique: true })
  providerId!: string | null; // SSO provider의 유저 ID

  @Column({ type: "simple-array", default: "" })
  interestRegions!: string[]; // 관심 지역 목록 (예: "서울 강남구")

  @Column({ type: "varchar", nullable: true })
  refreshTokenHash!: string | null;

  @Column({ type: "timestamp", nullable: true })
  refreshTokenExpiresAt!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  refreshTokenInvalidatedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastActiveAt!: Date;
}
