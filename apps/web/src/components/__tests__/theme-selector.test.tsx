import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeSelector } from '../themes/theme-selector';
import { ActiveThemeProvider } from '../themes/active-theme';

// Note: scrollIntoView is mocked globally in vitest.setup.ts

// Mock the theme config
vi.mock('../themes/theme.config', () => ({
  THEMES: [
    { name: 'Default', value: 'default' },
    { name: 'Claude', value: 'claude' },
    { name: 'Cosmos', value: 'cosmos' },
  ],
  DEFAULT_THEME: 'claude',
}));

const renderWithProvider = (ui: React.ReactNode, initialTheme?: string) => {
  return render(
    <ActiveThemeProvider initialTheme={initialTheme}>{ui}</ActiveThemeProvider>
  );
};

describe('ThemeSelector', () => {
  it('should render the select trigger', () => {
    renderWithProvider(<ThemeSelector />, 'claude');

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should display current theme value', () => {
    renderWithProvider(<ThemeSelector />, 'claude');

    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('should show all themes when opened', async () => {
    renderWithProvider(<ThemeSelector />, 'default');

    fireEvent.click(screen.getByRole('combobox'));

    await waitFor(() => {
      // Use role-based queries to avoid duplicate text matches (trigger + option both show "Default")
      expect(screen.getByRole('option', { name: 'Default' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Claude' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cosmos' })).toBeInTheDocument();
    });
  });

  it('should show themes label', async () => {
    renderWithProvider(<ThemeSelector />, 'default');

    fireEvent.click(screen.getByRole('combobox'));

    await waitFor(() => {
      expect(screen.getByText('Themes')).toBeInTheDocument();
    });
  });

  it('should change theme when option is selected', async () => {
    renderWithProvider(<ThemeSelector />, 'default');

    fireEvent.click(screen.getByRole('combobox'));

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Claude' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('option', { name: 'Claude' }));

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('Claude');
    });
  });
});

