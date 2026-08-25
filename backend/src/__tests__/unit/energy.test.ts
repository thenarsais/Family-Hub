import { getEnergyService } from '../../services/energy';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

describe('EnergyService', () => {
  const service = getEnergyService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEnergyUsage', () => {
    it('should query by date window only when no device given', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getEnergyUsage(30);

      const [sql, params] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('timestamp >= $1');
      expect(sql).not.toContain('device_id');
      expect(params).toHaveLength(1);
    });

    it('should add a device_id condition when provided', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'u1' }] });

      const result = await service.getEnergyUsage(7, 'device-1');

      const [sql, params] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('device_id = $2');
      expect(params[1]).toBe('device-1');
      expect(result).toEqual([{ id: 'u1' }]);
    });

    it('should rethrow on failure', async () => {
      (connection.query as jest.Mock).mockRejectedValueOnce(new Error('db error'));

      await expect(service.getEnergyUsage()).rejects.toThrow('db error');
    });
  });

  describe('getEnergySummary', () => {
    it('should query by period and lookback window', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 's1' }] });

      const result = await service.getEnergySummary('monthly', 6);

      const [sql, params] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('period = $1');
      expect(params[0]).toBe('monthly');
      expect(result).toEqual([{ id: 's1' }]);
    });
  });

  describe('getCurrentMonthUsage', () => {
    it('should parse the summed total', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ total: '42.5' });

      const result = await service.getCurrentMonthUsage();

      expect(result).toBe(42.5);
    });

    it('should return 0 when there is no result', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getCurrentMonthUsage();

      expect(result).toBe(0);
    });
  });

  describe('createEnergyGoal', () => {
    it('should default points_reward to 100', async () => {
      const goal = { id: 'g1', goal_type: 'monthly' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(goal);

      const result = await service.createEnergyGoal('parent-1', {
        goal_type: 'monthly',
        target_kwh: 500,
        start_date: '2026-01-01',
        end_date: '2026-01-31',
      });

      expect(result).toEqual(goal);
      const params = (connection.queryOne as jest.Mock).mock.calls[0][1];
      expect(params[5]).toBe(100);
    });

    it('should throw if insert returns nothing', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.createEnergyGoal('parent-1', {
          goal_type: 'daily',
          target_kwh: 10,
          start_date: '2026-01-01',
          end_date: '2026-01-02',
        })
      ).rejects.toThrow('Failed to create energy goal');
    });
  });

  describe('getEnergyGoals', () => {
    it('should return only active goals for the user', async () => {
      const rows = [{ id: 'g1', status: 'active' }];
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows });

      const result = await service.getEnergyGoals('parent-1');

      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining("status = 'active'"), ['parent-1']);
      expect(result).toEqual(rows);
    });
  });

  describe('recordEnergyUsage', () => {
    it('should insert a usage record', async () => {
      const record = { id: 'u1', device_id: 'device-1' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(record);

      const result = await service.recordEnergyUsage('device-1', 'Fridge', 'appliance', 150, 0.15);

      expect(result).toEqual(record);
      expect(connection.queryOne).toHaveBeenCalledWith(expect.any(String), [
        'device-1',
        'Fridge',
        'appliance',
        150,
        0.15,
      ]);
    });

    it('should throw if insert returns nothing', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.recordEnergyUsage('device-1', 'Fridge', 'appliance', 150, 0.15)
      ).rejects.toThrow('Failed to record energy usage');
    });
  });

  describe('getDeviceEnergyUsage', () => {
    it('should scope to device and date window', async () => {
      const rows = [{ id: 'u1' }];
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows });

      const result = await service.getDeviceEnergyUsage('device-1', 14);

      const [, params] = (connection.query as jest.Mock).mock.calls[0];
      expect(params[0]).toBe('device-1');
      expect(result).toEqual(rows);
    });
  });
});
