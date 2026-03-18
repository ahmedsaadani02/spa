import type { SpaApi } from '../types/electron';
import { getWebSpaApi } from './web-spa-api';

export const getSpaApi = (): SpaApi | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return getWebSpaApi();
};

export const hasSpaApi = (): boolean => !!getSpaApi();

export const isElectronRuntime = (): boolean => false;

export const waitForSpaApiReady = async (
  timeout = 5000,
  interval = 25
): Promise<boolean> => {
  void timeout;
  void interval;
  return hasSpaApi();
};

export const shouldUseIpcRepositories = (): boolean => hasSpaApi();
