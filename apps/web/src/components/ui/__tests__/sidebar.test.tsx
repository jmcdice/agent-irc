import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
} from '../sidebar';

// Mock the useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

const renderWithProvider = (ui: React.ReactNode) => {
  return render(<SidebarProvider>{ui}</SidebarProvider>);
};

describe('SidebarProvider', () => {
  it('should render children', () => {
    render(
      <SidebarProvider>
        <div>Content</div>
      </SidebarProvider>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should start expanded by default', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <div data-testid="sidebar-content">Sidebar Content</div>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );

    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
  });

  it('should support defaultOpen prop', () => {
    render(
      <SidebarProvider defaultOpen={false}>
        <Sidebar />
      </SidebarProvider>
    );

    // The data-state attribute is on the outer wrapper div with data-slot="sidebar"
    const sidebar = document.querySelector('[data-slot="sidebar"]');
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  });
});

describe('Sidebar', () => {
  it('should render sidebar header', () => {
    renderWithProvider(
      <Sidebar>
        <SidebarHeader>Header Content</SidebarHeader>
      </Sidebar>
    );

    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should render sidebar footer', () => {
    renderWithProvider(
      <Sidebar>
        <SidebarFooter>Footer Content</SidebarFooter>
      </Sidebar>
    );

    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('should render sidebar content', () => {
    renderWithProvider(
      <Sidebar>
        <SidebarContent>Main Content</SidebarContent>
      </Sidebar>
    );

    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });
});

describe('SidebarTrigger', () => {
  it('should render toggle button', () => {
    renderWithProvider(<SidebarTrigger />);

    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
  });

  it('should toggle sidebar state when clicked', () => {
    render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar />
      </SidebarProvider>
    );

    // The data-state attribute is on the outer wrapper div with data-slot="sidebar"
    const sidebar = document.querySelector('[data-slot="sidebar"]');
    expect(sidebar).toHaveAttribute('data-state', 'expanded');

    fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }));

    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  });
});

describe('SidebarMenu', () => {
  it('should render menu items', () => {
    renderWithProvider(
      <Sidebar>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Item 1</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>Item 2</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});

describe('SidebarGroup', () => {
  it('should render group with label', () => {
    renderWithProvider(
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Group Label</SidebarGroupLabel>
            <SidebarGroupContent>
              <div>Group Content</div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );

    expect(screen.getByText('Group Label')).toBeInTheDocument();
    expect(screen.getByText('Group Content')).toBeInTheDocument();
  });
});

describe('SidebarInset', () => {
  it('should render main content area', () => {
    renderWithProvider(
      <>
        <Sidebar />
        <SidebarInset>
          <div>Main Application Content</div>
        </SidebarInset>
      </>
    );

    expect(screen.getByText('Main Application Content')).toBeInTheDocument();
  });
});

