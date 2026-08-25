const mockPoolClient = { query: jest.fn(), release: jest.fn() };

const mockPool = {
  query: jest.fn(),
  connect: jest.fn(() => mockPoolClient),
  on: jest.fn(),
  end: jest.fn(),
};

jest.mock('pg', () => ({ Pool: jest.fn(() => mockPool) }));

import * as connection from '../../database/connection';

describe('connection (postgres pool)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('query', () => {
    it('should run the query and normalize the result shape', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

      const result = await connection.query('SELECT * FROM chores WHERE id = $1', [1]);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM chores WHERE id = $1', [1]);
      expect(result).toEqual({ rows: [{ id: 1 }], rowCount: 1 });
    });

    it('should default rowCount to 0 when pg returns null', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: null });

      const result = await connection.query('SELECT 1');

      expect(result.rowCount).toBe(0);
    });

    it('should warn on slow queries', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockPool.query.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ rows: [], rowCount: 0 }), 1100))
      );

      await connection.query('SELECT pg_sleep(1.1)');

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Slow query'));
      consoleWarnSpy.mockRestore();
    }, 10000);

    it('should log and rethrow on failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPool.query.mockRejectedValueOnce(new Error('connection refused'));

      await expect(connection.query('SELECT 1')).rejects.toThrow('connection refused');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('queryOne', () => {
    it('should return the first row', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }], rowCount: 2 });

      const result = await connection.queryOne('SELECT * FROM chores');

      expect(result).toEqual({ id: 1 });
    });

    it('should return null when there are no rows', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await connection.queryOne('SELECT * FROM chores');

      expect(result).toBeNull();
    });
  });

  describe('getClient', () => {
    it('should return a client from the pool', async () => {
      const client = await connection.getClient();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(client).toBe(mockPoolClient);
    });
  });

  describe('testConnection', () => {
    it('should return true when the query succeeds with rows', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ now: '2026-01-01' }] });

      const result = await connection.testConnection();

      expect(result).toBe(true);
    });

    it('should return false when the query fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPool.query.mockRejectedValueOnce(new Error('down'));

      const result = await connection.testConnection();

      expect(result).toBe(false);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('closePool', () => {
    it('should end the pool', async () => {
      mockPool.end.mockResolvedValueOnce(undefined);

      await connection.closePool();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});
