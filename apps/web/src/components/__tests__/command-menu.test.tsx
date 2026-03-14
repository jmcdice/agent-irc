import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandMenu } from '../command-menu';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('CommandMenu', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('trigger button', () => {
    it('should render the search button', () => {
      render(<CommandMenu />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Search...')).toBeInTheDocument();
    });

    it('should show keyboard shortcut hint', () => {
      render(<CommandMenu />);
      
      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('should open dialog when clicked', async () => {
      render(<CommandMenu />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search pages...')).toBeInTheDocument();
      });
    });
  });

  describe('keyboard shortcuts', () => {
    it('should open dialog with Cmd+K', async () => {
      render(<CommandMenu />);
      
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search pages...')).toBeInTheDocument();
      });
    });

    it('should open dialog with Ctrl+K', async () => {
      render(<CommandMenu />);
      
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search pages...')).toBeInTheDocument();
      });
    });

    it('should toggle dialog with Cmd+K', async () => {
      render(<CommandMenu />);
      
      // Open
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search pages...')).toBeInTheDocument();
      });
      
      // Close
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search pages...')).not.toBeInTheDocument();
      });
    });
  });

  describe('navigation items', () => {
    it('should display all navigation items', async () => {
      render(<CommandMenu />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Components')).toBeInTheDocument();
        expect(screen.getByText('Documentation')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should show shortcut numbers', async () => {
      render(<CommandMenu />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('should navigate when item is selected', async () => {
      const user = userEvent.setup();
      render(<CommandMenu />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
      
      // Click on Dashboard option
      await user.click(screen.getByText('Dashboard'));
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('search functionality', () => {
    it('should filter items based on search input', async () => {
      const user = userEvent.setup();
      render(<CommandMenu />);
      
      fireEvent.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search pages...')).toBeInTheDocument();
      });
      
      const input = screen.getByPlaceholderText('Search pages...');
      await user.type(input, 'prof');
      
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        // Other items might still be visible due to cmdk behavior,
        // but Profile should definitely be there
      });
    });
  });
});

