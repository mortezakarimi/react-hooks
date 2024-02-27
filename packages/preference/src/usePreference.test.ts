/**
 * @jest-environment jsdom
 */

import { Preferences, type PreferencesPlugin } from '@capacitor/preferences';
import { act, renderHook } from '@testing-library/react';
import { usePreference, usePreferenceItem } from './usePreference';

jest.mock('@capacitor/core', () => {
  return {
    Capacitor: {
      isPluginAvailable: () => true,
      getPlatform: () => 'web',
    },
  };
});
type PreferencesMockType = PreferencesPlugin & { data: any; __init: (d: any) => void };
jest.mock('@capacitor/preferences', (): { Preferences: PreferencesMockType } => {
  return {
    Preferences: {
      data: {} as any,
      __init(d: any) {
        this.data = d;
      },
      async get({ key }: { key: string }) {
        return { value: this.data[key] };
      },
      async set({ key, value }: { key: string; value: string }) {
        this.data[key] = value;
      },
      async remove({ key }: { key: string }) {
        delete this.data[key];
      },
      async keys() {
        return { keys: Object.keys(this.data) };
      },
      async clear() {
        this.data = {};
      },
      async migrate() {
        return { migrated: [], existing: [] };
      },
      async configure() {
        return;
      },
      async removeOld() {},
    },
  };
});

it('Gets and sets preference values', async () => {
  const r = renderHook(() => usePreference());

  await act(async () => {
    const result = r.result.current;
    const { isAvailable } = result;
    expect(isAvailable).toBe(true);
  });

  await act(async () => {
    const result = r.result.current;

    const { get, set, remove, getKeys, clear } = result;

    await set('name', 'Max');

    let name = await get('name');
    expect(name).toEqual('Max');

    await remove('name');
    name = await get('name');
    expect(name).toEqual(undefined);

    await set('name', 'Max');
    const knownKeys = await getKeys();
    expect(knownKeys.keys).toStrictEqual(['name']);

    await clear();
    name = await get('name');
    expect(name).toEqual(undefined);
  });
});

it('Manages individual item', async () => {
  let r: any;
  await act(async () => {
    r = renderHook(() => usePreferenceItem('name', 'Max'));
  });

  await act(async () => {
    return;
  });

  await act(async () => {
    const result = r.result.current;

    const [value, setValue] = result;
    expect(value).toBe('Max');

    setValue('Frank');
  });

  await act(async () => {
    const result = r.result.current;

    const [value] = result;
    expect(value).toBe('Frank');
  });
});
it('Manages object individual item', async () => {
  let r: any;
  await act(async () => {
    r = renderHook(() => usePreferenceItem('user', { name: 'John', family: 'Doe' }));
  });

  await act(async () => {
    return;
  });

  await act(async () => {
    const result = r.result.current;

    const [value, setValue] = result;
    expect(value).toStrictEqual({ name: 'John', family: 'Doe' });

    setValue(null);
  });

  await act(async () => {
    const result = r.result.current;

    const [value] = result;
    expect(value).toBeNull();
  });
});

it('Manages individual item with stored value', async () => {
  let r: any;

  const storageMock = Preferences as any;
  await act(async () => {
    storageMock.__init({ name: JSON.stringify('Matilda') });
  });

  await act(async () => {
    r = renderHook(() => usePreferenceItem('name', 'Max'));
  });

  await act(async () => {
    return;
  });

  await act(async () => {
    const result = r.result.current;

    const [value, setValue] = result;
    expect(value).toBe('Matilda');

    setValue('Frank');
  });
});
