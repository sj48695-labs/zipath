import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar" })
  type!: string; // 'PRICE_CHANGE' | 'NEW_ANNOUNCEMENT' | 'SUBSCRIPTION' | 'SYSTEM'

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  // 중복 알림 방지용 외부 식별자. 예) "11680:202505" (가격 변동), "announcement:42" (공고)
  @Column({ type: "varchar", nullable: true })
  referenceId!: string | null;

  @Column({ type: "timestamp", nullable: true })
  readAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
