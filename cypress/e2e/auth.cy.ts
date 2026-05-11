describe('Flux authentification', () => {
  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();
    cy.visit('/');
  });

  function waitForLoginOrSetup() {
    // Cypress doit attendre le rendu React (sinon body/text peut être vide au moment du `then`).
    cy.document()
      .its('body')
      .should((body) => {
        const text = body.innerText || '';
        const hasLogin = Boolean(body.querySelector('[data-testid="login-email"]'));
        const hasSetup = text.includes('Configuration requise');
        expect(hasLogin || hasSetup).to.equal(true);
      });
  }

  it('affiche le formulaire de connexion', function () {
    waitForLoginOrSetup();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-email"]').length > 0) {
        cy.get('[data-testid="login-email"]').should('be.visible');
        cy.get('[data-testid="login-password"]').should('be.visible');
        cy.get('[data-testid="login-submit"]').should('be.visible');
      } else {
        cy.contains('Configuration requise').should('be.visible');
      }
    });
  });

  it('affiche une erreur avec des identifiants invalides', function () {
    waitForLoginOrSetup();
    cy.get('body').then(($body) => {
      // Mode setup : Supabase pas configuré → pas de login à tester.
      if ($body.find('[data-testid="login-email"]').length === 0) {
        cy.contains('Configuration requise').should('be.visible');
      } else {
        cy.get('[data-testid="login-email"]').type('invalid@example.com');
        cy.get('[data-testid="login-password"]').type('wrongpassword');
        cy.get('[data-testid="login-submit"]').click();
        cy.get('[data-testid="login-error"]', { timeout: 15000 }).should('be.visible');
      }
    });
  });

  it('connecte avec des identifiants valides (variables d’env)', function () {
    if (!Cypress.env('TEST_EMAIL') || !Cypress.env('TEST_PASSWORD')) {
      this.skip();
    }
    cy.login(String(Cypress.env('TEST_EMAIL')), String(Cypress.env('TEST_PASSWORD')));
    cy.get('[data-testid="dashboard"]', { timeout: 30000 }).should('be.visible');
  });

  it('persiste la session après rechargement', function () {
    if (!Cypress.env('TEST_EMAIL') || !Cypress.env('TEST_PASSWORD')) {
      this.skip();
    }
    cy.login(String(Cypress.env('TEST_EMAIL')), String(Cypress.env('TEST_PASSWORD')));
    cy.reload();
    cy.get('[data-testid="dashboard"]', { timeout: 30000 }).should('exist');
    cy.get('[data-testid="login-email"]').should('not.exist');
  });
});
