import type { SpaApi } from '../types/app-api.types';
import { getWebAppApi } from './web-app-api';

export const getAppApi = (): SpaApi | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return getWebAppApi();
};

export const hasAppApi = (): boolean => !!getAppApi();

export const waitForAppApiReady = async (
  timeout = 5000,
  interval = 25
): Promise<boolean> => {
  void timeout;
  void interval;
  return hasAppApi();
};

export const shouldUseBackendRepositories = (): boolean => hasAppApi();
