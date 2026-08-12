import { Router, Request, Response } from 'express';
import { getFamilyService } from '../services/family';

const router = Router();
const family = getFamilyService();

/**
 * GET /api/family
 * Get user's family details
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found for user',
      });
    }

    res.json({
      status: 'success',
      data: userFamily,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch family:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch family',
      error: error.message,
    });
  }
});

/**
 * POST /api/family
 * Create a new family
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, description, max_children, max_parents } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required field: name',
      });
    }

    const newFamily = await family.createFamily(userId, {
      name,
      description,
      max_children,
      max_parents,
    });

    res.status(201).json({
      status: 'success',
      data: newFamily,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to create family:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create family',
      error: error.message,
    });
  }
});

/**
 * GET /api/family/members
 * Get all family members
 */
router.get('/members', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found',
      });
    }

    const members = await family.getFamilyMembers(userFamily.id);

    res.json({
      status: 'success',
      data: members,
      count: members.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch members:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch members',
      error: error.message,
    });
  }
});

/**
 * POST /api/family/members/invite
 * Invite a member to family
 */
router.post('/members/invite', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { email, role } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!email || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: email, role',
      });
    }

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found',
      });
    }

    const inviteToken = await family.inviteFamilyMember(userFamily.id, userId, email, role);

    res.status(201).json({
      status: 'success',
      data: {
        invite_token: inviteToken,
        email,
        role,
        expires_in: '7 days',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to invite member:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to invite member',
      error: error.message,
    });
  }
});

/**
 * POST /api/family/members/accept-invitation
 * Accept a family invitation
 */
router.post('/members/accept-invitation', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { invite_token } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!invite_token) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required field: invite_token',
      });
    }

    const member = await family.acceptInvitation(invite_token, userId);

    res.json({
      status: 'success',
      data: member,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to accept invitation:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to accept invitation',
    });
  }
});

/**
 * PATCH /api/family/members/:memberId/role
 * Update member role
 */
router.patch('/members/:memberId/role', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { memberId } = req.params;
    const { role } = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    if (!role) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required field: role',
      });
    }

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found',
      });
    }

    const updated = await family.updateMemberRole(userFamily.id, memberId as string, role);

    res.json({
      status: 'success',
      data: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to update member role:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update member role',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/family/members/:memberId
 * Remove member from family
 */
router.delete('/members/:memberId', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { memberId } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found',
      });
    }

    await family.removeMember(userFamily.id, memberId as string);

    res.json({
      status: 'success',
      message: 'Member removed from family',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to remove member:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove member',
      error: error.message,
    });
  }
});

/**
 * GET /api/family/settings
 * Get family settings
 */
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found',
      });
    }

    const settings = await family.getFamilySettings(userFamily.id);

    res.json({
      status: 'success',
      data: settings,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch settings',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/family/settings
 * Update family settings
 */
router.patch('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'User ID required',
      });
    }

    const userFamily = await family.getUserFamily(userId);

    if (!userFamily) {
      return res.status(404).json({
        status: 'error',
        message: 'No family found',
      });
    }

    const settings = await family.updateFamilySettings(userFamily.id, updates);

    res.json({
      status: 'success',
      data: settings,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update settings',
      error: error.message,
    });
  }
});

export default router;
