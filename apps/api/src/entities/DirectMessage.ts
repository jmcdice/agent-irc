import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('direct_messages')
export class DirectMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fromHandle!: string;

  @Column()
  @Index()
  toHandle!: string;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;
}
