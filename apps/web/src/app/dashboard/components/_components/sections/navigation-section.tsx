'use client';

import * as React from 'react';
import { ComponentCard } from '../component-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/breadcrumbs';

export function NavigationSection() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ComponentCard
        title="Tabs"
        description="A tabbed interface for switching between content panels."
        usage={`import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>`}
      >
        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="p-4">
            Account settings content here.
          </TabsContent>
          <TabsContent value="password" className="p-4">
            Password settings content here.
          </TabsContent>
          <TabsContent value="settings" className="p-4">
            General settings content here.
          </TabsContent>
        </Tabs>
      </ComponentCard>

      <ComponentCard
        title="Pagination"
        description="Navigation component for paginated content."
        usage={`import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`}
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ComponentCard>

      <ComponentCard
        title="Collapsible"
        description="An expandable/collapsible content section."
        usage={`import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

<Collapsible>
  <CollapsibleTrigger>Toggle</CollapsibleTrigger>
  <CollapsibleContent>
    Hidden content here
  </CollapsibleContent>
</Collapsible>`}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Click to expand</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? 'Close' : 'Open'}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-2">
            <div className="rounded-md border px-4 py-3 text-sm">
              This content is collapsible. Click the button above to toggle.
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ComponentCard>

      <ComponentCard
        title="Breadcrumbs"
        description="Navigation breadcrumb trail that auto-generates based on the current URL path."
        usage={`import { Breadcrumbs } from '@/components/breadcrumbs'

// Automatically generates breadcrumbs from current pathname
// e.g., /dashboard/components shows: Home > Dashboard > Components
<Breadcrumbs />
<Breadcrumbs className="text-base" />`}
      >
        <Breadcrumbs />
      </ComponentCard>
    </div>
  );
}

