import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../../app/page';

// Mock the API module
vi.mock('../../lib/api', () => ({
    listItems: vi.fn(),
    createItem: vi.fn(),
    deleteItem: vi.fn(),
}));

import { listItems, createItem, deleteItem } from '../../lib/api';

describe('Home page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: no items
        (listItems as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        // Set API URL env var so the page renders
        vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/');
    });

    it('should render the page title', async () => {
        render(<Home />);

        expect(screen.getByText('Serverless Template App')).toBeInTheDocument();
    });

    it('should show loading state then items', async () => {
        const mockItems = [
            { itemId: '1', name: 'Alpha', description: 'desc', pk: 'pk', sk: 'sk', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { itemId: '2', name: 'Beta', description: 'desc', pk: 'pk', sk: 'sk', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
        ];
        (listItems as ReturnType<typeof vi.fn>).mockResolvedValue(mockItems);

        render(<Home />);

        await waitFor(() => {
            expect(screen.getByText('Alpha')).toBeInTheDocument();
            expect(screen.getByText('Beta')).toBeInTheDocument();
        });
    });

    it('should show empty state when no items', async () => {
        (listItems as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        render(<Home />);

        await waitFor(() => {
            expect(screen.getByText('No items found. Create one above!')).toBeInTheDocument();
        });
    });

    it('should create a new item', async () => {
        const newItem = { itemId: '3', name: 'New Item', description: 'Created via Web UI', pk: 'pk', sk: 'sk', createdAt: '2024-01-03', updatedAt: '2024-01-03' };
        (createItem as ReturnType<typeof vi.fn>).mockResolvedValue(newItem);

        render(<Home />);

        const input = screen.getByPlaceholderText('Item name...');
        fireEvent.change(input, { target: { value: 'New Item' } });

        const addButton = screen.getByText('Add');
        await waitFor(() => expect(addButton).not.toBeDisabled());
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(createItem).toHaveBeenCalledWith('New Item', 'Created via Web UI');
            expect(screen.getByText('New Item')).toBeInTheDocument();
        });
    });

    it('should not submit empty item name', async () => {
        render(<Home />);

        const addButton = screen.getByText('Add');
        expect(addButton).toBeDisabled();
    });

    it('should show error on listItems failure', async () => {
        const error = new Error('Network error');
        (listItems as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        render(<Home />);

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });

    it('should show error on createItem failure', async () => {
        (createItem as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Create failed'));

        render(<Home />);

        const input = screen.getByPlaceholderText('Item name...');
        fireEvent.change(input, { target: { value: 'Fail Item' } });

        const addButton = screen.getByText('Add');
        await waitFor(() => expect(addButton).not.toBeDisabled());
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText('Create failed')).toBeInTheDocument();
        });
    });

    it('should show configuration required when API URL is not set', () => {
        vi.stubEnv('NEXT_PUBLIC_API_URL', '');

        render(<Home />);

        expect(screen.getByText('Configuration Required')).toBeInTheDocument();
    });

    it('should render navigation links', async () => {
        render(<Home />);

        expect(screen.getByText('Login / Sign Up')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    it('should have a refresh button', async () => {
        render(<Home />);

        await waitFor(() => {
            expect(screen.getByText('Refresh')).toBeInTheDocument();
        });
    });

    it('should delete an item', async () => {
        const mockItems = [{ itemId: '1', name: 'Delete Me', description: 'desc', pk: 'pk', sk: 'sk', createdAt: '2024-01-01', updatedAt: '2024-01-01' }];
        (listItems as ReturnType<typeof vi.fn>).mockResolvedValue(mockItems);
        (deleteItem as ReturnType<typeof vi.fn>).mockResolvedValue({ message: 'deleted' });

        // Mock window.confirm
        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);

        render(<Home />);

        await waitFor(() => {
            expect(screen.getByText('Delete Me')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(deleteItem).toHaveBeenCalledWith('1');
            expect(screen.queryByText('Delete Me')).not.toBeInTheDocument();
        });

        confirmSpy.mockRestore();
    });

    it('should not delete if confirm cancelled', async () => {
        const mockItems = [{ itemId: '1', name: 'Keep Me', description: 'desc', pk: 'pk', sk: 'sk', createdAt: '2024-01-01', updatedAt: '2024-01-01' }];
        (listItems as ReturnType<typeof vi.fn>).mockResolvedValue(mockItems);

        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => false);

        render(<Home />);

        await waitFor(() => {
            expect(screen.getByText('Keep Me')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(deleteItem).not.toHaveBeenCalled();
        expect(screen.getByText('Keep Me')).toBeInTheDocument();

        confirmSpy.mockRestore();
    });

    it('should show error on delete failure', async () => {
        const mockItems = [{ itemId: '1', name: 'Error Item', description: 'desc', pk: 'pk', sk: 'sk', createdAt: '2024-01-01', updatedAt: '2024-01-01' }];
        (listItems as ReturnType<typeof vi.fn>).mockResolvedValue(mockItems);
        (deleteItem as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Delete failed'));

        const confirmSpy = vi.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);

        render(<Home />);

        await waitFor(() => {
            expect(screen.getByText('Error Item')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Delete failed')).toBeInTheDocument();
        });

        confirmSpy.mockRestore();
    });
});
