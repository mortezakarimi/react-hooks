// Inspired by useLocalStorage from https://usehooks.com/useLocalStorage/
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AvailableResult, notAvailable } from './util/models';
import { featureNotAvailableError, isFeatureAvailable } from './util/feature-check';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

interface PreferenceResult extends AvailableResult {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => void;
  getKeys: () => Promise<{ keys: string[] }>;
  clear: () => Promise<void>;
}

type PreferenceItemResult<T> = [T | undefined, (value: T) => Promise<void>, boolean];

if (!Capacitor.isPluginAvailable('Preferences')) {
  console.warn('The @capacitor/Preferences plugin was not found, did you forget to install it?');
}

export const availableFeatures = {
  usePreference: isFeatureAvailable('Preferences', 'usePreferences'),
};

export function usePreference(): PreferenceResult {
  if (!availableFeatures.usePreference) {
    return {
      get: featureNotAvailableError,
      set: featureNotAvailableError,
      remove: featureNotAvailableError,
      getKeys: featureNotAvailableError,
      clear: featureNotAvailableError,
      ...notAvailable,
    };
  }

  const get = useCallback(async (key: string) => {
    const v = await Preferences.get({ key });
    if (v) {
      return v.value;
    }
    return null;
  }, []);

  const set = useCallback((key: string, value: string) => {
    return Preferences.set({ key, value: value });
  }, []);

  const remove = useCallback((key: string) => {
    return Preferences.remove({ key });
  }, []);

  const getKeys = useCallback(() => {
    return Preferences.keys();
  }, []);

  const clear = useCallback(() => {
    return Preferences.clear();
  }, []);

  return { get, set, remove, getKeys, clear, isAvailable: true };
}

export function usePreferenceItem<T>(key: string, initialValue?: T): PreferenceItemResult<T> {
  if (!availableFeatures.usePreference) {
    return [undefined, featureNotAvailableError, false];
  }
  const initialValueMemo = useMemo(() => initialValue, []);

  const [storedValue, setStoredValue] = useState<T>();

  useEffect(() => {
    async function loadValue() {
      try {
        const result = await Preferences.get({ key });
        if (result.value == undefined && initialValueMemo != undefined) {
          result.value = JSON.stringify(initialValueMemo);
          setValue(initialValueMemo as any);
        } else {
          if (typeof result.value === 'string' && JSON.parse(result.value)) {
            setStoredValue(JSON.parse(result.value));
          } else {
            setStoredValue(undefined);
          }
        }
      } catch (e) {
        return initialValueMemo;
      }
    }

    loadValue();
  }, [Preferences, setStoredValue, initialValueMemo, key]);

  const setValue = useCallback(async (value: T) => {
    try {
      setStoredValue(value);
      await Preferences.set({
        key,
        value: JSON.stringify(value),
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  return [storedValue, setValue, true];
}
