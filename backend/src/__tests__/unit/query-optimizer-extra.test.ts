import {
  profileQuery,
  getOptimizationRecommendations,
  optimizeBatchQueries,
  clearQueryProfiles,
} from '../../utils/query-optimizer';

describe('getOptimizationRecommendations', () => {
  beforeEach(() => {
    clearQueryProfiles();
  });

  it('should report no data when nothing has been profiled', () => {
    const recommendations = getOptimizationRecommendations();

    expect(recommendations).toEqual(['No query data available yet']);
  });

  it('should report good performance when nothing is flagged', () => {
    profileQuery('SELECT id FROM users LIMIT 10', 10, 5);

    const recommendations = getOptimizationRecommendations();

    expect(recommendations).toEqual(['Query performance looks good!']);
  });

  it('should flag a high slow-query percentage', () => {
    for (let i = 0; i < 5; i++) {
      profileQuery('SELECT * FROM big_table', 200, 10);
    }

    const recommendations = getOptimizationRecommendations();

    expect(recommendations.some((r) => r.includes('are slow'))).toBe(true);
  });

  it('should flag a high average execution time', () => {
    profileQuery('SELECT * FROM medium_table', 80, 10);

    const recommendations = getOptimizationRecommendations();

    expect(recommendations.some((r) => r.includes('Average query execution time'))).toBe(true);
  });

  it('should flag a high average row count', () => {
    profileQuery('SELECT * FROM huge_table', 10, 5000);

    const recommendations = getOptimizationRecommendations();

    expect(recommendations.some((r) => r.includes('Consider pagination or filtering'))).toBe(true);
  });

  it('should combine multiple recommendations when several thresholds are exceeded', () => {
    for (let i = 0; i < 5; i++) {
      profileQuery('SELECT * FROM huge_table', 200, 5000);
    }

    const recommendations = getOptimizationRecommendations();

    expect(recommendations.length).toBeGreaterThan(1);
  });
});

describe('optimizeBatchQueries', () => {
  it('should return queries unchanged (advisory warnings only)', () => {
    const queries = ['SELECT * FROM users', 'SELECT id FROM chores LIMIT 10'];

    const result = optimizeBatchQueries(queries);

    expect(result).toEqual(queries);
  });

  it('should warn on SELECT *', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    optimizeBatchQueries(['SELECT * FROM users']);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('SELECT *'));
    consoleWarnSpy.mockRestore();
  });

  it('should warn on DELETE without WHERE', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    optimizeBatchQueries(['DELETE FROM users']);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('DELETE without WHERE'));
    consoleWarnSpy.mockRestore();
  });

  it('should not warn on DELETE with a WHERE clause', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    optimizeBatchQueries(['DELETE FROM users WHERE id = 1']);

    expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('DELETE without WHERE'));
    consoleWarnSpy.mockRestore();
  });

  it('should warn on SELECT without LIMIT', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    optimizeBatchQueries(['SELECT id FROM users']);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('SELECT without LIMIT'));
    consoleWarnSpy.mockRestore();
  });

  it('should not warn on SELECT with a LIMIT clause', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    optimizeBatchQueries(['SELECT id FROM users LIMIT 10']);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should process an empty list without error', () => {
    expect(optimizeBatchQueries([])).toEqual([]);
  });
});
