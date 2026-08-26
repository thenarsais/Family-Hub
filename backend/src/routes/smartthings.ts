import { Router, Request, Response } from 'express';
import { getSmartThingsService } from '../services/smartthings';
import { query } from '../database/connection';

import { getErrorMessage } from '../utils/errors';
import { normalizeBody } from '../middleware/normalize-body';

const router = Router();
router.use(normalizeBody); // req.body is {} even on a bodyless request
const smartthings = getSmartThingsService();

/**
 * GET /api/smartthings/devices
 * List all SmartThings devices
 */
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const devices = await smartthings.listDevices();

    res.json({
      status: 'success',
      devices,
      count: devices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to list devices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to list devices',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/smartthings/devices/:deviceId
 * Get single device details
 */
router.get('/devices/:deviceId', async (req: Request, res: Response) => {
  try {
    const deviceId = Array.isArray(req.params.deviceId) ? req.params.deviceId[0] : req.params.deviceId;
    const device = await smartthings.getDevice(deviceId);

    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found',
      });
    }

    res.json({
      status: 'success',
      device,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to get device:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get device',
      error: getErrorMessage(error),
    });
  }
});

/**
 * PUT /api/smartthings/devices/:deviceId
 * Control device (on/off, brightness, temperature, etc)
 */
router.put('/devices/:deviceId', async (req: Request, res: Response) => {
  try {
    const deviceId = Array.isArray(req.params.deviceId) ? req.params.deviceId[0] : req.params.deviceId;
    const { command, arguments: args } = req.body;

    if (!command) {
      return res.status(400).json({
        status: 'error',
        message: 'Command is required',
      });
    }

    // Get device to verify it exists
    const device = await smartthings.getDevice(deviceId);
    if (!device) {
      return res.status(404).json({
        status: 'error',
        message: 'Device not found',
      });
    }

    // Execute command based on type
    let success = false;
    const startTime = Date.now();

    switch (command.toLowerCase()) {
      case 'on':
      case 'turn-on':
        success = await smartthings.setLight(deviceId, true);
        break;

      case 'off':
      case 'turn-off':
        success = await smartthings.setLight(deviceId, false);
        break;

      case 'setbrightness':
      case 'brightness':
        if (!args || !args[0]) {
          return res.status(400).json({
            status: 'error',
            message: 'Brightness level required',
          });
        }
        success = await smartthings.setLightBrightness(deviceId, args[0]);
        break;

      case 'settemperature':
      case 'temperature':
        if (!args || !args[0]) {
          return res.status(400).json({
            status: 'error',
            message: 'Temperature required',
          });
        }
        success = await smartthings.setTemperature(deviceId, args[0]);
        break;

      case 'lock':
        success = await smartthings.setLock(deviceId, true);
        break;

      case 'unlock':
        success = await smartthings.setLock(deviceId, false);
        break;

      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown command: ${command}`,
        });
    }

    const duration = Date.now() - startTime;

    // Fetch updated device status
    const updatedDevice = await smartthings.getDevice(deviceId);

    res.json({
      status: success ? 'success' : 'failed',
      message: success ? `Command '${command}' executed successfully` : 'Command failed',
      device: updatedDevice,
      command,
      arguments: args,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to control device:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to control device',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/smartthings/status
 * Get SmartThings system status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const devices = await smartthings.listDevices();

    const status = {
      online: true,
      totalDevices: devices.length,
      devicesByType: {
        lights: devices.filter(d => d.type === 'light').length,
        locks: devices.filter(d => d.type === 'lock').length,
        climate: devices.filter(d => d.type === 'climate').length,
        switches: devices.filter(d => d.type === 'switch').length,
        sensors: devices.filter(d => d.type === 'sensor').length,
        other: devices.filter(d => d.type === 'other').length,
      },
      devicesByStatus: {
        online: devices.filter(d => d.status.online !== false).length,
        offline: devices.filter(d => d.status.online === false).length,
      },
      lastSync: new Date().toISOString(),
    };

    res.json({
      status: 'success',
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to get SmartThings status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system status',
      error: getErrorMessage(error),
    });
  }
});

/**
 * POST /api/smartthings/discover
 * Discover and sync all devices from SmartThings
 */
router.post('/discover', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const devices = await smartthings.discoverDevices();
    const duration = Date.now() - startTime;

    res.json({
      status: 'success',
      message: `Discovered ${devices.length} devices`,
      devices,
      count: devices.length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to discover devices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to discover devices',
      error: getErrorMessage(error),
    });
  }
});

/**
 * GET /api/smartthings/devices/:deviceId/history
 * Get device control history
 */
router.get('/devices/:deviceId/history', async (req: Request, res: Response) => {
  try {
    const deviceId = Array.isArray(req.params.deviceId) ? req.params.deviceId[0] : req.params.deviceId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await query(
      `SELECT * FROM point_transactions
       WHERE source = 'smartthings' AND description LIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [`%${deviceId}%`, limit]
    );

    res.json({
      status: 'success',
      deviceId,
      history: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Failed to get device history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get device history',
      error: getErrorMessage(error),
    });
  }
});

export default router;
