# Adding Features

<!-- AI_CONTEXT
This document guides developers through adding new features to App Shell.
Key files: apps/api/src/entities/index.ts, apps/api/src/data-source.ts, apps/api/src/index.ts
Frontend data fetching: NO useApi hook exists. Use apiRequest() from @/hooks/use-api for reads, useApiMutation() for writes.
apiRequest() signature: apiRequest<T>(endpoint, options?) returns Promise<ApiResult<T>> = { data: T | null, error: ApiError | null }
useApiMutation() signature: useApiMutation<TRequest, TResponse>(endpoint, method) returns { execute, isLoading, error, data, reset }
execute() returns ApiResult<TResponse> — check result.data or result.error
Sidebar: apps/web/src/components/layout/app-sidebar.tsx — navItems array with { title, href, icon } from @heroicons/react/24/outline
Entities index: apps/api/src/entities/index.ts — exports User, Session, PasswordResetToken
Shared package name: @app-shell/shared
synchronize: true in development (env.NODE_ENV === 'development')
Related docs: customization, best-practices, architecture/overview
-->

## Overview

This guide walks through adding new features to App Shell — a new database entity, API endpoints to manage it, and a frontend page to display it. Each section covers one layer of the stack.

## Adding a New Entity

### 1. Create the entity file

TypeORM uses decorator-based entity definitions. Add a new file in `apps/api/src/entities/`:

```typescript
// apps/api/src/entities/Product.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 2. Export it from the entities index

```typescript
// apps/api/src/entities/index.ts
export { User } from './User';
export { Session } from './Session';
export { PasswordResetToken } from './PasswordResetToken';
export { Product } from './Product'; // Add this
```

### 3. Register it in the DataSource

```typescript
// apps/api/src/data-source.ts
import { Product } from './entities';

export const AppDataSource = new DataSource({
  // ...
  entities: [User, Session, PasswordResetToken, Product],
});
```

### 4. Restart the API

In development, `synchronize` is enabled — TypeORM will create the `products` table automatically when the API restarts. In production, you'd run a migration instead.

## Adding API Endpoints

Routes live inline in `apps/api/src/index.ts`. Add your endpoints near the other route definitions:

```typescript
// apps/api/src/index.ts
import { Product } from './entities';

// List all products
app.get('/api/products', asyncHandler(async (req, res) => {
  const productRepo = AppDataSource.getRepository(Product);
  const products = await productRepo.find({
    order: { createdAt: 'DESC' },
    take: 50,
  });
  res.json(products);
}));

// Get a single product
app.get('/api/products/:id', asyncHandler(async (req, res) => {
  const productRepo = AppDataSource.getRepository(Product);
  const product = await productRepo.findOne({
    where: { id: req.params.id },
  });
  if (!product) {
    throw ApiError.notFound('Product');
  }
  res.json(product);
}));

// Create a product (requires login)
app.post('/api/products', requireAuth, asyncHandler(async (req, res) => {
  const { name, description, price } = req.body;

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required';
  if (price == null) errors.price = 'Price is required';
  if (Object.keys(errors).length) {
    throw ApiError.validationError('Validation failed', errors);
  }

  const productRepo = AppDataSource.getRepository(Product);
  const product = productRepo.create({
    name,
    description,
    price,
    createdBy: { id: req.session.userId },
  });
  await productRepo.save(product);

  res.status(201).json(product);
}));
```

## Adding Frontend Pages

### 1. Create the page

Pages live in `apps/web/src/app/dashboard/`. Create a folder and a `page.tsx` inside it:

```typescript
// apps/web/src/app/dashboard/products/page.tsx
import { Suspense } from 'react';

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ProductList />
      </Suspense>
    </div>
  );
}

async function ProductList() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/products`,
    { cache: 'no-store' }
  );
  const products = await response.json();

  return (
    <div className="grid gap-4">
      {products.map((product: { id: string; name: string }) => (
        <div key={product.id} className="p-4 border rounded-lg">
          {product.name}
        </div>
      ))}
    </div>
  );
}
```

### 2. Add a navigation link

Edit the `navItems` array in `apps/web/src/components/layout/app-sidebar.tsx`:

```typescript
import {
  Squares2X2Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  SwatchIcon,
  BookOpenIcon,
  ShoppingBagIcon, // Add this import
} from '@heroicons/react/24/outline';

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon },
  { title: 'Components', href: '/dashboard/components', icon: SwatchIcon },
  { title: 'Products', href: '/dashboard/products', icon: ShoppingBagIcon }, // Add this
  { title: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
  { title: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];
```

## Adding Custom Hooks

For client components that need to fetch or mutate data, use the hooks in `apps/web/src/hooks/use-api.ts`.

**Reading data** uses `apiRequest` — a plain async function that returns `{ data, error }`:

```typescript
// apps/web/src/hooks/use-products.ts
import { useState, useEffect } from 'react';
import { apiRequest, useApiMutation } from './use-api';
import type { ApiError } from '@app-shell/shared';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export function useProducts() {
  const [data, setData] = useState<Product[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest<Product[]>('/api/products').then((result) => {
      setData(result.data);
      setError(result.error);
      setIsLoading(false);
    });
  }, []);

  return { data, error, isLoading };
}

export function useCreateProduct() {
  return useApiMutation<Partial<Product>, Product>('/api/products', 'POST');
}
```

**Using the hook in a component:**

```typescript
function ProductsPage() {
  const { data: products, isLoading, error } = useProducts();
  const { execute: createProduct, isLoading: creating } = useCreateProduct();

  const handleCreate = async (formData: Partial<Product>) => {
    const result = await createProduct(formData);
    if (result.data) {
      // Success — result.data is the created product
    }
    if (result.error) {
      // Handle error
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!products) return null;

  return <ProductList products={products} onCreate={handleCreate} />;
}
```

## Adding Shared Types

Types that both the frontend and backend use go in `packages/shared/src/`:

```typescript
// packages/shared/src/types/product.ts
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
}
```

Export it from the package index:

```typescript
// packages/shared/src/index.ts
export * from './types/product';
```

Then import it in either app:

```typescript
import { Product, CreateProductInput } from '@app-shell/shared';
```

## Checklist for New Features

- [ ] Entity created in `apps/api/src/entities/`
- [ ] Entity exported from `apps/api/src/entities/index.ts`
- [ ] Entity registered in `AppDataSource.entities` in `data-source.ts`
- [ ] API routes added to `apps/api/src/index.ts` (with validation)
- [ ] Shared types added to `packages/shared/src/`
- [ ] Frontend page created in `apps/web/src/app/dashboard/`
- [ ] Navigation link added to `app-sidebar.tsx`
- [ ] Hooks created for client-side data fetching (if needed)
- [ ] Tests written for new API endpoints

## Next Steps

- **[Customization](/dashboard/docs/extending/customization)** — Theming and branding
- **[Best Practices](/dashboard/docs/extending/best-practices)** — Code patterns to follow
