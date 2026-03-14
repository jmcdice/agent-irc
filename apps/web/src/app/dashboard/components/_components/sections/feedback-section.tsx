'use client';

import * as React from 'react';
import { ComponentCard } from '../component-card';
import { Progress } from '@/components/ui/progress';
import { ProgressCircle } from '@/components/ui/progress-circle';
import { Spinner, CardSkeleton } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function FeedbackSection() {
  const [progress, setProgress] = React.useState(45);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ComponentCard
        title="Progress"
        description="A linear progress bar indicating completion status."
        usage={`import { Progress } from '@/components/ui/progress'

<Progress value={45} />`}
      >
        <div className="w-full space-y-2">
          <Progress value={progress} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setProgress(Math.max(0, progress - 10))}>
              -10%
            </Button>
            <Button size="sm" variant="outline" onClick={() => setProgress(Math.min(100, progress + 10))}>
              +10%
            </Button>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Progress Circle"
        description="A circular progress indicator for completion or metrics."
        usage={`import { ProgressCircle } from '@/components/ui/progress-circle'

<ProgressCircle value={75} />
<ProgressCircle value={50} size="lg" />
<ProgressCircle value={25} size="sm" />`}
        isCustom
      >
        <ProgressCircle value={25} size="sm" />
        <ProgressCircle value={50} size="md" />
        <ProgressCircle value={75} size="lg" />
      </ComponentCard>

      <ComponentCard
        title="Spinner"
        description="Loading spinner indicators in various sizes."
        usage={`import { Spinner } from '@/components/ui/spinner'

<Spinner size="sm" />
<Spinner size="default" />
<Spinner size="lg" />
<Spinner size="xl" />`}
        isCustom
      >
        <Spinner size="sm" />
        <Spinner size="default" />
        <Spinner size="lg" />
      </ComponentCard>

      <ComponentCard
        title="Skeleton"
        description="Placeholder loading states for content."
        usage={`import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-4 w-[200px]" />
<Skeleton className="h-12 w-12 rounded-full" />`}
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Card Skeleton"
        description="Pre-built skeleton for card loading states."
        usage={`import { CardSkeleton } from '@/components/ui/spinner'

<CardSkeleton />`}
        isCustom
      >
        <div className="w-full max-w-sm">
          <CardSkeleton />
        </div>
      </ComponentCard>

      <ComponentCard
        title="Toast (Sonner)"
        description="Toast notifications for user feedback."
        usage={`import { toast } from 'sonner'

toast('Event has been created')
toast.success('Success!')
toast.error('Something went wrong')
toast.info('Did you know?')`}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast('Event has been created')}>
            Default Toast
          </Button>
          <Button variant="outline" onClick={() => toast.success('Successfully saved!')}>
            Success
          </Button>
          <Button variant="outline" onClick={() => toast.error('Something went wrong')}>
            Error
          </Button>
          <Button variant="outline" onClick={() => toast.info('Did you know?')}>
            Info
          </Button>
        </div>
      </ComponentCard>
    </div>
  );
}

