import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableColumnHeader } from '../data-table';

interface TestData {
  id: string;
  name: string;
  email: string;
}

const columns: ColumnDef<TestData>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];

const testData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
];

describe('DataTable', () => {
  it('should render table with data', () => {
    render(<DataTable columns={columns} data={testData} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    render(<DataTable columns={columns} data={testData} />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('should render search input when searchKey is provided', () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        searchKey="name"
        searchPlaceholder="Search by name..."
      />
    );

    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument();
  });

  it('should filter data based on search', async () => {
    const user = userEvent.setup();

    render(
      <DataTable columns={columns} data={testData} searchKey="name" />
    );

    await user.type(screen.getByPlaceholderText('Search...'), 'Jane');

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('should show pagination controls', () => {
    render(<DataTable columns={columns} data={testData} />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should show row selection count', () => {
    render(<DataTable columns={columns} data={testData} />);

    expect(screen.getByText(/0 of 3 row\(s\) selected/)).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    render(<DataTable columns={columns} data={testData} />);

    expect(screen.getByText('Previous')).toBeDisabled();
  });
});

describe('DataTableColumnHeader', () => {
  it('should render title', () => {
    const mockColumn = {
      getIsSorted: () => false as const,
      toggleSorting: vi.fn(),
    };

    render(<DataTableColumnHeader column={mockColumn} title="Column Title" />);

    expect(screen.getByText('Column Title')).toBeInTheDocument();
  });

  it('should toggle sorting on click', () => {
    const toggleSorting = vi.fn();
    const mockColumn = {
      getIsSorted: () => false as const,
      toggleSorting,
    };

    render(<DataTableColumnHeader column={mockColumn} title="Sort Me" />);

    fireEvent.click(screen.getByRole('button'));

    expect(toggleSorting).toHaveBeenCalledWith(false);
  });

  it('should toggle sorting descending when already ascending', () => {
    const toggleSorting = vi.fn();
    const mockColumn = {
      getIsSorted: () => 'asc' as const,
      toggleSorting,
    };

    render(<DataTableColumnHeader column={mockColumn} title="Sorted" />);

    fireEvent.click(screen.getByRole('button'));

    expect(toggleSorting).toHaveBeenCalledWith(true);
  });
});

