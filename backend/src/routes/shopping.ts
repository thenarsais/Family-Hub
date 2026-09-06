import { Router, Request, Response } from 'express';
import { getShoppingService } from '../services/shopping';
import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const shopping = getShoppingService();

function requireUser(req: Request, res: Response): string | null {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'User ID required' });
    return null;
  }
  return userId;
}

/**
 * GET /api/shopping
 * The caller's family shopping list (pending first, checked at the bottom).
 */
router.get('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const items = await shopping.getItemsForUser(userId);
    res.json({
      status: 'success',
      data: items,
      count: items.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to fetch shopping list:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch shopping list',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/shopping
 * Add a line item. Body: { name }.
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    return res.status(400).json({ status: 'error', message: 'Item name required' });
  }

  try {
    const item = await shopping.addItem(userId, name);
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'No family for this user' });
    }
    res.status(201).json({
      status: 'success',
      data: item,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to add shopping item:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add shopping item',
      error: getErrorMessage(error),
    });
  }
});

/**
 * PATCH /api/shopping/:id
 * Set the checked flag. Body: { checked: boolean }.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { id } = req.params;
  if (typeof req.body.checked !== 'boolean') {
    return res.status(400).json({ status: 'error', message: 'checked (boolean) required' });
  }

  try {
    const item = await shopping.setChecked(userId, id as string, req.body.checked);
    if (!item) {
      return res.status(404).json({ status: 'error', message: 'Item not found' });
    }
    res.json({
      status: 'success',
      data: item,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to update shopping item:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update shopping item',
      error: getErrorMessage(error),
    });
  }
});

/**
 * DELETE /api/shopping/checked
 * Clear every checked item for the family.
 */
router.delete('/checked', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const removed = await shopping.clearChecked(userId);
    res.json({
      status: 'success',
      data: { removed },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to clear checked items:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear checked items',
      error: getErrorMessage(error),
    });
  }
});

/**
 * DELETE /api/shopping/:id
 * Remove one item.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const { id } = req.params;
  try {
    const ok = await shopping.removeItem(userId, id as string);
    if (!ok) {
      return res.status(404).json({ status: 'error', message: 'Item not found' });
    }
    res.json({
      status: 'success',
      message: 'Item removed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to remove shopping item:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove shopping item',
      error: getErrorMessage(error),
    });
  }
});

export default router;
