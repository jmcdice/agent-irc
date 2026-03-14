import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryColumn('varchar', { length: 255 })
  sid!: string;

  @Column('json')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sess!: any; // JSON session data from express-session

  @Index()
  @Column('timestamp')
  expire!: Date;
}

