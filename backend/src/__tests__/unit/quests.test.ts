import { QuestService } from '../../services/quests';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;
const mockAddPoints = PointsRepository.addPoints as jest.Mock;

describe('QuestService', () => {
  let service: QuestService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuestService();
  });

  describe('getToday', () => {
    it('assigns 3 templates on first call and checks each against its own table', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' }) // familyTz
        .mockResolvedValueOnce(null) // no existing assignment
        .mockResolvedValueOnce({
          id: 'assign-1',
          template_keys: ['chore', 'reading', 'mood'],
          bonus_awarded: false,
        }) // INSERT ... RETURNING
        .mockResolvedValueOnce({ ok: true }) // chore done check
        .mockResolvedValueOnce({ ok: false }) // reading done check
        .mockResolvedValueOnce({ ok: false }); // mood done check

      const result = await service.getToday('kid-1');
      expect(result.quests).toHaveLength(3);
      expect(result.quests.map((q) => q.key)).toEqual(['chore', 'reading', 'mood']);
      expect(result.quests[0]).toEqual({ key: 'chore', label: 'Complete a chore', done: true });
      expect(result.allDone).toBe(false);
      expect(result.bonusAwarded).toBe(false);
      expect(mockAddPoints).not.toHaveBeenCalled();
    });

    it('reuses an existing assignment without re-rolling', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({
          id: 'assign-1',
          template_keys: ['trivia', 'habit', 'kungfu'],
          bonus_awarded: false,
        })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false });

      const result = await service.getToday('kid-1');
      expect(result.quests.map((q) => q.key)).toEqual(['trivia', 'habit', 'kungfu']);
      // No INSERT call beyond the two queryOne calls already consumed (familyTz + SELECT).
    });

    it('awards the +50 bonus exactly once when all 3 flip done', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({
          id: 'assign-1',
          template_keys: ['chore', 'habit', 'homework'],
          bonus_awarded: false,
        })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE bonus_awarded

      const result = await service.getToday('kid-1');
      expect(result.allDone).toBe(true);
      expect(result.bonusAwarded).toBe(true);
      expect(mockAddPoints).toHaveBeenCalledWith(
        'kid-1',
        50,
        'quests',
        'Daily quest bonus: assign-1',
      );
    });

    it('does not re-award the bonus once already paid', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ timezone: 'America/Denver' })
        .mockResolvedValueOnce({
          id: 'assign-1',
          template_keys: ['chore', 'habit', 'homework'],
          bonus_awarded: true,
        })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: true });

      const result = await service.getToday('kid-1');
      expect(result.allDone).toBe(true);
      expect(result.bonusAwarded).toBe(true);
      expect(mockAddPoints).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
