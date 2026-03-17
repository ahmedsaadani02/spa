import type { SpaApi } from '../types/electron';
import { getWebSpaApi } from './web-spa-api';

const DEFAULT_SPA_READY_TIMEOUT = 5000;
const DEFAULT_POLL_INTERVAL = 25;

let spaReadyCheckDone = false;
let spaReady = false;

export const getSpaApi = (): SpaApi | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.spa) {
    return window.spa;
  }

  // Browser web-first mode: provide an HTTP-backed SpaApi when Electron bridge is absent.
  if (!isElectronRuntime()) {
    return getWebSpaApi();
  }

  return null;
};

export const hasSpaApi = (): boolean => !!getSpaApi();

export const isElectronRuntime = (): boolean => {
  const maybeProcess = (globalThis as unknown as { process?: { versions?: { electron?: string } } }).process;
  if (typeof maybeProcess?.versions?.electron === 'string' && maybeProcess.versions.electron.length > 0) {
    return true;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location?.protocol ?? '';
    if (protocol === 'file:' || protocol === 'app:') {
      return true;
    }
  }

  if (typeof navigator === 'undefined') {
    return false;
  }

  return /electron/i.test(navigator.userAgent ?? '');
};

export const waitForSpaApiReady = async (
  timeout = DEFAULT_SPA_READY_TIMEOUT,
  interval = DEFAULT_POLL_INTERVAL
): Promise<boolean> => {
  if (hasSpaApi()) {
    spaReadyCheckDone = true;
    spaReady = true;
    return true;
  }

  if (!isElectronRuntime()) {
    spaReadyCheckDone = true;
    spaReady = true;
    return true;
  }

  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (hasSpaApi()) {
      spaReadyCheckDone = true;
      spaReady = true;
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  spaReadyCheckDone = true;
  spaReady = hasSpaApi();
  return spaReady;
};

export const shouldUseIpcRepositories = (): boolean => {
  if (hasSpaApi()) return true;
  if (spaReadyCheckDone && spaReady) return true;
  if (isElectronRuntime()) return true;
  return false;
};
