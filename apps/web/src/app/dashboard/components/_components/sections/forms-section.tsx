'use client';

import * as React from 'react';
import { ComponentCard } from '../component-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function FormsSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ComponentCard
        title="Input"
        description="A text input field for collecting user data."
        usage={`import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter email" />
</div>`}
      >
        <div className="w-full space-y-2">
          <Label htmlFor="demo-email">Email</Label>
          <Input id="demo-email" type="email" placeholder="Enter your email" />
        </div>
      </ComponentCard>

      <ComponentCard
        title="Textarea"
        description="A multi-line text input for longer content."
        usage={`import { Textarea } from '@/components/ui/textarea'

<Textarea placeholder="Type your message..." />`}
      >
        <Textarea placeholder="Type your message here..." className="w-full" />
      </ComponentCard>

      <ComponentCard
        title="Checkbox"
        description="A checkbox input for boolean selections."
        usage={`import { Checkbox } from '@/components/ui/checkbox'

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>`}
      >
        <div className="flex items-center space-x-2">
          <Checkbox id="demo-terms" />
          <Label htmlFor="demo-terms">Accept terms and conditions</Label>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Radio Group"
        description="A set of radio buttons for single selection."
        usage={`import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

<RadioGroup defaultValue="option-1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
</RadioGroup>`}
      >
        <RadioGroup defaultValue="option-1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-1" id="r1" />
            <Label htmlFor="r1">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-2" id="r2" />
            <Label htmlFor="r2">Option 2</Label>
          </div>
        </RadioGroup>
      </ComponentCard>

      <ComponentCard
        title="Switch"
        description="A toggle switch for on/off states."
        usage={`import { Switch } from '@/components/ui/switch'

<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>`}
      >
        <div className="flex items-center space-x-2">
          <Switch id="demo-switch" />
          <Label htmlFor="demo-switch">Enable notifications</Label>
        </div>
      </ComponentCard>

      <ComponentCard
        title="Slider"
        description="A slider input for selecting a value from a range."
        usage={`import { Slider } from '@/components/ui/slider'

<Slider defaultValue={[50]} max={100} step={1} />`}
      >
        <div className="w-full space-y-2">
          <Label>Volume</Label>
          <Slider defaultValue={[50]} max={100} step={1} />
        </div>
      </ComponentCard>

      <ComponentCard
        title="Select"
        description="A dropdown select menu for choosing from options."
        usage={`import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>`}
      >
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectContent>
        </Select>
      </ComponentCard>
    </div>
  );
}

