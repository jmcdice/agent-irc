'use client';

import * as React from 'react';
import { ComponentCard } from '../component-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ButtonsSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ComponentCard
        title="Button"
        description="A clickable button component with multiple variants and sizes."
        usage={`import { Button } from '@/components/ui/button'

<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button disabled>Disabled</Button>`}
      >
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </ComponentCard>

      <ComponentCard
        title="Button Sizes"
        description="Buttons come in different sizes for various use cases."
        usage={`<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔔</Button>`}
      >
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">🔔</Button>
      </ComponentCard>

      <ComponentCard
        title="Badge"
        description="A small status indicator component for labels and counts."
        usage={`import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}
      >
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </ComponentCard>
    </div>
  );
}

