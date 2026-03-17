const DEFAULT_SPA_READY_TIMEOUT = 5000;
const DEFAULT_POLL_INTERVAL = 25;
let spaReadyCheckDone = false;
let spaReady = false;
export const getSpaApi = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    return window.spa ?? null;
};
export const hasSpaApi = () => !!getSpaApi();
export const isElectronRuntime = () => {
    const maybeProcess = globalThis.process;
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
export const waitForSpaApiReady = async (timeout = DEFAULT_SPA_READY_TIMEOUT, interval = DEFAULT_POLL_INTERVAL) => {
    if (hasSpaApi()) {
        spaReadyCheckDone = true;
        spaReady = true;
        return true;
    }
    if (!isElectronRuntime()) {
        spaReadyCheckDone = true;
        spaReady = false;
        return false;
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
export const shouldUseIpcRepositories = () => {
    if (hasSpaApi())
        return true;
    if (isElectronRuntime())
        return true;
    if (spaReadyCheckDone && spaReady)
        return true;
    return false;
};
