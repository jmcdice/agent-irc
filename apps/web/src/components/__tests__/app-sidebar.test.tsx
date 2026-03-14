import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppSidebar } from '../layout/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Wrapper to provide sidebar context
const renderWithSidebar = (ui: React.ReactNode) => {
  return render(<SidebarProvider>{ui}</SidebarProvider>);
};

describe('AppSidebar', () => {
  describe('header', () => {
    it('should display app name', () => {
      renderWithSidebar(<AppSidebar />);

      expect(screen.getByText('App Shell')).toBeInTheDocument();
      expect(screen.getByText('Starter Template')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should render all navigation items', () => {
      renderWithSidebar(<AppSidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Components')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should have correct links for main nav items', () => {
      renderWithSidebar(<AppSidebar />);

      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
      expect(screen.getByRole('link', { name: /components/i })).toHaveAttribute(
        'href',
        '/dashboard/components'
      );
      expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute(
        'href',
        '/dashboard/profile'
      );
      expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute(
        'href',
        '/dashboard/settings'
      );
    });

    it('should render Documentation as expandable section', () => {
      renderWithSidebar(<AppSidebar />);

      // Documentation should be a button (expandable) not a link
      const docButton = screen.getByRole('button', { name: /documentation/i });
      expect(docButton).toBeInTheDocument();
    });
  });
});

