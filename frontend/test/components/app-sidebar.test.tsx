import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppSidebar } from '../../components/app-sidebar';

import { SidebarProvider } from '../../components/ui/sidebar';

describe('AppSidebar', () => {
    it('should render menu items', () => {
        render(
            <SidebarProvider>
                <AppSidebar />
            </SidebarProvider>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Application')).toBeInTheDocument();
    });
});
