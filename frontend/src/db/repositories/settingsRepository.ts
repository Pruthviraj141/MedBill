import { getDB } from '../database';
import { Setting } from '../types';
import { Capacitor } from '@capacitor/core';
import { webApiClient } from '../../lib/webApiClient';

// ----------------------------------------------------------------------
// NATIVE IMPLEMENTATION
// ----------------------------------------------------------------------
const nativeImpl = {
  getSetting: async (key: string): Promise<string | null> => {
    const db = await getDB();
    const res = await db.query(`SELECT value FROM settings WHERE key = ?`, [key]);
    return res.values?.[0]?.value || null;
  },

  setSetting: async (key: string, value: string) => {
    const db = await getDB();
    await db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value]);
  },

  removeSetting: async (key: string) => {
    const db = await getDB();
    await db.run(`DELETE FROM settings WHERE key = ?`, [key]);
  }
};

// ----------------------------------------------------------------------
// WEB IMPLEMENTATION
// ----------------------------------------------------------------------
const webImpl = {
  getSetting: async (key: string): Promise<string | null> => {
    const data = await webApiClient.get('/settings');
    const settings = data.settings || {};
    return settings[key] || null;
  },

  setSetting: async (key: string, value: string) => {
    await webApiClient.post('/settings', { [key]: value });
  },

  removeSetting: async (key: string) => {
    // In our backend API, there isn't an explicit DELETE endpoint for settings yet.
    // For now we set it to empty assuming standard un-setting pattern for D1 sync
    await webApiClient.post('/settings', { [key]: '' });
  }
};

export const settingsRepository = Capacitor.isNativePlatform() ? nativeImpl : webImpl;
