import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ChecklistTemplate } from "./checklist-template.entity";

@Entity()
export class ChecklistItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  templateId!: number;

  @ManyToOne(() => ChecklistTemplate, (template) => template.items)
  @JoinColumn({ name: "templateId" })
  template!: ChecklistTemplate;

  @Column()
  order!: number;

  @Column()
  content!: string;

  @Column({ nullable: true })
  category!: string | null; // 서류, 현장확인, 계약조건 등

  @Column({ default: true })
  isRequired!: boolean;
}
