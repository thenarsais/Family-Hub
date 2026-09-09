import request from 'supertest';
import express from 'express';

const mockKioskService = {
  enrollDevice: jest.fn(),
  listDevices: jest.fn(),
  revokeDevice: jest.fn(),
  resolveDevice: jest.fn(),
  getBootstrap: jest.fn(),
  setPin: jest.fn(),
  clearPin: jest.fn(),
  verifyPin: jest.fn(),
};

jest.mock('../../services/kiosk', () => ({
  ...jest.requireActual('../../services/kiosk'),
  getKioskService: () => mockKioskService,
}));

import kioskRoutes from '../../routes/kiosk';

const app = express();
app.use(express.json());
app.use('/api/kiosk', kioskRoutes);

const P = (r: request.Test) => r.set('x-user-id', 'parent-1');

describe('Kiosk routes', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('POST /api/kiosk/enroll', () => {
    it('401s without x-user-id', async () => {
      await request(app).post('/api/kiosk/enroll').send({ label: 'Kitchen' }).expect(401);
    });

    it('enrols and returns the token once', async () => {
      mockKioskService.enrollDevice.mockResolvedValueOnce({
        token: 'raw-tok',
        deviceId: 'd1',
        familyId: 'f1',
      });
      const res = await P(request(app).post('/api/kiosk/enroll')).send({ label: 'Kitchen' }).expect(201);
      expect(res.body).toMatchObject({ token: 'raw-tok', deviceId: 'd1', familyId: 'f1' });
      expect(mockKioskService.enrollDevice).toHaveBeenCalledWith('parent-1', 'Kitchen');
    });

    it('403s for a non-parent', async () => {
      mockKioskService.enrollDevice.mockRejectedValueOnce(new Error('not-allowed'));
      await P(request(app).post('/api/kiosk/enroll')).send({}).expect(403);
    });

    it('500s on an unexpected failure', async () => {
      mockKioskService.enrollDevice.mockRejectedValueOnce(new Error('boom'));
      await P(request(app).post('/api/kiosk/enroll')).send({}).expect(500);
    });
  });

  describe('GET /api/kiosk/devices', () => {
    it('401s without a user', async () => {
      await request(app).get('/api/kiosk/devices').expect(401);
    });
    it('lists devices', async () => {
      mockKioskService.listDevices.mockResolvedValueOnce([{ id: 'd1', label: 'Kitchen' }]);
      const res = await P(request(app).get('/api/kiosk/devices')).expect(200);
      expect(res.body.devices).toHaveLength(1);
      expect(res.body.count).toBe(1);
    });
    it('403s for a non-parent', async () => {
      mockKioskService.listDevices.mockRejectedValueOnce(new Error('not-allowed'));
      await P(request(app).get('/api/kiosk/devices')).expect(403);
    });
  });

  describe('DELETE /api/kiosk/devices/:id', () => {
    it('204-style 200 on success', async () => {
      mockKioskService.revokeDevice.mockResolvedValueOnce(true);
      await P(request(app).delete('/api/kiosk/devices/d1')).expect(200);
      expect(mockKioskService.revokeDevice).toHaveBeenCalledWith('parent-1', 'd1');
    });
    it('404s when nothing was removed', async () => {
      mockKioskService.revokeDevice.mockResolvedValueOnce(false);
      await P(request(app).delete('/api/kiosk/devices/d1')).expect(404);
    });
    it('403s for a non-parent', async () => {
      mockKioskService.revokeDevice.mockRejectedValueOnce(new Error('not-allowed'));
      await P(request(app).delete('/api/kiosk/devices/d1')).expect(403);
    });
  });

  describe('POST /api/kiosk/session', () => {
    it('401s without x-kiosk-token', async () => {
      await request(app).post('/api/kiosk/session').expect(401);
    });
    it('401s for an unrecognised device', async () => {
      mockKioskService.resolveDevice.mockResolvedValueOnce(null);
      await request(app).post('/api/kiosk/session').set('x-kiosk-token', 'nope').expect(401);
    });
    it('returns the bootstrap payload for a good token', async () => {
      mockKioskService.resolveDevice.mockResolvedValueOnce({ familyId: 'f1' });
      mockKioskService.getBootstrap.mockResolvedValueOnce({
        family: { id: 'f1', name: 'Narsai' },
        members: [{ userId: 'p1', name: 'Priya', role: 'parent', color: 'priya' }],
        hasPin: true,
        idleMinutes: 5,
      });
      const res = await request(app).post('/api/kiosk/session').set('x-kiosk-token', 'good').expect(200);
      expect(res.body.family.name).toBe('Narsai');
      expect(res.body.hasPin).toBe(true);
      expect(res.body.members).toHaveLength(1);
    });
    it('404s when the household vanished', async () => {
      mockKioskService.resolveDevice.mockResolvedValueOnce({ familyId: 'f1' });
      mockKioskService.getBootstrap.mockResolvedValueOnce(null);
      await request(app).post('/api/kiosk/session').set('x-kiosk-token', 'good').expect(404);
    });
  });

  describe('PUT /api/kiosk/pin', () => {
    it('400s on a non-4-digit PIN', async () => {
      await P(request(app).put('/api/kiosk/pin')).send({ pin: '12' }).expect(400);
      await P(request(app).put('/api/kiosk/pin')).send({ pin: 'abcd' }).expect(400);
      expect(mockKioskService.setPin).not.toHaveBeenCalled();
    });
    it('sets the PIN', async () => {
      mockKioskService.setPin.mockResolvedValueOnce(undefined);
      await P(request(app).put('/api/kiosk/pin')).send({ pin: '1234' }).expect(200);
      expect(mockKioskService.setPin).toHaveBeenCalledWith('parent-1', '1234');
    });
    it('403s for a non-parent', async () => {
      mockKioskService.setPin.mockRejectedValueOnce(new Error('not-allowed'));
      await P(request(app).put('/api/kiosk/pin')).send({ pin: '1234' }).expect(403);
    });
  });

  describe('DELETE /api/kiosk/pin', () => {
    it('clears the PIN', async () => {
      mockKioskService.clearPin.mockResolvedValueOnce(undefined);
      await P(request(app).delete('/api/kiosk/pin')).expect(200);
    });
    it('403s for a non-parent', async () => {
      mockKioskService.clearPin.mockRejectedValueOnce(new Error('not-allowed'));
      await P(request(app).delete('/api/kiosk/pin')).expect(403);
    });
  });

  describe('POST /api/kiosk/pin/verify', () => {
    it('401s without a user', async () => {
      await request(app).post('/api/kiosk/pin/verify').send({ pin: '1234' }).expect(401);
    });
    it('400s without a pin string', async () => {
      await P(request(app).post('/api/kiosk/pin/verify')).send({}).expect(400);
    });
    it('200 { ok: true } on a correct PIN', async () => {
      mockKioskService.verifyPin.mockResolvedValueOnce(true);
      const res = await P(request(app).post('/api/kiosk/pin/verify')).send({ pin: '1234' }).expect(200);
      expect(res.body.ok).toBe(true);
    });
    it('401 on an incorrect PIN', async () => {
      mockKioskService.verifyPin.mockResolvedValueOnce(false);
      await P(request(app).post('/api/kiosk/pin/verify')).send({ pin: '0000' }).expect(401);
    });
    it('429s once the per-device attempt cap is exceeded', async () => {
      mockKioskService.verifyPin.mockResolvedValue(false);
      let sawLimit = false;
      for (let i = 0; i < 14; i++) {
        const res = await request(app)
          .post('/api/kiosk/pin/verify')
          .set('x-user-id', 'flooder')
          .send({ pin: '0000' });
        if (res.status === 429) sawLimit = true;
      }
      expect(sawLimit).toBe(true);
    });
  });
});
