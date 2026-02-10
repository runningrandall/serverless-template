describe('Admin Page', () => {
    it('should load admin page and verify accessibility', () => {
        cy.visit('/admin');

        // Check for redirection if not authenticated, or presence of login prompt
        // For now, we just ensure the page loads or redirects without crashing
        cy.url().should('not.eq', 'about:blank');

        cy.injectAxe();
        cy.checkA11y(undefined, {
            includedImpacts: ['critical', 'serious']
        }, (violations) => {
            cy.task('log', violations);
        });
    });
});
