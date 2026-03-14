import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  createdBy!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
