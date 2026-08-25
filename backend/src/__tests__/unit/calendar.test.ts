import { getCalendarService } from '../../services/calendar';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

describe('CalendarService', () => {
  const service = getCalendarService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFamilyEvents', () => {
    it('should query with only family_id when no date range given', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getFamilyEvents('family-1');

      expect(connection.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE family_id = $1'),
        ['family-1']
      );
    });

    it('should add start/end date conditions when provided', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'e1' }] });

      const result = await service.getFamilyEvents('family-1', '2026-01-01', '2026-01-31');

      const [sql, params] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('event_date >= $2');
      expect(sql).toContain('event_date <= $3');
      expect(params).toEqual(['family-1', '2026-01-01', '2026-01-31']);
      expect(result).toEqual([{ id: 'e1' }]);
    });

    it('should rethrow on query failure', async () => {
      (connection.query as jest.Mock).mockRejectedValueOnce(new Error('db error'));

      await expect(service.getFamilyEvents('family-1')).rejects.toThrow('db error');
    });
  });

  describe('getUpcomingEvents', () => {
    it('should query a 7-day window limited to 10 events', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await service.getUpcomingEvents('family-1');

      const [sql, params] = (connection.query as jest.Mock).mock.calls[0];
      expect(sql).toContain('LIMIT 10');
      expect(params[0]).toBe('family-1');
    });
  });

  describe('createEvent', () => {
    it('should create an event with defaults for optional fields', async () => {
      const created = { id: 'e1', event_title: 'Soccer practice' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(created);

      const result = await service.createEvent('family-1', 'parent-1', {
        event_title: 'Soccer practice',
        event_date: '2026-03-01',
      });

      expect(result).toEqual(created);
      const params = (connection.queryOne as jest.Mock).mock.calls[0][1];
      expect(params).toEqual([
        'family-1',
        'Soccer practice',
        null,
        null,
        '2026-03-01',
        null,
        null,
        null,
        'parent-1',
      ]);
    });

    it('should throw if insert returns nothing', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.createEvent('family-1', 'parent-1', { event_title: 'x', event_date: '2026-01-01' })
      ).rejects.toThrow('Failed to create event');
    });
  });

  describe('updateEvent', () => {
    it('should only update whitelisted columns', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'e1', event_title: 'Updated' });

      await service.updateEvent('e1', {
        event_title: 'Updated',
        family_id: 'attacker-controlled',
      } as never);

      const [sql, params] = (connection.queryOne as jest.Mock).mock.calls[0];
      expect(sql).toContain('event_title = $2');
      expect(sql).not.toContain('family_id');
      expect(params).toEqual(['e1', 'Updated']);
    });

    it('should just fetch the row when no updatable columns are given', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'e1' });

      await service.updateEvent('e1', {} as never);

      expect(connection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM calendar_events'),
        ['e1']
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete by id', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({});

      await service.deleteEvent('e1');

      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM calendar_events'), ['e1']);
    });
  });

  describe('getEventsByType', () => {
    it('should filter by event type', async () => {
      const rows = [{ id: 'e1', event_type: 'chore' }];
      (connection.query as jest.Mock).mockResolvedValueOnce({ rows });

      const result = await service.getEventsByType('family-1', 'chore');

      expect(connection.query).toHaveBeenCalledWith(expect.any(String), ['family-1', 'chore']);
      expect(result).toEqual(rows);
    });
  });
});
