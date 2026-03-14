'use client';

import * as React from 'react';
import { ComponentCard } from '../component-card';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NoDataEmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export function DataDisplaySection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ComponentCard
        title="Card"
        description="A container component for grouping related content."
        usage={`import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>`}
      >
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content and details.</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Action</Button>
          </CardFooter>
        </Card>
      </ComponentCard>

      <ComponentCard
        title="Avatar"
        description="An image element with a fallback for user representations."
        usage={`import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

<Avatar>
  <AvatarImage src="/avatar.png" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>`}
      >
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      </ComponentCard>

      <ComponentCard
        title="Table"
        description="A responsive table component for displaying data."
        usage={`import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell><Badge>Active</Badge></TableCell>
              <TableCell>Admin</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
              <TableCell>User</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ComponentCard>

      <ComponentCard
        title="Separator"
        description="A visual divider between content sections."
        usage={`import { Separator } from '@/components/ui/separator'

<Separator />
<Separator orientation="vertical" />`}
      >
        <div className="w-full space-y-4">
          <div>Content above</div>
          <Separator />
          <div>Content below</div>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Empty State"
        description="Placeholder for empty or no-data scenarios."
        usage={`import { EmptyState, NoDataEmptyState, NoResultsEmptyState } from '@/components/ui/empty-state'

<NoDataEmptyState />
<NoResultsEmptyState />
<EmptyState
  icon={<Icon />}
  title="No items"
  description="Get started by creating one."
/>`}
        isCustom
      >
        <div className="w-full">
          <NoDataEmptyState />
        </div>
      </ComponentCard>
    </div>
  );
}

