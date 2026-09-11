import { RewardService } from '../../services/rewards';
import * as connection from '../../database/connection';
import * as PointsRepository from '../../database/repositories/PointsRepository';

jest.mock('../../database/connection');
jest.mock('../../database/repositories/PointsRepository');

const mockQuery = connection.query as jest.Mock;
const mockQueryOne = connection.queryOne as jest.Mock;
const mockGetPointsThisMonth = PointsRepository.getPointsThisMonth as jest.Mock;

describe('RewardService', () => {
  let service: RewardService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RewardService();
  });

  describe('getSettings', () => {
    it('falls back to the default weekly goal when no row exists', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      const settings = await service.getSettings('kid-1');
      expect(settings).toEqual({ weeklyGoal: 50 });
    });

    it('returns the stored goal', async () => {
      mockQueryOne.mockResolvedValueOnce({ user_id: 'kid-1', weekly_goal: 75 });
      const settings = await service.getSettings('kid-1');
      expect(settings).toEqual({ weeklyGoal: 75 });
    });
  });

  describe('addLibraryItem / updateLibraryItem', () => {
    it('adds an item under the caller\'s family', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId
        .mockResolvedValueOnce({
          id: 'r1', title: '$5 allowance', description: null, cash_amount: '5.00',
          active: true, family_id: 'fam-1',
        }); // INSERT RETURNING
      const item = await service.addLibraryItem('parent-1', { title: '$5 allowance', cashAmount: 5 });
      expect(item).toEqual({ id: 'r1', title: '$5 allowance', description: null, cashAmount: 5, active: true });
    });

    it('throws no-family when the caller has none', async () => {
      mockQueryOne.mockResolvedValueOnce(null); // familyId
      await expect(service.addLibraryItem('nobody', { title: 'x' })).rejects.toThrow('no-family');
    });

    it('retires an item via active:false rather than deleting', async () => {
      mockQueryOne
        .mockResolvedValueOnce({
          id: 'r1', title: 'Old reward', description: null, cash_amount: null,
          active: true, family_id: 'fam-1',
        }) // SELECT current
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(caller)
        .mockResolvedValueOnce({
          id: 'r1', title: 'Old reward', description: null, cash_amount: null,
          active: false, family_id: 'fam-1',
        }); // UPDATE RETURNING
      const item = await service.updateLibraryItem('parent-1', 'r1', { active: false });
      expect(item?.active).toBe(false);
      expect(mockQuery).not.toHaveBeenCalledWith(expect.stringContaining('DELETE'), expect.anything());
    });

    it('returns null when the caller is outside the item\'s family', async () => {
      mockQueryOne
        .mockResolvedValueOnce({
          id: 'r1', title: 'x', description: null, cash_amount: null, active: true, family_id: 'fam-1',
        })
        .mockResolvedValueOnce({ family_id: 'fam-2' }); // a different family
      const item = await service.updateLibraryItem('stranger', 'r1', { active: false });
      expect(item).toBeNull();
    });
  });

  describe('checkAndRecord', () => {
    function primeKeysAndSettings(weeklyGoal = 50) {
      mockQueryOne
        .mockResolvedValueOnce({ week_key: '2026-09-07', month_key: '2026-09' }) // keys
        .mockResolvedValueOnce(weeklyGoal === 50 ? null : { user_id: 'kid-1', weekly_goal: weeklyGoal }); // getSettings
    }

    it('records the weekly milestone once when the goal is met', async () => {
      primeKeysAndSettings();
      mockQueryOne.mockResolvedValueOnce({ total: '60' }); // week sum
      mockGetPointsThisMonth.mockResolvedValueOnce(50); // below all tiers
      mockQueryOne.mockResolvedValueOnce({ id: 'earn-1' }); // weekly INSERT ... RETURNING id

      const result = await service.checkAndRecord('kid-1');
      expect(result.weekPoints).toBe(60);
      expect(result.justEarned).toEqual(['weekly']);
      expect(result.tiers.every((t) => !t.reached)).toBe(true);
    });

    it('does not re-record the weekly milestone once already earned this week', async () => {
      primeKeysAndSettings();
      mockQueryOne.mockResolvedValueOnce({ total: '60' });
      mockGetPointsThisMonth.mockResolvedValueOnce(50);
      mockQueryOne.mockResolvedValueOnce(null); // ON CONFLICT DO NOTHING -> no row returned

      const result = await service.checkAndRecord('kid-1');
      expect(result.justEarned).toEqual([]);
    });

    it('can earn bronze, silver and gold together in one strong month', async () => {
      primeKeysAndSettings();
      mockQueryOne.mockResolvedValueOnce({ total: '10' }); // week sum, below goal
      mockGetPointsThisMonth.mockResolvedValueOnce(450); // clears all 3 tiers
      mockQueryOne
        .mockResolvedValueOnce({ id: 'e-bronze' })
        .mockResolvedValueOnce({ id: 'e-silver' })
        .mockResolvedValueOnce({ id: 'e-gold' });

      const result = await service.checkAndRecord('kid-1');
      expect(result.justEarned).toEqual(['bronze', 'silver', 'gold']);
      expect(result.tiers.every((t) => t.reached)).toBe(true);
    });
  });

  describe('fulfillReward', () => {
    it('fulfills a pending reward with a library item from the same family (self)', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ user_id: 'kid-1', fulfilled_at: null }) // reward
        // sharesFamily short-circuits: caller === reward.user_id, no extra queries
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // item
        .mockResolvedValueOnce({ family_id: 'fam-1' }); // familyId(caller)
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'reward-1', user_id: 'kid-1', assignee_name: 'Krish', milestone_type: 'weekly',
          period_key: '2026-09-07', earned_at: 'x', fulfilled_at: 'y', fulfillment_note: null,
          lib_id: 'r1', lib_title: '$5 allowance', lib_description: null, lib_cash_amount: '5.00', lib_active: true,
        }],
      }); // getEarned re-fetch

      const reward = await service.fulfillReward('kid-1', 'reward-1', 'r1');
      expect(reward.fulfilledAt).toBe('y');
      expect(reward.libraryItem?.title).toBe('$5 allowance');
    });

    it('lets a parent in the same family fulfill a kid\'s reward', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ user_id: 'kid-1', fulfilled_at: null }) // reward
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // sharesFamily: familyId(caller)
        .mockResolvedValueOnce({ ok: 1 }) // sharesFamily: membership check
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // item
        .mockResolvedValueOnce({ family_id: 'fam-1' }); // familyId(caller) again
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'reward-1', user_id: 'kid-1', assignee_name: 'Krish', milestone_type: 'gold',
          period_key: '2026-09', earned_at: 'x', fulfilled_at: 'y', fulfillment_note: 'note',
          lib_id: 'r1', lib_title: 'Ice cream', lib_description: null, lib_cash_amount: null, lib_active: true,
        }],
      });

      const reward = await service.fulfillReward('parent-1', 'reward-1', 'r1', 'note');
      expect(reward.fulfillmentNote).toBe('note');
    });

    it('throws already-fulfilled', async () => {
      mockQueryOne.mockResolvedValueOnce({ user_id: 'kid-1', fulfilled_at: 'already' });
      await expect(service.fulfillReward('kid-1', 'reward-1', 'r1')).rejects.toThrow(
        'already-fulfilled',
      );
    });

    it('throws not-found for a missing reward', async () => {
      mockQueryOne.mockResolvedValueOnce(null);
      await expect(service.fulfillReward('parent-1', 'nope', 'r1')).rejects.toThrow('not-found');
    });

    it('throws bad-assignee when the caller is outside the family', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ user_id: 'kid-1', fulfilled_at: null }) // reward
        .mockResolvedValueOnce({ family_id: 'fam-1' }) // familyId(caller)
        .mockResolvedValueOnce(null); // membership check fails
      await expect(service.fulfillReward('stranger', 'reward-1', 'r1')).rejects.toThrow(
        'bad-assignee',
      );
    });

    it('throws bad-library-item for an item from a different family', async () => {
      mockQueryOne
        .mockResolvedValueOnce({ user_id: 'kid-1', fulfilled_at: null }) // reward
        .mockResolvedValueOnce({ family_id: 'fam-2' }) // item (different family)
        .mockResolvedValueOnce({ family_id: 'fam-1' }); // familyId(caller)
      await expect(service.fulfillReward('kid-1', 'reward-1', 'r1')).rejects.toThrow(
        'bad-library-item',
      );
    });
  });
});
