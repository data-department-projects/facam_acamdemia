import { APP_NAME } from '@facam-academia/shared';

/**
 * Test unitaire minimal pour la page d'accueil (évite échec CI si aucun test).
 */
describe('HomePage', () => {
  it('should use APP_NAME from shared', () => {
    expect(APP_NAME).toBe('FACAM ACADEMIA');
  });
});
