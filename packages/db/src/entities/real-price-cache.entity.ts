import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from "typeorm";

@Entity()
@Unique(["regionCode", "dealType", "yearMonth"])
export class RealPriceCache {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  regionCode!: string;

  @Column({ type: 'varchar' })
  dealType!: string; // 매매, 전세, 월세

  @Column({ type: 'varchar' })
  yearMonth!: string;

  @Column({ type: "jsonb" })
  data!: Record<string, unknown>;

  @CreateDateColumn()
  fetchedAt!: Date;
}
