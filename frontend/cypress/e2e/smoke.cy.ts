describe('Smoke Test', () => {
    it('should load the home page', () => {
        cy.visit('/');
        cy.contains('Serverless Template App').should('be.visible');
    });

    it('should verify accessibility on home page', () => {
        cy.visit('/');
        cy.injectAxe();
        cy.checkA11y(undefined, {
            includedImpacts: ['critical', 'serious']
        }, (violations) => {
            cy.task('log', violations);
        });
    });


});
