import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('irc_messages')
@Index(['channel', 'createdAt'])
export class IrcMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  channel!: string;

  @Column()
  fromHandle!: string;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;
}
