describe('Navigation — APEX (shell e-learning)', () => {
  beforeEach(function () {
    if (!Cypress.env('TEST_EMAIL') || !Cypress.env('TEST_PASSWORD')) {
      this.skip();
    }
    cy.login(String(Cypress.env('TEST_EMAIL')), String(Cypress.env('TEST_PASSWORD')));
  });

  it('ouvre le shell APEX et la vue overview', () => {
    cy.get('[data-testid="nav-apex"]', { timeout: 20000 }).should('be.visible').click();
    cy.get('[data-testid="apex-shell"]', { timeout: 30000 }).should('be.visible');
    cy.contains(/E-learning COYA|COYA e-learning/i).should('be.visible');
  });

  it('navigue vers le studio puis vers CRM Collecte (preset 1er cours)', () => {
    cy.get('[data-testid="nav-apex"]', { timeout: 20000 }).should('be.visible').click();
    cy.get('[data-testid="apex-shell"]', { timeout: 30000 }).should('be.visible');
    cy.window().then((win) => {
      win.history.replaceState(null, '', `${win.location.pathname}${win.location.search}#apex/studio`);
      win.dispatchEvent(new CustomEvent('coya-apex-section'));
    });

    cy.contains(/CRM → Collecte \(1er cours\)|CRM → Collect \(first course\)/).click();

    cy.window().then((win) => {
      const cId = win.sessionStorage.getItem('coya_nav_collecte_preset_formation_id');
      const flag = win.sessionStorage.getItem('coya_nav_crm_open_collecte_tab');
      expect(flag).to.eq('1');
      expect(cId).to.satisfy((value: string | null) => value === null || value.length > 0);
    });
  });
});

