import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardShell } from '../layout/dashboard-shell';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}));

// Mock child components to simplify testing
vi.mock('../layout/app-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar</div>,
}));

vi.mock('../layout/user-menu', () => ({
  UserMenu: ({
    user,
    onLogout,
  }: {
    user?: { name: string } | null;
    onLogout?: () => void;
  }) => (
    <div data-testid="user-menu">
      {user && <span data-testid="user-name">{user.name}</span>}
      <button onClick={onLogout} data-testid="logout-button">
        Logout
      </button>
    </div>
  ),
}));

vi.mock('../command-menu', () => ({
  CommandMenu: () => <div data-testid="command-menu">Command Menu</div>,
}));

vi.mock('../themes/theme-mode-toggle', () => ({
  ThemeModeToggle: () => <div data-testid="theme-mode-toggle">Theme Toggle</div>,
}));

vi.mock('../themes/theme-selector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector">Theme Selector</div>,
}));

describe('DashboardShell', () => {
  const originalFetch = global.fetch;
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
  };

  beforeEach(() => {
    global.fetch = vi.fn();
    mockPush.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should show loading state initially', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));

    render(<DashboardShell>Content</DashboardShell>);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render children after loading', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockUser),
    });

    render(
      <DashboardShell>
        <div>Dashboard Content</div>
      </DashboardShell>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });
  });

  it('should render header components', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockUser),
    });

    render(<DashboardShell>Content</DashboardShell>);

    await waitFor(() => {
      expect(screen.getByTestId('command-menu')).toBeInTheDocument();
      expect(screen.getByTestId('theme-selector')).toBeInTheDocument();
      expect(screen.getByTestId('theme-mode-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  it('should pass user data to user menu in header', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockUser),
    });

    render(<DashboardShell>Content</DashboardShell>);

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });

  it('should redirect to login on 401', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
    });

    render(<DashboardShell>Content</DashboardShell>);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle logout from user menu', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockUser),
      })
      .mockResolvedValueOnce({ ok: true });

    render(<DashboardShell>Content</DashboardShell>);

    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });

    screen.getByTestId('logout-button').click();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    render(<DashboardShell>Content</DashboardShell>);

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});

