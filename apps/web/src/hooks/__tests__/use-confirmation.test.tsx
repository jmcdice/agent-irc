import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmationProvider, useConfirmation } from '../use-confirmation';

// Test component that uses the hook
function TestComponent({ onResult }: { onResult: (result: boolean) => void }) {
  const { confirm } = useConfirmation();

  const handleClick = async () => {
    const result = await confirm({
      title: 'Confirm Action',
      description: 'Are you sure?',
      confirmLabel: 'Yes',
      cancelLabel: 'No',
    });
    onResult(result);
  };

  return <button onClick={handleClick}>Open Dialog</button>;
}

describe('useConfirmation', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent onResult={() => {}} />);
    }).toThrow('useConfirmation must be used within a ConfirmationProvider');

    consoleSpy.mockRestore();
  });

  it('should render dialog when confirm is called', async () => {
    const onResult = vi.fn();

    render(
      <ConfirmationProvider>
        <TestComponent onResult={onResult} />
      </ConfirmationProvider>
    );

    fireEvent.click(screen.getByText('Open Dialog'));

    await waitFor(() => {
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });
  });

  it('should resolve true when confirmed', async () => {
    const onResult = vi.fn();

    render(
      <ConfirmationProvider>
        <TestComponent onResult={onResult} />
      </ConfirmationProvider>
    );

    fireEvent.click(screen.getByText('Open Dialog'));

    await waitFor(() => {
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Yes'));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(true);
    });
  });

  it('should resolve false when cancelled', async () => {
    const onResult = vi.fn();

    render(
      <ConfirmationProvider>
        <TestComponent onResult={onResult} />
      </ConfirmationProvider>
    );

    fireEvent.click(screen.getByText('Open Dialog'));

    await waitFor(() => {
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('No'));

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(false);
    });
  });

  it('should use default labels when not provided', async () => {
    function SimpleTestComponent() {
      const { confirm } = useConfirmation();
      return (
        <button onClick={() => confirm({ title: 'Simple' })}>
          Simple Dialog
        </button>
      );
    }

    render(
      <ConfirmationProvider>
        <SimpleTestComponent />
      </ConfirmationProvider>
    );

    fireEvent.click(screen.getByText('Simple Dialog'));

    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });
});

describe('ConfirmationProvider', () => {
  it('should render children', () => {
    render(
      <ConfirmationProvider>
        <div>Child content</div>
      </ConfirmationProvider>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});

