import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from "typeorm";
import { ChecklistItem } from "./checklist-item.entity";

@Entity()
export class ChecklistTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string; // rent, jeonse, buy

  @Column()
  title!: string;

  @OneToMany(() => ChecklistItem, (item) => item.template)
  items!: ChecklistItem[];
}
