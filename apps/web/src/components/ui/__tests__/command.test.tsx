import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '../command';

describe('Command', () => {
  it('should render command with input', () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
        </CommandList>
      </Command>
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('should render command items', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup heading="Suggestions">
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
  });

  it('should show empty state when no results', async () => {
    const user = userEvent.setup();
    
    render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem value="apple">Apple</CommandItem>
            <CommandItem value="banana">Banana</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );

    await user.type(screen.getByPlaceholderText('Search...'), 'xyz');

    await waitFor(() => {
      expect(screen.getByText('No results found.')).toBeInTheDocument();
    });
  });

  it('should render shortcuts', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>
            Settings
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>
    );

    expect(screen.getByText('⌘S')).toBeInTheDocument();
  });

  it('should render separator', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup>
            <CommandItem>Item 1</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem>Item 2</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should call onSelect when item is clicked', async () => {
    const onSelect = vi.fn();
    
    render(
      <Command>
        <CommandList>
          <CommandItem onSelect={onSelect}>Clickable Item</CommandItem>
        </CommandList>
      </Command>
    );

    fireEvent.click(screen.getByText('Clickable Item'));

    expect(onSelect).toHaveBeenCalled();
  });
});

describe('CommandDialog', () => {
  it('should render dialog when open', async () => {
    render(
      <CommandDialog open={true} onOpenChange={() => {}}>
        <CommandInput placeholder="Type a command..." />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
        </CommandList>
      </CommandDialog>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
    });
  });

  it('should include visually hidden title for accessibility', async () => {
    render(
      <CommandDialog open={true} onOpenChange={() => {}} title="Search Commands">
        <CommandList />
      </CommandDialog>
    );

    await waitFor(() => {
      // The title should exist for screen readers
      expect(screen.getByText('Search Commands')).toBeInTheDocument();
    });
  });

  it('should use default title when not provided', async () => {
    render(
      <CommandDialog open={true} onOpenChange={() => {}}>
        <CommandList />
      </CommandDialog>
    );

    await waitFor(() => {
      expect(screen.getByText('Command Menu')).toBeInTheDocument();
    });
  });
});

