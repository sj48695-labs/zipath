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

  @Column({ type: 'int' })
  templateId!: number;

  @ManyToOne(() => ChecklistTemplate, (template) => template.items)
  @JoinColumn({ name: "templateId" })
  template!: ChecklistTemplate;

  @Column({ type: 'int' })
  order!: number;

  @Column({ type: 'varchar' })
  content!: string;

  @Column({ type: 'varchar', nullable: true })
  category!: string | null; // 서류, 현장확인, 계약조건 등

  @Column({ type: 'boolean', default: true })
  isRequired!: boolean;
}
