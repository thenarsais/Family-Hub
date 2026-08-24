import axios, { AxiosInstance } from 'axios';
import { query, queryOne } from '../database/connection';

interface SmartThingsDevice {
  deviceId: string;
  name: string;
  type: string;
  room?: string;
  status: Record<string, unknown>;
}

interface DeviceCommand {
  capability: string;
  command: string;
  arguments?: unknown[];
}

interface SmartThingsDeviceRow {
  device_id: string;
  name: string;
  type: string;
  room: string | null;
  status: Record<string, unknown> | null;
}

interface SmartThingsApiDevice {
  deviceId: string;
  label: string;
  deviceTypeName?: string;
  room?: { name?: string };
}

export class SmartThingsService {
  private client: AxiosInstance;
  private baseUrl = 'https://api.smartthings.com/v1';
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.SMARTTHINGS_TOKEN || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }

  /**
   * Get all devices from SmartThings
   */
  async discoverDevices(): Promise<SmartThingsDevice[]> {
    try {
      if (!this.token) {
        console.warn('SmartThings token not configured, using mock devices');
        return this.getMockDevices();
      }

      const response = await this.client.get('/devices');
      const devices: SmartThingsDevice[] = [];

      for (const device of response.data.devices as SmartThingsApiDevice[]) {
        const dbDevice = await this.saveDevice({
          deviceId: device.deviceId,
          name: device.label,
          type: this.mapDeviceType(device),
          room: device.room?.name,
          status: await this.getDeviceStatus(device.deviceId),
        });
        devices.push(dbDevice);
      }

      return devices;
    } catch (error) {
      console.error('Failed to discover SmartThings devices:', error);
      return this.getMockDevices();
    }
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<Record<string, unknown>> {
    try {
      if (!this.token) {
        return { status: 'mock', online: true };
      }

      const response = await this.client.get(`/devices/${deviceId}/status`);
      return response.data.components?.[0]?.capabilities || {};
    } catch (error) {
      console.error(`Failed to get status for device ${deviceId}:`, error);
      return { status: 'unknown', online: false };
    }
  }

  /**
   * Send command to device (on/off, brightness, etc)
   */
  async sendCommand(
    deviceId: string,
    commands: DeviceCommand[]
  ): Promise<boolean> {
    try {
      if (!this.token) {
        console.log(`Mock command to ${deviceId}:`, commands);
        return true;
      }

      await this.client.post(`/devices/${deviceId}/commands`, {
        commands: [
          {
            component: 'main',
            capability: commands[0].capability,
            command: commands[0].command,
            arguments: commands[0].arguments || [],
          },
        ],
      });

      return true;
    } catch (error) {
      console.error(`Failed to send command to device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Turn light on/off
   */
  async setLight(deviceId: string, on: boolean): Promise<boolean> {
    return this.sendCommand(deviceId, [
      {
        capability: 'switch',
        command: on ? 'on' : 'off',
      },
    ]);
  }

  /**
   * Set light brightness (0-100)
   */
  async setLightBrightness(deviceId: string, brightness: number): Promise<boolean> {
    return this.sendCommand(deviceId, [
      {
        capability: 'switchLevel',
        command: 'setLevel',
        arguments: [Math.min(100, Math.max(0, brightness))],
      },
    ]);
  }

  /**
   * Set thermostat temperature
   */
  async setTemperature(deviceId: string, temperature: number): Promise<boolean> {
    return this.sendCommand(deviceId, [
      {
        capability: 'thermostatHeatingSetpoint',
        command: 'setHeatingSetpoint',
        arguments: [temperature],
      },
    ]);
  }

  /**
   * Lock/unlock door
   */
  async setLock(deviceId: string, locked: boolean): Promise<boolean> {
    return this.sendCommand(deviceId, [
      {
        capability: 'lock',
        command: locked ? 'lock' : 'unlock',
      },
    ]);
  }

  /**
   * Save device to database
   */
  private async saveDevice(device: SmartThingsDevice): Promise<SmartThingsDevice> {
    await query(
      `INSERT INTO smartthings_devices (device_id, name, type, room, status, last_updated)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (device_id) DO UPDATE SET
       name = $2, type = $3, room = $4, status = $5, last_updated = CURRENT_TIMESTAMP`,
      [device.deviceId, device.name, device.type, device.room || null, JSON.stringify(device.status)]
    );
    return device;
  }

  /**
   * Get device from database
   */
  async getDevice(deviceId: string): Promise<SmartThingsDevice | null> {
    const result = await queryOne<SmartThingsDeviceRow>(
      'SELECT device_id, name, type, room, status FROM smartthings_devices WHERE device_id = $1',
      [deviceId]
    );

    if (!result) return null;

    return {
      deviceId: result.device_id,
      name: result.name,
      type: result.type,
      room: result.room ?? undefined,
      status: result.status || {},
    };
  }

  /**
   * List all devices
   */
  async listDevices(): Promise<SmartThingsDevice[]> {
    const results = await query<SmartThingsDeviceRow>(
      'SELECT device_id, name, type, room, status FROM smartthings_devices ORDER BY name'
    );

    return results.rows.map(r => ({
      deviceId: r.device_id,
      name: r.name,
      type: r.type,
      room: r.room ?? undefined,
      status: r.status || {},
    }));
  }

  /**
   * Map SmartThings device types to our types
   */
  private mapDeviceType(device: SmartThingsApiDevice): string {
    const capabilities = device.deviceTypeName || '';

    if (capabilities.includes('Light')) return 'light';
    if (capabilities.includes('Switch')) return 'switch';
    if (capabilities.includes('Lock')) return 'lock';
    if (capabilities.includes('Thermostat')) return 'climate';
    if (capabilities.includes('Sensor')) return 'sensor';
    return 'other';
  }

  /**
   * Mock devices for testing (when token not configured)
   */
  private getMockDevices(): SmartThingsDevice[] {
    return [
      {
        deviceId: 'mock-light-1',
        name: 'Living Room Light',
        type: 'light',
        room: 'Living Room',
        status: { switch: 'on', level: 100 },
      },
      {
        deviceId: 'mock-thermostat-1',
        name: 'Main Thermostat',
        type: 'climate',
        room: 'Hallway',
        status: { temperature: 72, mode: 'heat' },
      },
      {
        deviceId: 'mock-lock-1',
        name: 'Front Door',
        type: 'lock',
        room: 'Entry',
        status: { lock: 'locked' },
      },
    ];
  }
}

// Singleton instance
let smartthingsService: SmartThingsService | null = null;

export function getSmartThingsService(): SmartThingsService {
  if (!smartthingsService) {
    smartthingsService = new SmartThingsService();
  }
  return smartthingsService;
}
