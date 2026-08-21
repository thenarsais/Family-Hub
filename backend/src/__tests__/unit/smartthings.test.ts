import request from 'supertest';
import express from 'express';

// routes/smartthings.ts calls getSmartThingsService() once at module load time
// and holds the result in a module-scoped constant. Reassigning
// getSmartThingsService per-test (as this file used to do via
// `(smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(...)`)
// has no effect on that already-captured value. Instead, mock the module to
// always return the same shared object, and configure its methods per test.
const mockSmartThingsService = {
  listDevices: jest.fn(),
  getDevice: jest.fn(),
  setLight: jest.fn(),
  setLightBrightness: jest.fn(),
  setTemperature: jest.fn(),
  setLock: jest.fn(),
  discoverDevices: jest.fn(),
};

jest.mock('../../services/smartthings', () => ({ getSmartThingsService: () => mockSmartThingsService }));
jest.mock('../../database/connection');

import smartthingsRoutes from '../../routes/smartthings';

const app = express();
app.use(express.json());
app.use('/api/smartthings', smartthingsRoutes);

describe('SmartThings Routes', () => {
  const mockDevices = [
    {
      deviceId: 'light-1',
      name: 'Living Room Light',
      type: 'light',
      room: 'Living Room',
      status: { switch: 'on', level: 100 },
    },
    {
      deviceId: 'lock-1',
      name: 'Front Door',
      type: 'lock',
      room: 'Entry',
      status: { lock: 'locked' },
    },
    {
      deviceId: 'thermostat-1',
      name: 'Main Thermostat',
      type: 'climate',
      room: 'Hallway',
      status: { temperature: 72 },
    },
  ];

  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) so queued mockResolvedValueOnce/etc.
    // from a previous test can't leak into the next one.
    jest.resetAllMocks();
  });

  describe('GET /api/smartthings/devices', () => {
    it('should list all devices successfully', async () => {
      mockSmartThingsService.listDevices.mockResolvedValueOnce(mockDevices);

      const res = await request(app)
        .get('/api/smartthings/devices')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(3);
      expect(res.body.devices).toHaveLength(3);
      expect(res.body.timestamp).toBeDefined();
    });

    it('should return empty array when no devices found', async () => {
      mockSmartThingsService.listDevices.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/smartthings/devices')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(0);
      expect(res.body.devices).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockSmartThingsService.listDevices.mockRejectedValueOnce(new Error('Service error'));

      const res = await request(app)
        .get('/api/smartthings/devices')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to list devices');
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/smartthings/devices/:deviceId', () => {
    it('should get single device details', async () => {
      mockSmartThingsService.getDevice.mockResolvedValueOnce(mockDevices[0]);

      const res = await request(app)
        .get('/api/smartthings/devices/light-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.device).toEqual(mockDevices[0]);
      expect(res.body.timestamp).toBeDefined();
    });

    it('should return 404 when device not found', async () => {
      mockSmartThingsService.getDevice.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/smartthings/devices/invalid-id')
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Device not found');
    });

    it('should handle service errors', async () => {
      mockSmartThingsService.getDevice.mockRejectedValueOnce(new Error('Service error'));

      const res = await request(app)
        .get('/api/smartthings/devices/light-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get device');
    });
  });

  describe('PUT /api/smartthings/devices/:deviceId', () => {
    it('should turn light on', async () => {
      mockSmartThingsService.getDevice
        .mockResolvedValueOnce(mockDevices[0])
        .mockResolvedValueOnce({ ...mockDevices[0], status: { switch: 'on', level: 100 } });
      mockSmartThingsService.setLight.mockResolvedValueOnce(true);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'on' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.command).toBe('on');
      expect(res.body.device).toBeDefined();
      expect(mockSmartThingsService.setLight).toHaveBeenCalledWith('light-1', true);
    });

    it('should turn light off', async () => {
      mockSmartThingsService.getDevice
        .mockResolvedValueOnce(mockDevices[0])
        .mockResolvedValueOnce({ ...mockDevices[0], status: { switch: 'off', level: 0 } });
      mockSmartThingsService.setLight.mockResolvedValueOnce(true);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'off' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.command).toBe('off');
      expect(mockSmartThingsService.setLight).toHaveBeenCalledWith('light-1', false);
    });

    it('should set brightness', async () => {
      mockSmartThingsService.getDevice
        .mockResolvedValueOnce(mockDevices[0])
        .mockResolvedValueOnce({ ...mockDevices[0], status: { switch: 'on', level: 50 } });
      mockSmartThingsService.setLightBrightness.mockResolvedValueOnce(true);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'setbrightness', arguments: [50] })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockSmartThingsService.setLightBrightness).toHaveBeenCalledWith('light-1', 50);
    });

    it('should require brightness argument', async () => {
      mockSmartThingsService.getDevice.mockResolvedValueOnce(mockDevices[0]);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'setbrightness' })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Brightness level required');
    });

    it('should set temperature', async () => {
      mockSmartThingsService.getDevice
        .mockResolvedValueOnce(mockDevices[2])
        .mockResolvedValueOnce({ ...mockDevices[2], status: { temperature: 72 } });
      mockSmartThingsService.setTemperature.mockResolvedValueOnce(true);

      const res = await request(app)
        .put('/api/smartthings/devices/thermostat-1')
        .send({ command: 'settemperature', arguments: [72] })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockSmartThingsService.setTemperature).toHaveBeenCalledWith('thermostat-1', 72);
    });

    it('should require temperature argument', async () => {
      mockSmartThingsService.getDevice.mockResolvedValueOnce(mockDevices[2]);

      const res = await request(app)
        .put('/api/smartthings/devices/thermostat-1')
        .send({ command: 'settemperature' })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Temperature required');
    });

    it('should lock device', async () => {
      mockSmartThingsService.getDevice
        .mockResolvedValueOnce(mockDevices[1])
        .mockResolvedValueOnce({ ...mockDevices[1], status: { lock: 'locked' } });
      mockSmartThingsService.setLock.mockResolvedValueOnce(true);

      const res = await request(app)
        .put('/api/smartthings/devices/lock-1')
        .send({ command: 'lock' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockSmartThingsService.setLock).toHaveBeenCalledWith('lock-1', true);
    });

    it('should unlock device', async () => {
      mockSmartThingsService.getDevice
        .mockResolvedValueOnce(mockDevices[1])
        .mockResolvedValueOnce({ ...mockDevices[1], status: { lock: 'unlocked' } });
      mockSmartThingsService.setLock.mockResolvedValueOnce(true);

      const res = await request(app)
        .put('/api/smartthings/devices/lock-1')
        .send({ command: 'unlock' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockSmartThingsService.setLock).toHaveBeenCalledWith('lock-1', false);
    });

    it('should require command field', async () => {
      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({})
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Command is required');
    });

    it('should return 404 for non-existent device', async () => {
      mockSmartThingsService.getDevice.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/smartthings/devices/invalid-id')
        .send({ command: 'on' })
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Device not found');
    });

    it('should reject unknown command', async () => {
      mockSmartThingsService.getDevice.mockResolvedValueOnce(mockDevices[0]);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'invalid-command' })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Unknown command');
    });

    it('should handle case-insensitive commands', async () => {
      mockSmartThingsService.getDevice
        .mockResolvedValueOnce(mockDevices[0])
        .mockResolvedValueOnce({ ...mockDevices[0], status: { switch: 'on', level: 100 } });
      mockSmartThingsService.setLight.mockResolvedValueOnce(true);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'ON' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockSmartThingsService.setLight).toHaveBeenCalledWith('light-1', true);
    });

    it('should handle service errors', async () => {
      mockSmartThingsService.getDevice.mockRejectedValueOnce(new Error('Service error'));

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'on' })
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to control device');
    });
  });

  describe('GET /api/smartthings/status', () => {
    it('should return system status', async () => {
      mockSmartThingsService.listDevices.mockResolvedValueOnce(mockDevices);

      const res = await request(app)
        .get('/api/smartthings/status')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.online).toBe(true);
      expect(res.body.data.totalDevices).toBe(3);
      expect(res.body.data.devicesByType.lights).toBe(1);
      expect(res.body.data.devicesByType.locks).toBe(1);
      expect(res.body.data.devicesByType.climate).toBe(1);
      expect(res.body.data.devicesByStatus.online).toBe(3);
      expect(res.body.data.lastSync).toBeDefined();
    });

    it('should count device types correctly', async () => {
      const devices = [
        { ...mockDevices[0], type: 'light' },
        { ...mockDevices[0], type: 'light' },
        { ...mockDevices[1], type: 'lock' },
      ];
      mockSmartThingsService.listDevices.mockResolvedValueOnce(devices);

      const res = await request(app)
        .get('/api/smartthings/status')
        .expect(200);

      expect(res.body.data.devicesByType.lights).toBe(2);
      expect(res.body.data.devicesByType.locks).toBe(1);
    });

    it('should handle service errors', async () => {
      mockSmartThingsService.listDevices.mockRejectedValueOnce(new Error('Service error'));

      const res = await request(app)
        .get('/api/smartthings/status')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get system status');
    });
  });

  describe('POST /api/smartthings/discover', () => {
    it('should discover devices', async () => {
      mockSmartThingsService.discoverDevices.mockResolvedValueOnce(mockDevices);

      const res = await request(app)
        .post('/api/smartthings/discover')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(3);
      expect(res.body.devices).toHaveLength(3);
      expect(res.body.duration).toBeDefined();
    });

    it('should return zero devices when none found', async () => {
      mockSmartThingsService.discoverDevices.mockResolvedValueOnce([]);

      const res = await request(app)
        .post('/api/smartthings/discover')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(0);
      expect(res.body.devices).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockSmartThingsService.discoverDevices.mockRejectedValueOnce(new Error('Service error'));

      const res = await request(app)
        .post('/api/smartthings/discover')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to discover devices');
    });

    it('should include duration metric', async () => {
      mockSmartThingsService.discoverDevices.mockResolvedValueOnce(mockDevices);

      const res = await request(app)
        .post('/api/smartthings/discover')
        .expect(200);

      expect(res.body.duration).toMatch(/\d+ms/);
    });
  });

  describe('GET /api/smartthings/devices/:deviceId/history', () => {
    it('should get device history', async () => {
      const mockHistory = [
        { id: 1, source: 'smartthings', description: 'light-1 turned on', created_at: new Date() },
        { id: 2, source: 'smartthings', description: 'light-1 turned off', created_at: new Date() },
      ];

      const { query } = require('../../database/connection');
      query.mockResolvedValue({ rows: mockHistory });

      const res = await request(app)
        .get('/api/smartthings/devices/light-1/history')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.deviceId).toBe('light-1');
      expect(res.body.count).toBe(2);
    });

    it('should limit history results', async () => {
      const mockHistory = Array(50).fill({
        id: 1,
        source: 'smartthings',
        description: 'light-1 turned on',
        created_at: new Date(),
      });

      const { query } = require('../../database/connection');
      query.mockResolvedValue({ rows: mockHistory });

      const res = await request(app)
        .get('/api/smartthings/devices/light-1/history?limit=50')
        .expect(200);

      expect(res.body.count).toBe(50);
    });

    it('should return empty history when no records', async () => {
      const { query } = require('../../database/connection');
      query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .get('/api/smartthings/devices/light-1/history')
        .expect(200);

      expect(res.body.count).toBe(0);
      expect(res.body.history).toEqual([]);
    });

    it('should handle database errors', async () => {
      const { query } = require('../../database/connection');
      query.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .get('/api/smartthings/devices/light-1/history')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get device history');
    });
  });
});
