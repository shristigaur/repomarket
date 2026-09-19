describe('RepoMarket marketplace UI', () => {
  const api = 'http://localhost:5000/api';
  const verifiedUser = {
    _id: 'user-1',
    name: 'Ada Buyer',
    email: 'ada@example.com',
    avatar: 'https://example.com/avatar.png',
    role: 'BUYER',
    isEmailVerified: true
  };

  const auditReport = {
    codeHealthScore: 88,
    estimatedValuation: '$1,500 - $3,000',
    launchReadiness: 'Ready to deploy in 2 hours',
    techStackDetails: { frameworks: ['Express'], database: ['MongoDB'], runtime: 'Node.js 22' },
    projectCompleteness: { completedFeatures: ['REST API'], hasTests: true, hasDeploymentConfig: true, documentationRating: 'High' },
    dependencyAudit: { totalDependencies: 12, deprecatedOrOutdated: [], paidApiIntegrations: [] },
    riskAndSecurity: { licenseType: 'MIT', hasEnvExample: true, riskFlags: [] }
  };

  function authenticate(user = verifiedUser) {
    cy.intercept('GET', `${api}/auth/me`, { statusCode: 200, body: user });
  }

  function visitAuthenticated(path, user = verifiedUser) {
    authenticate(user);
    cy.visit(path, { onBeforeLoad: (window) => window.localStorage.setItem('repomarket_token', 'cypress-test-token') });
  }

  function stubMarketplace(listings = []) {
    cy.intercept('GET', `${api}/listings`, { statusCode: 200, body: listings }).as('getListings');
  }

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('transitions from OAuth buttons to the authenticated profile avatar', () => {
    cy.intercept('GET', `${api}/listings`, { statusCode: 200, body: [] });
    cy.visit('/');
    cy.contains('a', 'Sign in with Google').should('be.visible');
    cy.contains('a', 'Sign in with GitHub').should('be.visible');

    authenticate();
    cy.reload();
    cy.get('img[alt=""]').should('be.visible').and('have.attr', 'src', verifiedUser.avatar);
    cy.contains(verifiedUser.name).should('be.visible');
    cy.contains('a', 'Sign in with Google').should('not.exist');
  });

  it('renders the OTP modal and accepts a six-digit code', () => {
    const unverifiedUser = { ...verifiedUser, isEmailVerified: false };
    cy.intercept('POST', `${api}/auth/send-otp`, { statusCode: 200, body: { message: 'Verification code sent.' } }).as('sendOtp');
    visitAuthenticated('/create', unverifiedUser);
    cy.contains('Verify your email.').should('be.visible');
    cy.wait('@sendOtp');
    cy.get('#email-otp').type('123456').should('have.value', '123456');
    cy.contains('button', 'Verify OTP').should('be.enabled');
    cy.get('#email-otp').clear().type('12ab345678').should('have.value', '123456');
  });

  it('analyzes a repository and renders the code health score and framework tags', () => {
    stubMarketplace();
    cy.intercept('POST', `${api}/repos/analyze`, {
      statusCode: 200,
      body: { name: 'sample-repo', html_url: 'https://github.com/example/sample-repo', marketRate: 4400, aiReport: auditReport }
    }).as('analyze');
    visitAuthenticated('/create');
    cy.get('#repo-url').type('https://github.com/example/sample-repo');
    cy.get('#listing-price').type('800');
    cy.contains('button', 'Analyze & preview').click();
    cy.wait('@analyze');
    cy.contains('strong', '88').should('be.visible');
    cy.contains('Frameworks & runtime').should('be.visible');
    cy.contains('span', 'Express').should('be.visible');
  });

  it('submits a listing and shows the new card in the marketplace grid', () => {
    stubMarketplace([]);
    cy.intercept('POST', `${api}/repos/analyze`, { statusCode: 200, body: { name: 'sample-repo', description: 'A test repository', html_url: 'https://github.com/example/sample-repo', marketRate: 4400, aiReport: auditReport } });
    const listing = { _id: 'listing-1', repoName: 'sample-repo', repoUrl: 'https://github.com/example/sample-repo', price: 800, marketRate: 4400, aiReport: auditReport, status: 'ACTIVE' };
    cy.intercept('POST', `${api}/listings`, { statusCode: 201, body: listing }).as('publish');
    cy.intercept('GET', `${api}/listings`, { statusCode: 200, body: [listing] }).as('updatedListings');
    visitAuthenticated('/create');
    cy.get('#repo-url').type(listing.repoUrl);
    cy.get('#listing-price').type('800');
    cy.contains('button', 'Analyze & preview').click();
    cy.contains('button', 'Confirm & list for sale').click();
    cy.wait('@publish');
    cy.location('pathname').should('eq', '/marketplace');
    cy.contains('h2', listing.repoName).should('be.visible');
  });

  it('opens the AI assistant, sends a question, and renders the response bubble', () => {
    stubMarketplace([]);
    cy.intercept('POST', `${api}/assistant/chat`, {
      statusCode: 200,
      body: { reply: 'Review tests, dependencies, documentation, and deployment configuration.' }
    }).as('assistantChat');
    cy.visit('/');
    cy.get('button[aria-label="Open AI assistant"]').click();
    cy.get('[role="dialog"][aria-label="AI liquidation assistant"]').should('be.visible');
    cy.get('textarea[aria-label="Assistant message"]').type('How should I value this repository?');
    cy.get('button[aria-label="Send message"]').click();
    cy.wait('@assistantChat');
    cy.contains('Review tests, dependencies, documentation, and deployment configuration.').should('be.visible');
    cy.contains('Failed to fetch').should('not.exist');
  });
});
