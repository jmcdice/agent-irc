# Database

<!-- AI_CONTEXT
This document covers TypeORM and PostgreSQL configuration.
Key files: apps/api/src/data-source.ts, apps/api/src/entities/, apps/api/src/env.ts
Database: PostgreSQL 16
ORM: TypeORM
IMPORTANT: data-source.ts uses individual params (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) from env object — NOT a DATABASE_URL string.
IMPORTANT: synchronize is env.NODE_ENV === 'development' — only dev, NOT "not production" (test env does NOT synchronize).
migrations directory is configured in DataSource but synchronize handles dev schema.
getDatabaseUrl() helper in env.ts constructs a URL string from individual params for connect-pg-simple.
Entities: User, Session, PasswordResetToken.
Related docs: express-overview, api-routes
-->

## What a Database ORM Is

A database is where your application's data actually lives. When a user registers, their account goes in the database. When they log in, their session goes in the database. When they reset their password, the token goes in the database. Everything persistent lives there.

**PostgreSQL** is the database App Shell uses. It's a mature, full-featured relational database — the kind where data is organized into tables with rows and columns, and you can query across them with SQL. It's been around since the 1990s, handles serious production workloads, and has excellent tooling.

**TypeORM** is the library that sits between your TypeScript code and PostgreSQL. Without it, you'd write raw SQL strings: `SELECT * FROM users WHERE email = $1`. TypeORM lets you write TypeScript instead, and it translates that into SQL for you. Your tables become TypeScript classes, your rows become objects, and your queries become method calls.

This translation layer is called an **ORM** — Object-Relational Mapper. It maps the relational world (tables, rows, columns) to the object world (classes, instances, properties).

## The Connection Configuration

The database connection is configured in `apps/api/src/data-source.ts`. It reads connection details from the validated environment object rather than directly from environment variables:

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: [User, Session, PasswordResetToken],
  synchronize: env.NODE_ENV === 'development',
  logging: env.NODE_ENV === 'development',
  migrations: ['src/migrations/*.ts'],
});
```

A few things worth understanding here:

**`synchronize: env.NODE_ENV === 'development'`** — When this is true, TypeORM automatically creates and alters database tables to match your entity classes every time the API starts. Add a new column to the `User` entity, restart, and the column appears in the database. This is only enabled in development. In production and test environments it's off — changes to the database schema there happen through migrations instead.

**`logging: env.NODE_ENV === 'development'`** — Prints the raw SQL TypeORM generates to the console. Useful when debugging queries or understanding what TypeORM is actually doing behind the scenes.

## Environment Variables

The individual connection variables come from Docker Compose:

```bash
DB_HOST=db          # The Docker service name — resolves to the db container on the Docker network
DB_PORT=5432        # PostgreSQL's standard port (inside the Docker network)
DB_USER=app_user
DB_PASSWORD=app_pass
DB_NAME=app_db
```

The external port is 5433 (visible from your machine), but inside Docker's private network the containers talk to each other on the standard port 5432. `DB_PORT` is the internal one.

The `env.ts` file also has a `getDatabaseUrl()` helper that constructs a connection string from these individual values. This string is used by `connect-pg-simple` (the library that stores session data in PostgreSQL), which expects a URL rather than individual parameters.

## The Three Entities

An entity is a TypeScript class that maps to a database table. TypeORM uses decorators — the `@` annotations — to understand the structure.

### User

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ default: 'user' })
  role!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

A few design details worth noting:

- **UUID primary keys** (`'uuid'`) rather than auto-incrementing integers. Sequential IDs (`1`, `2`, `3`) are predictable — someone can iterate through them to discover resources. UUIDs are random 128-bit values that are effectively impossible to guess.
- **`passwordHash` is nullable**. That's intentional. Future authentication methods like OAuth (logging in with Google or GitHub) don't require a password at all. Making the field optional now means the schema can support those flows without a migration.
- **`role` defaults to `'user'`**. New accounts get the `user` role automatically. Admins must be promoted explicitly.

### Session

Sessions are managed automatically by `connect-pg-simple`, which creates and maintains the `sessions` table itself. The `Session` entity exists so you can query that table using TypeORM when you need to — for example, to list a user's active sessions or revoke them:

```typescript
@Entity('sessions')
export class Session {
  @PrimaryColumn()
  sid!: string;

  @Column({ type: 'json' })
  sess!: object;

  @Column()
  expire!: Date;
}
```

The `sess` column stores the session data as JSON, including the `userId` that `requireAuth` reads. You can inspect it directly with `./dev.sh db` and a query like:

```sql
SELECT sid, sess->>'userId', expire FROM sessions WHERE expire > NOW();
```

### PasswordResetToken

Temporary tokens generated during the forgot-password flow:

```typescript
@Entity('reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  token!: string;

  @ManyToOne(() => User)
  user!: User;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  usedAt?: Date;
}
```

When a user requests a password reset, a token is created with a one-hour `expiresAt`. When they use the reset link, `usedAt` is set. The API checks both: the token must not be expired and must not have been used before.

## Working with the Database in Route Handlers

You interact with the database through **repositories**. A repository is TypeORM's interface for reading and writing a specific entity.

```typescript
const userRepo = AppDataSource.getRepository(User);

// Find one user
const user = await userRepo.findOne({ where: { email } });

// Find one or throw EntityNotFoundError
const user = await userRepo.findOneOrFail({ where: { id: userId } });

// Create and save
const user = userRepo.create({ email, name, passwordHash });
await userRepo.save(user);

// Update
user.name = 'New Name';
await userRepo.save(user);

// Delete
await userRepo.delete({ id: userId });
```

`findOne` returns `null` if nothing matches. `findOneOrFail` throws an error if nothing matches — which then gets caught by `asyncHandler` and routed to the error handler. Use whichever fits the situation: `findOne` when absence is expected, `findOneOrFail` when the record must exist.

## Complex Queries

For queries that `find` can't express, TypeORM's query builder gives you more control:

```typescript
const activeSessions = await sessionRepo
  .createQueryBuilder('session')
  .where("session.sess->>'userId' = :userId", { userId })
  .andWhere('session.expire > :now', { now: new Date() })
  .orderBy('session.expire', 'DESC')
  .getMany();
```

The `->>'userId'` syntax is PostgreSQL's JSON accessor. `sess` is a JSON column, so you have to dig into it with PostgreSQL's JSON operators to filter by `userId`.

## Adding a New Entity

When you need to store a new kind of data, here's the pattern:

**1. Create the entity file:**

```typescript
// apps/api/src/entities/Project.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
```

**2. Export from `entities/index.ts`:**

```typescript
export { Project } from './Project';
```

**3. Register it in `data-source.ts`:**

```typescript
entities: [User, Session, PasswordResetToken, Project],
```

**4. Restart the API.** Because `synchronize` is enabled in development, TypeORM creates the `projects` table automatically.

## Migrations

In production, `synchronize` is off. Schema changes happen through **migrations** — TypeScript files that describe exactly what to change in the database and how to reverse it. This matters in production because:

- You want to review schema changes before they happen
- You need to be able to roll back if something goes wrong
- Synchronize can be destructive (it may drop columns to match your entity)

App Shell ships with the migrations infrastructure configured. The workflow:

```bash
# Generate a migration from entity changes
pnpm --filter @app-shell/api typeorm migration:generate src/migrations/AddProjectTable

# Run pending migrations
pnpm --filter @app-shell/api typeorm migration:run

# Roll back the most recent migration
pnpm --filter @app-shell/api typeorm migration:revert
```

For the early stages of a project when you're moving fast and there's no production data to protect, `synchronize` in development is fine. Introduce migrations when you have a production database you can't afford to lose.

## Inspecting the Database

```bash
# Open a PostgreSQL shell connected to the app database
./dev.sh db

# From inside psql:
\dt                          -- list all tables
SELECT * FROM users;         -- see all user records
SELECT * FROM sessions;      -- see all active sessions
```

`./dev.sh reset-db` wipes all data and the tables themselves. After resetting, run `./dev.sh down && ./dev.sh up` so TypeORM recreates the schema from scratch.

## Next Steps

- **[API Routes](/dashboard/docs/backend/api-routes)** — How route handlers use repositories
- **[Middleware](/dashboard/docs/backend/middleware)** — How sessions are stored and read
