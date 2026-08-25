import {
  recommendedIndexes,
  generateCreateIndexSQL,
  getIndexSQL,
  indexOptimizations,
  getIndexMonitoringQueries,
} from '../../database/indexes';

describe('recommendedIndexes', () => {
  it('should be a non-empty list of well-formed index definitions', () => {
    expect(recommendedIndexes.length).toBeGreaterThan(0);
    recommendedIndexes.forEach((idx) => {
      expect(idx.name).toEqual(expect.any(String));
      expect(idx.table).toEqual(expect.any(String));
      expect(idx.columns.length).toBeGreaterThan(0);
      expect(idx.description).toEqual(expect.any(String));
    });
  });

  it('should have unique index names', () => {
    const names = recommendedIndexes.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('generateCreateIndexSQL', () => {
  it('should generate one CREATE INDEX statement per recommended index', () => {
    const statements = generateCreateIndexSQL();

    expect(statements).toHaveLength(recommendedIndexes.length);
    statements.forEach((sql) => {
      expect(sql).toMatch(/^CREATE (UNIQUE )?INDEX IF NOT EXISTS \w+ ON \w+ \(.+\)( WHERE .+)?;$/);
    });
  });

  it('should mark unique indexes as UNIQUE', () => {
    const statements = generateCreateIndexSQL();
    const uniqueIndex = recommendedIndexes.findIndex((i) => i.unique);

    expect(statements[uniqueIndex]).toContain('CREATE UNIQUE INDEX');
  });

  it('should append a WHERE clause for partial indexes', () => {
    const statements = generateCreateIndexSQL();
    const partialIndexPos = recommendedIndexes.findIndex((i) => i.partial);

    expect(statements[partialIndexPos]).toContain(`WHERE ${recommendedIndexes[partialIndexPos].partial}`);
  });
});

describe('getIndexSQL', () => {
  it('should return SQL for all indexes when no table is given', () => {
    const sql = getIndexSQL();

    const lineCount = sql.split('\n').filter(Boolean).length;
    expect(lineCount).toBe(recommendedIndexes.length);
  });

  it('should filter to only the given table', () => {
    const sql = getIndexSQL('badges');
    const badgesIndexNames = recommendedIndexes.filter((i) => i.table === 'badges').map((i) => i.name);

    badgesIndexNames.forEach((name) => expect(sql).toContain(name));
    // Should not include indexes from other tables
    const otherIndexNames = recommendedIndexes.filter((i) => i.table !== 'badges').map((i) => i.name);
    otherIndexNames.forEach((name) => expect(sql).not.toContain(name));
  });

  it('should return an empty string for an unknown table', () => {
    const sql = getIndexSQL('nonexistent_table');

    expect(sql).toBe('');
  });
});

describe('indexOptimizations', () => {
  it('should expose named optimization snippets as non-empty strings', () => {
    expect(indexOptimizations.selectOptimization.length).toBeGreaterThan(0);
    expect(indexOptimizations.joinOptimization.length).toBeGreaterThan(0);
    expect(indexOptimizations.timeRangeOptimization.length).toBeGreaterThan(0);
    expect(indexOptimizations.aggregationOptimization.length).toBeGreaterThan(0);
  });
});

describe('getIndexMonitoringQueries', () => {
  it('should return the five named monitoring queries', () => {
    const queries = getIndexMonitoringQueries();

    expect(Object.keys(queries).sort()).toEqual(
      ['indexSize', 'missingIndexes', 'sequentialScans', 'tableSize', 'unusedIndexes'].sort()
    );
    Object.values(queries).forEach((sql) => expect(sql.length).toBeGreaterThan(0));
  });
});
