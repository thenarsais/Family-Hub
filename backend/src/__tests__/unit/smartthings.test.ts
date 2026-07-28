import request from 'supertest';
import express from 'express';
import smartthingsRoutes from '../../routes/smartthings';
import * as smartthingsService from '../../services/smartthings';

const app = express();
app.use(express.json());
app.use('/api/smartthings', smartthingsRoutes);

jest.mock('../../services/smartthings');
jest.mock('../../database/connection');

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
    jest.clearAllMocks();
  });

  describe('GET /api/smartthings/devices', () => {
    it('should list all devices successfully', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        listDevices: jest.fn().mockResolvedValue(mockDevices),
      });

      const res = await request(app)
        .get('/api/smartthings/devices')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(3);
      expect(res.body.devices).toHaveLength(3);
      expect(res.body.timestamp).toBeDefined();
    });

    it('should return empty array when no devices found', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        listDevices: jest.fn().mockResolvedValue([]),
      });

      const res = await request(app)
        .get('/api/smartthings/devices')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(0);
      expect(res.body.devices).toEqual([]);
    });

    it('should handle service errors', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        listDevices: jest.fn().mockRejectedValue(new Error('Service error')),
      });

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
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        getDevice: jest.fn().mockResolvedValue(mockDevices[0]),
      });

      const res = await request(app)
        .get('/api/smartthings/devices/light-1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.device).toEqual(mockDevices[0]);
      expect(res.body.timestamp).toBeDefined();
    });

    it('should return 404 when device not found', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        getDevice: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .get('/api/smartthings/devices/invalid-id')
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Device not found');
    });

    it('should handle service errors', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        getDevice: jest.fn().mockRejectedValue(new Error('Service error')),
      });

      const res = await request(app)
        .get('/api/smartthings/devices/light-1')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get device');
    });
  });

  describe('PUT /api/smartthings/devices/:deviceId', () => {
    it('should turn light on', async () => {
      const mockService = {
        getDevice: jest.fn()
          .mockResolvedValueOnce(mockDevices[0])
          .mockResolvedValueOnce({ ...mockDevices[0], status: { switch: 'on', level: 100 } }),
        setLight: jest.fn().mockResolvedValue(true),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'on' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.command).toBe('on');
      expect(res.body.device).toBeDefined();
      expect(mockService.setLight).toHaveBeenCalledWith('light-1', true);
    });

    it('should turn light off', async () => {
      const mockService = {
        getDevice: jest.fn()
          .mockResolvedValueOnce(mockDevices[0])
          .mockResolvedValueOnce({ ...mockDevices[0], status: { switch: 'off', level: 0 } }),
        setLight: jest.fn().mockResolvedValue(true),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'off' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.command).toBe('off');
      expect(mockService.setLight).toHaveBeenCalledWith('light-1', false);
    });

    it('should set brightness', async () => {
      const mockService = {
        getDevice: jest.fn()
          .mockResolvedValueOnce(mockDevices[0])
          .mockResolvedValueOnce({ ...mockDevices[0], status: { switch: 'on', level: 50 } }),
        setLightBrightness: jest.fn().mockResolvedValue(true),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'setbrightness', arguments: [50] })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockService.setLightBrightness).toHaveBeenCalledWith('light-1', 50);
    });

    it('should require brightness argument', async () => {
      const mockService = {
        getDevice: jest.fn().mockResolvedValue(mockDevices[0]),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'setbrightness' })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Brightness level required');
    });

    it('should set temperature', async () => {
      const mockService = {
        getDevice: jest.fn()
          .mockResolvedValueOnce(mockDevices[2])
          .mockResolvedValueOnce({ ...mockDevices[2], status: { temperature: 72 } }),
        setTemperature: jest.fn().mockResolvedValue(true),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/thermostat-1')
        .send({ command: 'settemperature', arguments: [72] })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockService.setTemperature).toHaveBeenCalledWith('thermostat-1', 72);
    });

    it('should require temperature argument', async () => {
      const mockService = {
        getDevice: jest.fn().mockResolvedValue(mockDevices[2]),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/thermostat-1')
        .send({ command: 'settemperature' })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Temperature required');
    });

    it('should lock device', async () => {
      const mockService = {
        getDevice: jest.fn()
          .mockResolvedValueOnce(mockDevices[1])
          .mockResolvedValueOnce({ ...mockDevices[1], status: { lock: 'locked' } }),
        setLock: jest.fn().mockResolvedValue(true),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/lock-1')
        .send({ command: 'lock' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockService.setLock).toHaveBeenCalledWith('lock-1', true);
    });

    it('should unlock device', async () => {
      const mockService = {
        getDevice: jest.fn()
          .mockResolvedValueOnce(mockDevices[1])
          .mockResolvedValueOnce({ ...mockDevices[1], status: { lock: 'unlocked' } }),
        setLock: jest.fn().mockResolvedValue(true),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/lock-1')
        .send({ command: 'unlock' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockService.setLock).toHaveBeenCalledWith('lock-1', false);
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
      const mockService = {
        getDevice: jest.fn().mockResolvedValue(null),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/invalid-id')
        .send({ command: 'on' })
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Device not found');
    });

    it('should reject unknown command', async () => {
      const mockService = {
        getDevice: jest.fn().mockResolvedValue(mockDevices[0]),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'invalid-command' })
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Unknown command');
    });

    it('should handle case-insensitive commands', async () => {
      const mockService = {
        getDevice: jest.fn()
          .mockResolvedValueOnce(mockDevices[0])
          .mockResolvedValueOnce({ ...mockDevices[0], status: { switch: 'on', level: 100 } }),
        setLight: jest.fn().mockResolvedValue(true),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

      const res = await request(app)
        .put('/api/smartthings/devices/light-1')
        .send({ command: 'ON' })
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(mockService.setLight).toHaveBeenCalledWith('light-1', true);
    });

    it('should handle service errors', async () => {
      const mockService = {
        getDevice: jest.fn().mockRejectedValue(new Error('Service error')),
      };
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue(mockService);

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
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        listDevices: jest.fn().mockResolvedValue(mockDevices),
      });

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
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        listDevices: jest.fn().mockResolvedValue(devices),
      });

      const res = await request(app)
        .get('/api/smartthings/status')
        .expect(200);

      expect(res.body.data.devicesByType.lights).toBe(2);
      expect(res.body.data.devicesByType.locks).toBe(1);
    });

    it('should handle service errors', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        listDevices: jest.fn().mockRejectedValue(new Error('Service error')),
      });

      const res = await request(app)
        .get('/api/smartthings/status')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to get system status');
    });
  });

  describe('POST /api/smartthings/discover', () => {
    it('should discover devices', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        discoverDevices: jest.fn().mockResolvedValue(mockDevices),
      });

      const res = await request(app)
        .post('/api/smartthings/discover')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(3);
      expect(res.body.devices).toHaveLength(3);
      expect(res.body.duration).toBeDefined();
    });

    it('should return zero devices when none found', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        discoverDevices: jest.fn().mockResolvedValue([]),
      });

      const res = await request(app)
        .post('/api/smartthings/discover')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(0);
      expect(res.body.devices).toEqual([]);
    });

    it('should handle service errors', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        discoverDevices: jest.fn().mockRejectedValue(new Error('Service error')),
      });

      const res = await request(app)
        .post('/api/smartthings/discover')
        .expect(500);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Failed to discover devices');
    });

    it('should include duration metric', async () => {
      (smartthingsService.getSmartThingsService as jest.Mock).mockReturnValue({
        discoverDevices: jest.fn().mockResolvedValue(mockDevices),
      });

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

      jest.mock('../../database/connection', () => ({
        query: jest.fn().mockResolvedValue({ rows: mockHistory }),
      }));

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

      jest.mock('../../database/connection', () => ({
        query: jest.fn().mockResolvedValue({ rows: mockHistory }),
      }));

      const { query } = require('../../database/connection');
      query.mockResolvedValue({ rows: mockHistory });

      const res = await request(app)
        .get('/api/smartthings/devices/light-1/history?limit=50')
        .expect(200);

      expect(res.body.count).toBe(50);
    });

    it('should return empty history when no records', async () => {
      jest.mock('../../database/connection', () => ({
        query: jest.fn().mockResolvedValue({ rows: [] }),
      }));

      const { query } = require('../../database/connection');
      query.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .get('/api/smartthings/devices/light-1/history')
        .expect(200);

      expect(res.body.count).toBe(0);
      expect(res.body.history).toEqual([]);
    });

    it('should handle database errors', async () => {
      jest.mock('../../database/connection', () => ({
        query: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

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
