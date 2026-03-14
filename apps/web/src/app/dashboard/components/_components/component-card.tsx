'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComponentCardProps {
  title: string;
  description: string;
  usage: string;
  children: React.ReactNode;
  isCustom?: boolean;
}

export function ComponentCard({
  title,
  description,
  usage,
  children,
  isCustom = false,
}: ComponentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {isCustom && (
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          {children}
        </div>
        <div className="text-sm">
          <p className="font-medium text-muted-foreground mb-1">Usage:</p>
          <code className="block p-3 bg-muted rounded text-xs font-mono whitespace-pre-wrap">
            {usage}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}

