import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminLayout from '../../../app/admin/layout';

// Mock dependencies if needed
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

// Mock ResizeObserver which is used by Sidebar
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('AdminLayout', () => {
    it('should render sidebar as collapsed by default', () => {
        render(
            <AdminLayout>
                <div>Child Content</div>
            </AdminLayout>
        );

        // Sidebar uses data-state="collapsed" when closed
        // We look for the sidebar div that has this attribute
        const sidebar = document.querySelector('div[data-state="collapsed"]');
        expect(sidebar).toBeInTheDocument();

        // Also verify content is rendered
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
});
