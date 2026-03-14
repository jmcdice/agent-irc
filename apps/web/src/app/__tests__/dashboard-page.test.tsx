import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../dashboard/page';

describe('DashboardPage', () => {
  it('should render page header', () => {
    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Overview of your application')).toBeInTheDocument();
  });

  it('should render stats cards', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    expect(screen.getByText('API Calls (24h)')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('should render recent activity section', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Latest actions in your application')).toBeInTheDocument();
    expect(screen.getByText('User registered')).toBeInTheDocument();
  });

  it('should render getting started checklist', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Complete these steps to set up your app')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Customize your profile')).toBeInTheDocument();
  });

  it('should render quick action cards', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    expect(screen.getByText('Add, edit, or remove users')).toBeInTheDocument();
    expect(screen.getByText('Configure your application')).toBeInTheDocument();
    expect(screen.getByText('Learn how to use the template')).toBeInTheDocument();
  });

  it('should render progress bar in checklist', () => {
    render(<DashboardPage />);

    // Progress bar should show 1/5 completion
    expect(screen.getByText('1/5')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render multiple stat cards', () => {
    render(<DashboardPage />);

    // Stats row has 4 cards, activity + checklist has 2, quick actions has 3 = 9 cards total
    const cards = document.querySelectorAll('[data-slot="card"]');
    expect(cards.length).toBe(9);
  });
});

