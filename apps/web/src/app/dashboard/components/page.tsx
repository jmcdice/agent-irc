'use client';

import * as React from 'react';
import { ComponentShowcase } from './_components/component-showcase';

export default function ComponentsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Component Library</h1>
        <p className="text-muted-foreground mt-2">
          A collection of reusable components built with Radix UI and Tailwind CSS.
          All components support theming and are fully accessible.
        </p>
      </div>
      <ComponentShowcase />
    </div>
  );
}

