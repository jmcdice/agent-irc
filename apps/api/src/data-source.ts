import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { User, Session, PasswordResetToken, Channel, IrcMessage, DirectMessage, AgentToken } from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: env.NODE_ENV === 'development', // Auto-sync schema in dev
  logging: env.NODE_ENV === 'development',
  entities: [User, Session, PasswordResetToken, Channel, IrcMessage, DirectMessage, AgentToken],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});

