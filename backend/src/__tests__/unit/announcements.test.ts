import { getAnnouncementService } from '../../services/announcements';
import * as connection from '../../database/connection';

jest.mock('../../database/connection');

describe('AnnouncementService', () => {
  const service = getAnnouncementService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnnouncementsForUser', () => {
    it('should return empty array when user has no family', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getAnnouncementsForUser('user-1');

      expect(result).toEqual([]);
    });

    it('should filter out specific-audience announcements not targeting this user', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ family_id: 'family-1' });
      (connection.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            { id: 'a1', target_audience: 'all' },
            { id: 'a2', target_audience: 'specific', target_user_ids: ['other-user'] },
            { id: 'a3', target_audience: 'specific', target_user_ids: ['user-1'] },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ announcement_id: 'a1' }] });

      const result = await service.getAnnouncementsForUser('user-1');

      expect(result.map((a) => a.id)).toEqual(['a1', 'a3']);
      expect(result.find((a) => a.id === 'a1')?.is_read).toBe(true);
      expect(result.find((a) => a.id === 'a3')?.is_read).toBe(false);
    });

    it('should rethrow on failure', async () => {
      (connection.queryOne as jest.Mock).mockRejectedValueOnce(new Error('db error'));

      await expect(service.getAnnouncementsForUser('user-1')).rejects.toThrow('db error');
    });
  });

  describe('createAnnouncement', () => {
    it('should create an announcement with defaults applied', async () => {
      const created = { id: 'a1', title: 'Movie night', message: 'Fun!' };
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(created);

      const result = await service.createAnnouncement('parent-1', {
        family_id: 'family-1',
        title: 'Movie night',
        message: 'Fun!',
      });

      expect(result).toEqual(created);
      const params = (connection.queryOne as jest.Mock).mock.calls[0][1];
      expect(params).toEqual([
        'parent-1',
        'Movie night',
        'Fun!',
        'family-1',
        'general',
        'normal',
        'all',
        [],
        false,
        null,
      ]);
    });

    it('should throw if insert returns nothing', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.createAnnouncement('parent-1', {
          family_id: 'family-1',
          title: 'x',
          message: 'y',
        })
      ).rejects.toThrow('Failed to create announcement');
    });
  });

  describe('markAsRead', () => {
    it('should insert a read record', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({});

      await service.markAsRead('a1', 'user-1');

      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), ['a1', 'user-1']);
    });

    it('should rethrow on failure', async () => {
      (connection.query as jest.Mock).mockRejectedValueOnce(new Error('constraint error'));

      await expect(service.markAsRead('a1', 'user-1')).rejects.toThrow('constraint error');
    });
  });

  describe('updateAnnouncement', () => {
    it('should only update whitelisted columns', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'a1', title: 'New title' });

      const result = await service.updateAnnouncement('a1', {
        title: 'New title',
        created_by_id: 'attacker-controlled', // not in the whitelist
      } as never);

      const [sql, params] = (connection.queryOne as jest.Mock).mock.calls[0];
      expect(sql).toContain('title = $2');
      expect(sql).not.toContain('created_by_id');
      expect(params).toEqual(['a1', 'New title']);
      expect(result).toEqual({ id: 'a1', title: 'New title' });
    });

    it('should just fetch the row when no updatable columns are given', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ id: 'a1' });

      await service.updateAnnouncement('a1', {} as never);

      expect(connection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM announcements'),
        ['a1']
      );
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete by id', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({});

      await service.deleteAnnouncement('a1');

      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM announcements'), ['a1']);
    });
  });

  describe('getReadCount', () => {
    it('should parse the count', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({ count: '7' });

      const result = await service.getReadCount('a1');

      expect(result).toBe(7);
    });

    it('should return 0 when there is no result', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getReadCount('a1');

      expect(result).toBe(0);
    });
  });
});
