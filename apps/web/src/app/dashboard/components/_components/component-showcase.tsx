'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ButtonsSection } from './sections/buttons-section';
import { FormsSection } from './sections/forms-section';
import { FeedbackSection } from './sections/feedback-section';
import { DataDisplaySection } from './sections/data-display-section';
import { NavigationSection } from './sections/navigation-section';
import { OverlaysSection } from './sections/overlays-section';

export function ComponentShowcase() {
  return (
    <Tabs defaultValue="buttons" className="w-full">
      <TabsList className="mb-8 flex-wrap h-auto gap-2">
        <TabsTrigger value="buttons">Buttons & Actions</TabsTrigger>
        <TabsTrigger value="forms">Form Controls</TabsTrigger>
        <TabsTrigger value="feedback">Feedback</TabsTrigger>
        <TabsTrigger value="data">Data Display</TabsTrigger>
        <TabsTrigger value="navigation">Navigation</TabsTrigger>
        <TabsTrigger value="overlays">Overlays</TabsTrigger>
      </TabsList>

      <TabsContent value="buttons">
        <ButtonsSection />
      </TabsContent>

      <TabsContent value="forms">
        <FormsSection />
      </TabsContent>

      <TabsContent value="feedback">
        <FeedbackSection />
      </TabsContent>

      <TabsContent value="data">
        <DataDisplaySection />
      </TabsContent>

      <TabsContent value="navigation">
        <NavigationSection />
      </TabsContent>

      <TabsContent value="overlays">
        <OverlaysSection />
      </TabsContent>
    </Tabs>
  );
}

