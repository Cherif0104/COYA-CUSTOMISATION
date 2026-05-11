/**
 * Smoke test aligné sur le parcours manuel recommandé :
 * - Assistant création projet : Informations → Planification → Équipe → Résumé → Créer
 * - Module Programme : liste → détail (bandeau budget / progression si données)
 * - Workspace projet : Aperçu (KPI finances / donut Recharts si données)
 *
 * Prérequis : serveur Vite sur le port du `cypress.config.ts` (5174) :
 *   `npm run dev`
 * Variables : `cypress.env.json` avec TEST_EMAIL, TEST_PASSWORD
 *
 * Lancement : `npm run test:e2e:smoke`
 */

describe('Smoke — Projets / Programmes / Workspace', () => {
  beforeEach(function () {
    if (!Cypress.env('TEST_EMAIL') || !Cypress.env('TEST_PASSWORD')) {
      this.skip();
    }
    cy.login(String(Cypress.env('TEST_EMAIL')), String(Cypress.env('TEST_PASSWORD')));
  });

  it('assistant création : Informations → Planification → Équipe → Résumé → Créer', function () {
    cy.navigateToModule('Projets');
    cy.get('[data-testid="projects-list"]', { timeout: 25000 }).should('be.visible');

    cy.get('body').then(function ($body) {
      if (!$body.find('[data-testid="projects-create-btn"]').length) {
        this.skip();
      }
    });

    cy.get('[data-testid="projects-create-btn"]').click({ force: true });
    cy.get('[data-testid="project-create-wizard"]', { timeout: 15000 }).should('be.visible');

    const title = `E2E Smoke ${Date.now()}`;
    const desc =
      'Description de test pour le smoke Cypress : au moins trente caractères requis par le validateur du wizard projet.';

    cy.get('[data-testid="project-create-title"]').clear().type(title);
    cy.get('[data-testid="project-create-description"]').clear().type(desc);
    cy.get('[data-testid="project-wizard-next"]').should('be.enabled').click();

    cy.contains(/planification|planning/i).should('be.visible');
    cy.get('[data-testid="project-create-due-date"]').should('be.visible');

    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const ymd = future.toISOString().slice(0, 10);
    cy.get('[data-testid="project-create-due-date"]').clear().type(ymd);

    cy.get('[data-testid="project-wizard-next"]').should('be.enabled').click();

    cy.get('[data-testid="team-selector-search"]', { timeout: 15000 }).should('be.visible').click();
    cy.get('[data-testid="team-selector-dropdown"]', { timeout: 15000 }).should('be.visible');

    cy.get('body').then(function ($body) {
      if (!$body.find('[data-testid="team-selector-option"][data-pickable="true"]').length) {
        this.skip();
      }
    });

    cy.get('[data-testid="team-selector-option"][data-pickable="true"]').first().click({ force: true });
    cy.get('[data-testid="project-wizard-next"]').should('be.enabled').click();

    cy.contains(/résumé|review|validation/i).should('be.visible');
    cy.contains(title).should('be.visible');

    cy.get('[data-testid="project-wizard-submit"]').should('be.enabled').click();
    cy.get('[data-testid="project-create-wizard"]', { timeout: 30000 }).should('not.exist');
    cy.get('[data-testid="projects-list"]', { timeout: 15000 }).should('be.visible');
  });

  it('programme : ouvrir un programme (détail si liste non vide)', function () {
    cy.navigateToModule('Programme');
    cy.get('[data-testid="programmes-list"]', { timeout: 25000 }).should('be.visible');
    cy.wait(800);

    cy.get('body').then(function ($body) {
      const rows = $body.find('[data-testid="programme-item"]');
      if (rows.length === 0) {
        this.skip();
      }
      cy.wrap(rows.first()).click({ force: true });
    });

    cy.get('[data-testid="programme-detail"]', { timeout: 15000 }).should('be.visible');
    cy.get('body', { timeout: 15000 }).should(($body) => {
      const t = $body.text();
      const hasEnterprise =
        /répartition budgétaire|budget breakdown|progression globale|overall progress|retour à la liste/i.test(t);
      const hasRecharts =
        $body.find('.recharts-wrapper').length > 0 || $body.find('[data-testid="enterprise-donut-ring"]').length > 0;
      expect(hasEnterprise || hasRecharts).to.eq(true);
    });
  });

  it('workspace projet : Aperçu (graphiques / finances si présents)', function () {
    cy.navigateToModule('Projets');
    cy.get('[data-testid="projects-list"]', { timeout: 25000 }).should('be.visible');

    cy.get('[data-testid="project-item"]', { timeout: 15000 })
      .should('have.length.at.least', 1)
      .first()
      .click({ force: true });

    cy.get('[data-testid="project-workspace"]', { timeout: 20000 }).should('be.visible');

    cy.get('body', { timeout: 20000 }).should(($body) => {
      const t = $body.text();
      const hasChart = $body.find('.recharts-wrapper').length > 0;
      const hasFinance = /performance financière|financial performance/i.test(t);
      expect(hasChart || hasFinance || /aperçu|overview|projet/i.test(t)).to.eq(true);
    });
  });
});
