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
  type!: string; // 'announcement' | 'price_change' | 'subscription' | 'system'

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "timestamp", nullable: true })
  readAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
