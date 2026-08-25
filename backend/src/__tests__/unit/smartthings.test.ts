import axios from 'axios';
import { SmartThingsService } from '../../services/smartthings';
import * as connection from '../../database/connection';

jest.mock('axios');
jest.mock('../../database/connection');

const mockClient = { get: jest.fn(), post: jest.fn() };

describe('SmartThingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (axios.create as jest.Mock).mockReturnValue(mockClient);
    (connection.query as jest.Mock).mockResolvedValue({ rows: [] });
    (connection.queryOne as jest.Mock).mockResolvedValue(null);
  });

  describe('without a configured token', () => {
    const ORIGINAL_TOKEN = process.env.SMARTTHINGS_TOKEN;

    beforeEach(() => {
      delete process.env.SMARTTHINGS_TOKEN;
    });

    afterEach(() => {
      process.env.SMARTTHINGS_TOKEN = ORIGINAL_TOKEN;
    });

    const service = () => new SmartThingsService('');

    it('discoverDevices should return mock devices without calling the API', async () => {
      const result = await service().discoverDevices();

      expect(result).toHaveLength(3);
      expect(result[0].deviceId).toBe('mock-light-1');
      expect(mockClient.get).not.toHaveBeenCalled();
    });

    it('getDeviceStatus should return a mock online status', async () => {
      const result = await service().getDeviceStatus('device-1');

      expect(result).toEqual({ status: 'mock', online: true });
    });

    it('sendCommand should short-circuit as successful', async () => {
      const result = await service().sendCommand('device-1', [{ capability: 'switch', command: 'on' }]);

      expect(result).toBe(true);
      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });

  describe('with a configured token', () => {
    const service = () => new SmartThingsService('test-token');

    it('should authorize requests with a bearer token', () => {
      service();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      );
    });

    it('discoverDevices should fetch, map, and persist devices from the API', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/devices') {
          return Promise.resolve({
            data: {
              devices: [
                { deviceId: 'd1', label: 'Kitchen Light', deviceTypeName: 'Light Switch', room: { name: 'Kitchen' } },
              ],
            },
          });
        }
        if (url === '/devices/d1/status') {
          return Promise.resolve({ data: { components: [{ capabilities: { switch: 'on' } }] } });
        }
        return Promise.reject(new Error('unexpected url'));
      });

      const result = await service().discoverDevices();

      expect(result).toEqual([
        { deviceId: 'd1', name: 'Kitchen Light', type: 'light', room: 'Kitchen', status: { switch: 'on' } },
      ]);
      expect(connection.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO smartthings_devices'), [
        'd1',
        'Kitchen Light',
        'light',
        'Kitchen',
        JSON.stringify({ switch: 'on' }),
      ]);
    });

    it('discoverDevices should fall back to mock devices when the API call fails', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('network error'));

      const result = await service().discoverDevices();

      expect(result).toHaveLength(3);
      expect(result[0].deviceId).toBe('mock-light-1');
    });

    it('getDeviceStatus should return the capabilities from the response', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: { components: [{ capabilities: { switch: 'off' } }] },
      });

      const result = await service().getDeviceStatus('device-1');

      expect(result).toEqual({ switch: 'off' });
    });

    it('getDeviceStatus should return unknown/offline when the API call fails', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('network error'));

      const result = await service().getDeviceStatus('device-1');

      expect(result).toEqual({ status: 'unknown', online: false });
    });

    it('sendCommand should post the first command with defaulted arguments', async () => {
      mockClient.post.mockResolvedValueOnce({});

      const result = await service().sendCommand('device-1', [{ capability: 'switch', command: 'on' }]);

      expect(result).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith('/devices/device-1/commands', {
        commands: [{ component: 'main', capability: 'switch', command: 'on', arguments: [] }],
      });
    });

    it('sendCommand should return false when the API call fails', async () => {
      mockClient.post.mockRejectedValueOnce(new Error('network error'));

      const result = await service().sendCommand('device-1', [{ capability: 'switch', command: 'on' }]);

      expect(result).toBe(false);
    });

    it('setLight should send an on/off switch command', async () => {
      mockClient.post.mockResolvedValueOnce({});

      await service().setLight('device-1', true);

      expect(mockClient.post).toHaveBeenCalledWith('/devices/device-1/commands', {
        commands: [{ component: 'main', capability: 'switch', command: 'on', arguments: [] }],
      });
    });

    it('setLightBrightness should clamp brightness to 0-100', async () => {
      mockClient.post.mockResolvedValueOnce({});

      await service().setLightBrightness('device-1', 150);

      expect(mockClient.post).toHaveBeenCalledWith('/devices/device-1/commands', {
        commands: [{ component: 'main', capability: 'switchLevel', command: 'setLevel', arguments: [100] }],
      });
    });

    it('setTemperature should send a heating setpoint command', async () => {
      mockClient.post.mockResolvedValueOnce({});

      await service().setTemperature('device-1', 68);

      expect(mockClient.post).toHaveBeenCalledWith('/devices/device-1/commands', {
        commands: [
          { component: 'main', capability: 'thermostatHeatingSetpoint', command: 'setHeatingSetpoint', arguments: [68] },
        ],
      });
    });

    it('setLock should send a lock/unlock command', async () => {
      mockClient.post.mockResolvedValueOnce({});

      await service().setLock('device-1', false);

      expect(mockClient.post).toHaveBeenCalledWith('/devices/device-1/commands', {
        commands: [{ component: 'main', capability: 'lock', command: 'unlock', arguments: [] }],
      });
    });
  });

  describe('getDevice', () => {
    it('should return null when the device is not found', async () => {
      const result = await new SmartThingsService('t').getDevice('device-1');

      expect(result).toBeNull();
    });

    it('should map a database row to a device', async () => {
      (connection.queryOne as jest.Mock).mockResolvedValueOnce({
        device_id: 'd1',
        name: 'Kitchen Light',
        type: 'light',
        room: null,
        status: null,
      });

      const result = await new SmartThingsService('t').getDevice('d1');

      expect(result).toEqual({ deviceId: 'd1', name: 'Kitchen Light', type: 'light', room: undefined, status: {} });
    });
  });

  describe('listDevices', () => {
    it('should map all database rows to devices', async () => {
      (connection.query as jest.Mock).mockResolvedValueOnce({
        rows: [
          { device_id: 'd1', name: 'Kitchen Light', type: 'light', room: 'Kitchen', status: { switch: 'on' } },
        ],
      });

      const result = await new SmartThingsService('t').listDevices();

      expect(result).toEqual([
        { deviceId: 'd1', name: 'Kitchen Light', type: 'light', room: 'Kitchen', status: { switch: 'on' } },
      ]);
    });
  });
});
