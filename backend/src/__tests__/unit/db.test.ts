const mockPoolClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  query: jest.fn(),
  connect: jest.fn(() => mockPoolClient),
  on: jest.fn(),
  end: jest.fn(),
  totalCount: 5,
  idleCount: 3,
  waitingCount: 0,
};

jest.mock('pg', () => ({ Pool: jest.fn(() => mockPool) }));

import * as db from '../../database/db';

describe('db (postgres pool)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.connect.mockReturnValue(mockPoolClient);
  });

  describe('query', () => {
    it('should run the query and return the result', async () => {
      const result = { rows: [{ id: 1 }], rowCount: 1 };
      mockPool.query.mockResolvedValueOnce(result);

      const res = await db.query('SELECT * FROM chores WHERE id = $1', [1]);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM chores WHERE id = $1', [1]);
      expect(res).toEqual(result);
    });

    it('should default params to an empty array', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await db.query('SELECT 1');

      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1', []);
    });

    it('should rethrow on failure', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('connection refused'));

      await expect(db.query('SELECT 1')).rejects.toThrow('connection refused');
    });

    it('should warn on slow queries', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockPool.query.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ rows: [], rowCount: 0 }), 1100))
      );

      await db.query('SELECT pg_sleep(1.1)');

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Slow query'));
      consoleWarnSpy.mockRestore();
    }, 10000);
  });

  describe('queryOne', () => {
    it('should return the first row', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }], rowCount: 2 });

      const result = await db.queryOne('SELECT * FROM chores');

      expect(result).toEqual({ id: 1 });
    });

    it('should return null when there are no rows', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await db.queryOne('SELECT * FROM chores');

      expect(result).toBeNull();
    });
  });

  describe('queryAll', () => {
    it('should return all rows', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      mockPool.query.mockResolvedValueOnce({ rows, rowCount: 2 });

      const result = await db.queryAll('SELECT * FROM chores');

      expect(result).toEqual(rows);
    });
  });

  describe('queryCount', () => {
    it('should parse the count from the first row', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ count: '42' }], rowCount: 1 });

      const result = await db.queryCount('SELECT COUNT(*) as count FROM chores');

      expect(result).toBe(42);
    });

    it('should return 0 when there is no row', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await db.queryCount('SELECT COUNT(*) as count FROM chores');

      expect(result).toBe(0);
    });
  });

  describe('transaction', () => {
    it('should commit when the callback succeeds', async () => {
      mockPoolClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      const callback = jest.fn().mockResolvedValue('result');

      const result = await db.transaction(callback);

      expect(mockPoolClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(mockPoolClient);
      expect(mockPoolClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockPoolClient.release).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should rollback and release when the callback throws', async () => {
      mockPoolClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      const callback = jest.fn().mockRejectedValue(new Error('bad update'));

      await expect(db.transaction(callback)).rejects.toThrow('bad update');

      expect(mockPoolClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockPoolClient.release).toHaveBeenCalled();
    });
  });

  describe('batch', () => {
    it('should run each query within a transaction and collect results', async () => {
      mockPoolClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // query 1
        .mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 }) // query 2
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const results = await db.batch([
        { sql: 'INSERT INTO a VALUES ($1)', params: [1] },
        { sql: 'INSERT INTO b VALUES ($1)', params: [2] },
      ]);

      expect(results).toEqual([{ rows: [{ id: 1 }], rowCount: 1 }, { rows: [{ id: 2 }], rowCount: 1 }]);
    });
  });

  describe('healthCheck', () => {
    it('should return true when SELECT 1 returns a row', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 });

      const result = await db.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when the query fails', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('down'));

      const result = await db.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false when rowCount is not 1', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await db.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getPoolStats', () => {
    it('should report pool counts', () => {
      const stats = db.getPoolStats();

      expect(stats).toEqual({ total: 5, idle: 3, waiting: 0 });
    });
  });

  describe('closePool', () => {
    it('should end the pool', async () => {
      mockPool.end.mockResolvedValueOnce(undefined);

      await db.closePool();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});
