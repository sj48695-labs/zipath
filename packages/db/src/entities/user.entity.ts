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

  @Column({ unique: true, nullable: true })
  email!: string | null;

  @Column({ nullable: true })
  nickname!: string | null;

  @Column({ nullable: true })
  provider!: string | null; // 'google', 'kakao', 'naver' 등 (SSO 대비)

  @Column({ nullable: true, unique: true })
  providerId!: string | null; // SSO provider의 유저 ID

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastActiveAt!: Date;
}
