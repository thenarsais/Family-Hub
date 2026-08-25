import request from 'supertest';
import express from 'express';

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

jest.mock('../../database/connection', () => ({ query: jest.fn() }));
import { query } from '../../database/connection';

import smartthingsRoutes from '../../routes/smartthings';

const app = express();
app.use(express.json());
app.use('/api/smartthings', smartthingsRoutes);

describe('SmartThings Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/smartthings/devices', () => {
    it('should list devices', async () => {
      mockSmartThingsService.listDevices.mockResolvedValueOnce([{ deviceId: 'd1' }]);

      const res = await request(app).get('/api/smartthings/devices').expect(200);

      expect(res.body.count).toBe(1);
    });

    it('should return 500 on service failure', async () => {
      mockSmartThingsService.listDevices.mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/smartthings/devices').expect(500);
      expect(res.body.message).toBe('Failed to list devices');
    });
  });

  describe('GET /api/smartthings/devices/:deviceId', () => {
    it('should return 404 when the device is not found', async () => {
      mockSmartThingsService.getDevice.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/smartthings/devices/d1').expect(404);
      expect(res.body.message).toBe('Device not found');
    });

    it('should return the device', async () => {
      mockSmartThingsService.getDevice.mockResolvedValueOnce({ deviceId: 'd1', name: 'Light' });

      const res = await request(app).get('/api/smartthings/devices/d1').expect(200);
      expect(res.body.device).toEqual({ deviceId: 'd1', name: 'Light' });
    });

    it('should return 500 on service failure', async () => {
      mockSmartThingsService.getDevice.mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/smartthings/devices/d1').expect(500);
      expect(res.body.message).toBe('Failed to get device');
    });
  });

  describe('PUT /api/smartthings/devices/:deviceId', () => {
    it('should require a command', async () => {
      const res = await request(app).put('/api/smartthings/devices/d1').send({}).expect(400);
      expect(res.body.message).toBe('Command is required');
    });

    it('should return 404 when the device does not exist', async () => {
      mockSmartThingsService.getDevice.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/smartthings/devices/d1')
        .send({ command: 'on' })
        .expect(404);
      expect(res.body.message).toBe('Device not found');
    });

    it('should turn a light on', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });
      mockSmartThingsService.setLight.mockResolvedValueOnce(true);

      const res = await request(app)
        .put('/api/smartthings/devices/d1')
        .send({ command: 'on' })
        .expect(200);

      expect(mockSmartThingsService.setLight).toHaveBeenCalledWith('d1', true);
      expect(res.body.status).toBe('success');
    });

    it('should turn a light off', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });
      mockSmartThingsService.setLight.mockResolvedValueOnce(true);

      await request(app).put('/api/smartthings/devices/d1').send({ command: 'turn-off' }).expect(200);

      expect(mockSmartThingsService.setLight).toHaveBeenCalledWith('d1', false);
    });

    it('should require a brightness argument', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });

      const res = await request(app)
        .put('/api/smartthings/devices/d1')
        .send({ command: 'brightness' })
        .expect(400);
      expect(res.body.message).toBe('Brightness level required');
    });

    it('should set brightness when an argument is given', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });
      mockSmartThingsService.setLightBrightness.mockResolvedValueOnce(true);

      await request(app)
        .put('/api/smartthings/devices/d1')
        .send({ command: 'setBrightness', arguments: [75] })
        .expect(200);

      expect(mockSmartThingsService.setLightBrightness).toHaveBeenCalledWith('d1', 75);
    });

    it('should require a temperature argument', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });

      const res = await request(app)
        .put('/api/smartthings/devices/d1')
        .send({ command: 'temperature' })
        .expect(400);
      expect(res.body.message).toBe('Temperature required');
    });

    it('should set temperature when an argument is given', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });
      mockSmartThingsService.setTemperature.mockResolvedValueOnce(true);

      await request(app)
        .put('/api/smartthings/devices/d1')
        .send({ command: 'setTemperature', arguments: [68] })
        .expect(200);

      expect(mockSmartThingsService.setTemperature).toHaveBeenCalledWith('d1', 68);
    });

    it('should lock a device', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });
      mockSmartThingsService.setLock.mockResolvedValueOnce(true);

      await request(app).put('/api/smartthings/devices/d1').send({ command: 'lock' }).expect(200);

      expect(mockSmartThingsService.setLock).toHaveBeenCalledWith('d1', true);
    });

    it('should unlock a device', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });
      mockSmartThingsService.setLock.mockResolvedValueOnce(true);

      await request(app).put('/api/smartthings/devices/d1').send({ command: 'unlock' }).expect(200);

      expect(mockSmartThingsService.setLock).toHaveBeenCalledWith('d1', false);
    });

    it('should reject an unknown command', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });

      const res = await request(app)
        .put('/api/smartthings/devices/d1')
        .send({ command: 'dance' })
        .expect(400);
      expect(res.body.message).toBe('Unknown command: dance');
    });

    it('should report failed status when the command execution fails', async () => {
      mockSmartThingsService.getDevice.mockResolvedValue({ deviceId: 'd1' });
      mockSmartThingsService.setLight.mockResolvedValueOnce(false);

      const res = await request(app)
        .put('/api/smartthings/devices/d1')
        .send({ command: 'on' })
        .expect(200);

      expect(res.body.status).toBe('failed');
      expect(res.body.message).toBe('Command failed');
    });

    it('should return 500 on service failure', async () => {
      mockSmartThingsService.getDevice.mockRejectedValueOnce(new Error('down'));

      const res = await request(app)
        .put('/api/smartthings/devices/d1')
        .send({ command: 'on' })
        .expect(500);
      expect(res.body.message).toBe('Failed to control device');
    });
  });

  describe('GET /api/smartthings/status', () => {
    it('should summarize devices by type and status', async () => {
      mockSmartThingsService.listDevices.mockResolvedValueOnce([
        { type: 'light', status: { online: true } },
        { type: 'lock', status: { online: false } },
        { type: 'climate', status: {} },
      ]);

      const res = await request(app).get('/api/smartthings/status').expect(200);

      expect(res.body.data.totalDevices).toBe(3);
      expect(res.body.data.devicesByType).toEqual({
        lights: 1,
        locks: 1,
        climate: 1,
        switches: 0,
        sensors: 0,
        other: 0,
      });
      expect(res.body.data.devicesByStatus).toEqual({ online: 2, offline: 1 });
    });

    it('should return 500 on service failure', async () => {
      mockSmartThingsService.listDevices.mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/smartthings/status').expect(500);
      expect(res.body.message).toBe('Failed to get system status');
    });
  });

  describe('POST /api/smartthings/discover', () => {
    it('should discover and return devices', async () => {
      mockSmartThingsService.discoverDevices.mockResolvedValueOnce([{ deviceId: 'd1' }]);

      const res = await request(app).post('/api/smartthings/discover').expect(200);

      expect(res.body.count).toBe(1);
      expect(res.body.message).toBe('Discovered 1 devices');
    });

    it('should return 500 on service failure', async () => {
      mockSmartThingsService.discoverDevices.mockRejectedValueOnce(new Error('down'));

      const res = await request(app).post('/api/smartthings/discover').expect(500);
      expect(res.body.message).toBe('Failed to discover devices');
    });
  });

  describe('GET /api/smartthings/devices/:deviceId/history', () => {
    it('should return device history capped at 100', async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 't1' }] });

      const res = await request(app)
        .get('/api/smartthings/devices/d1/history?limit=500')
        .expect(200);

      expect(query).toHaveBeenCalledWith(expect.any(String), ['%d1%', 100]);
      expect(res.body.count).toBe(1);
    });

    it('should default the limit to 50', async () => {
      (query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await request(app).get('/api/smartthings/devices/d1/history').expect(200);

      expect(query).toHaveBeenCalledWith(expect.any(String), ['%d1%', 50]);
    });

    it('should return 500 on query failure', async () => {
      (query as jest.Mock).mockRejectedValueOnce(new Error('down'));

      const res = await request(app).get('/api/smartthings/devices/d1/history').expect(500);
      expect(res.body.message).toBe('Failed to get device history');
    });
  });
});
