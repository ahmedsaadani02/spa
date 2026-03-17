import type {
  AppUser,
  AuthBeginLoginResult,
  AuthFlowContext,
  AuthPasswordActionResult,
  EmployeeRecord,
  EmployeeUpsertInput,
  PermissionSet,
  SalaryAdvanceInput,
  SalaryAdvanceRecord,
  SalaryBonusInput,
  SalaryBonusRecord,
  SalaryOvertimeInput,
  SalaryOvertimeRecord,
  SalarySummary,
  SpaApi,
  SpaDbBackupEntry,
  SpaDbBackupResult,
  SpaDocumentPdfResult,
  SpaDocumentRequest,
  SpaInventoryResponse,
  SpaPriceHistoryEntry,
  SpaPrintResult,
  SpaProductArchiveResult,
  SpaProductCreatePayload,
  SpaProductCreateResult,
  SpaProductImageSelectionResult,
  SpaProductInput,
  SpaProductMetadata,
  SpaProductMetadataAddResult,
  SpaProductPurgeResult,
  SpaProductRestoreResult,
  SpaProductRow,
  SpaProductUpdateResult,
  SpaQuoteConvertResult,
  SpaStockRow,
  SpaUpdateStatusPayload
} from '../types/electron';
import type { Client } from '../models/client';
import type { Invoice } from '../models/invoice';
import type { Quote } from '../models/quote';
import type { StockColor, StockItem } from '../models/stock-item';
import type { StockMovement } from '../models/stock-movement';

const WEB_TOKEN_KEY = 'spa:web-http-token';
let webSpaApiSingleton: SpaApi | null = null;
const HTTP_IPC_DEFAULT_PATH = '/api/ipc/invoke';
const HTTP_IPC_FALLBACK_URL = 'http://localhost:3000/api/ipc/invoke';

type AuthLikeResult = AuthBeginLoginResult & { token?: string };
type UserWithToken = AppUser & { token?: string };

const hasWindow = () => typeof window !== 'undefined';
const PRINT_FRAME_ID = 'spa-web-print-frame';
const PDF_STAGE_ID = 'spa-web-pdf-stage';

const getToken = (): string => {
  if (!hasWindow()) return '';
  try {
    return window.localStorage.getItem(WEB_TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

const setToken = (token: string | null): void => {
  if (!hasWindow()) return;
  try {
    if (!token) {
      window.localStorage.removeItem(WEB_TOKEN_KEY);
    } else {
      window.localStorage.setItem(WEB_TOKEN_KEY, token);
    }
  } catch {
    // ignore
  }
};

const getHttpIpcUrls = (): string[] => {
  if (!hasWindow()) {
    return [HTTP_IPC_DEFAULT_PATH];
  }

  const urls: string[] = [HTTP_IPC_DEFAULT_PATH];
  const origin = window.location?.origin ?? '';
  if (!origin.startsWith('http://localhost:3000') && !origin.startsWith('http://127.0.0.1:3000')) {
    urls.push(HTTP_IPC_FALLBACK_URL);
  }
  return urls;
};

const invokeHttpIpc = async <T>(channel: string, args: unknown[] = []): Promise<T> => {
  const token = getToken();
  const urls = getHttpIpcUrls();
  let lastError: Error | null = null;

  for (const requestUrl of urls) {
    try {
      if (channel === 'auth:beginLogin') {
        console.log('[web-login] request url', requestUrl);
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ channel, args })
      });

      let payload: { success?: boolean; result?: T; message?: string } | null = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (response.status === 401) {
        setToken(null);
      }

      if (response.ok && payload?.success) {
        return payload.result as T;
      }

      const failureMessage = payload?.message || `HTTP_IPC_FAILED:${channel}`;
      lastError = new Error(failureMessage);

      const shouldTryNext = requestUrl === HTTP_IPC_DEFAULT_PATH
        && urls.length > 1
        && (response.status === 404 || response.status === 502 || response.status === 503 || response.status === 504 || !payload?.success);
      if (shouldTryNext) {
        continue;
      }

      throw lastError;
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error ?? `HTTP_IPC_FAILED:${channel}`));
      lastError = normalized;
      const shouldTryNext = requestUrl === HTTP_IPC_DEFAULT_PATH && urls.length > 1;
      if (shouldTryNext) {
        continue;
      }
      throw normalized;
    }
  }

  throw lastError ?? new Error(`HTTP_IPC_FAILED:${channel}`);
};

const stripTokenFromAuthResult = (result: AuthLikeResult): AuthBeginLoginResult => {
  const { token: _token, ...next } = result;
  return next;
};

const stripTokenFromUser = (result: UserWithToken): AppUser => {
  const { token: _token, ...next } = result;
  return next;
};

const pickImageFile = (): Promise<File | null> => new Promise((resolve) => {
  if (!hasWindow()) {
    resolve(null);
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.png,.jpg,.jpeg,.webp,.gif,.bmp,image/*';
  input.onchange = () => {
    const file = input.files?.[0] ?? null;
    resolve(file);
  };
  input.click();
});

const readAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
  reader.readAsDataURL(file);
});

const webSelectProductImage = async (): Promise<SpaProductImageSelectionResult> => {
  try {
    const file = await pickImageFile();
    if (!file) {
      return { canceled: true };
    }

    const dataUrl = await readAsDataUrl(file);
    const token = getToken();
    const response = await fetch('/api/uploads/product-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        fileName: file.name,
        preferredName: file.name.replace(/\.[^.]+$/, ''),
        dataUrl
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) {
      return {
        canceled: true,
        error: payload?.message || 'IMAGE_UPLOAD_FAILED',
        message: payload?.message || 'Upload image impossible.'
      };
    }

    return {
      canceled: false,
      imageRef: payload.imageRef,
      imageUrl: payload.imageUrl,
      fileName: payload.fileName
    };
  } catch (error) {
    return {
      canceled: true,
      error: error instanceof Error ? error.message : 'IMAGE_UPLOAD_FAILED',
      message: 'Upload image impossible.'
    };
  }
};

const sanitizeFileToken = (value: string): string => String(value || '')
  .trim()
  .replace(/[^\w.-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/(^-|-$)/g, '') || Date.now().toString();

const buildPdfFilename = (options: SpaDocumentRequest): string => {
  const prefix = options.docType === 'invoice' ? 'facture' : 'devis';
  const token = sanitizeFileToken(options.documentNumber || Date.now().toString());
  return `${prefix}-${token}.pdf`;
};

const removeElement = (element: HTMLElement | null | undefined): void => {
  if (!element) return;
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
};

const waitForIframeLoad = (iframe: HTMLIFrameElement, timeoutMs = 8000): Promise<void> => new Promise((resolve, reject) => {
  let settled = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const finish = (error?: Error) => {
    if (settled) return;
    settled = true;
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    iframe.removeEventListener('load', onLoad);
    iframe.removeEventListener('error', onError as EventListener);
    if (error) {
      reject(error);
      return;
    }
    resolve();
  };

  const onLoad = () => finish();
  const onError = () => finish(new Error('PRINT_IFRAME_LOAD_FAILED'));

  timeout = setTimeout(() => finish(new Error('PRINT_IFRAME_TIMEOUT')), timeoutMs);
  iframe.addEventListener('load', onLoad, { once: true });
  iframe.addEventListener('error', onError as EventListener, { once: true });
});

const waitForImages = async (doc: Document, timeoutMs = 4000): Promise<void> => {
  const images = Array.from(doc.images || []);
  if (!images.length) return;

  await Promise.all(images.map((img) => new Promise<void>((resolve) => {
    if (img.complete) {
      resolve();
      return;
    }
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      img.removeEventListener('load', finish);
      img.removeEventListener('error', finish);
      resolve();
    };
    timer = setTimeout(finish, timeoutMs);
    img.addEventListener('load', finish, { once: true });
    img.addEventListener('error', finish, { once: true });
  })));
};

const ensurePrintStyles = (doc: Document): void => {
  const style = doc.createElement('style');
  style.textContent = `
    html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  `;
  doc.head.appendChild(style);
};

const createPrintableIframe = async (html: string, title?: string): Promise<HTMLIFrameElement> => {
  if (!hasWindow()) {
    throw new Error('PRINT_UNAVAILABLE');
  }

  const previous = document.getElementById(PRINT_FRAME_ID);
  removeElement(previous as HTMLElement | null);

  const iframe = document.createElement('iframe');
  iframe.id = PRINT_FRAME_ID;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    throw new Error('PRINT_DOCUMENT_UNAVAILABLE');
  }

  doc.open();
  doc.write(html);
  doc.close();
  if (title) {
    doc.title = title;
  }

  await waitForIframeLoad(iframe);
  ensurePrintStyles(doc);
  await waitForImages(doc);
  return iframe;
};

const webPrintDocument = async (options: SpaDocumentRequest): Promise<SpaPrintResult> => {
  if (!hasWindow()) {
    return { ok: false, message: 'PRINT_UNAVAILABLE' };
  }
  if (!options?.html) {
    return { ok: false, message: 'PRINT_HTML_REQUIRED' };
  }

  try {
    console.log('[web-documents:print] start', { docType: options.docType, documentNumber: options.documentNumber });
    const iframe = await createPrintableIframe(options.html, options.title);
    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      removeElement(iframe);
      return { ok: false, message: 'PRINT_WINDOW_UNAVAILABLE' };
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 120));
    printWindow.focus();

    const cleanup = () => removeElement(iframe);
    let cleaned = false;
    const safeCleanup = () => {
      if (cleaned) return;
      cleaned = true;
      cleanup();
    };

    const onAfterPrint = () => safeCleanup();
    printWindow.addEventListener('afterprint', onAfterPrint, { once: true });

    printWindow.print();
    window.setTimeout(() => safeCleanup(), 3000);
    console.log('[web-documents:print] dialog opened');
    return { ok: true };
  } catch (error) {
    console.error('[web-documents:print] failed', error);
    return { ok: false, message: error instanceof Error ? error.message : 'PRINT_FAILED' };
  }
};

const webExportDocument = async (options: SpaDocumentRequest): Promise<SpaDocumentPdfResult> => {
  if (!hasWindow()) {
    return { canceled: true, message: 'PDF_EXPORT_UNAVAILABLE' };
  }
  if (!options?.html) {
    return { canceled: true, message: 'PDF_EXPORT_HTML_REQUIRED' };
  }

  try {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdfFactory = (html2pdfModule as unknown as { default?: any }).default ?? (html2pdfModule as unknown as any);
    if (typeof html2pdfFactory !== 'function') {
      return { canceled: true, message: 'PDF_EXPORT_LIBRARY_UNAVAILABLE' };
    }

    const iframe = await createPrintableIframe(options.html, options.title);
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      removeElement(iframe);
      return { canceled: true, message: 'PDF_EXPORT_DOCUMENT_UNAVAILABLE' };
    }

    const previousStage = document.getElementById(PDF_STAGE_ID);
    removeElement(previousStage as HTMLElement | null);

    const stage = document.createElement('div');
    stage.id = PDF_STAGE_ID;
    stage.style.position = 'fixed';
    stage.style.left = '-10000px';
    stage.style.top = '0';
    stage.style.width = '210mm';
    stage.style.background = '#ffffff';
    stage.style.zIndex = '-1';
    stage.innerHTML = iframeDoc.body.innerHTML;

    // Keep critical print/document styles from source document.
    iframeDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      stage.prepend(node.cloneNode(true));
    });

    document.body.appendChild(stage);
    removeElement(iframe);

    const sourceElement = stage.querySelector('.invoice-page') || stage;
    const fileName = buildPdfFilename(options);
    console.log('[web-documents:exportPdf] start', {
      docType: options.docType,
      documentNumber: options.documentNumber,
      fileName
    });

    await html2pdfFactory()
      .set({
        filename: fileName,
        margin: 0,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      })
      .from(sourceElement)
      .save();

    removeElement(stage);
    console.log('[web-documents:exportPdf] done', { fileName });
    return { canceled: false, filePath: fileName };
  } catch (error) {
    console.error('[web-documents:exportPdf] failed', error);
    return { canceled: true, message: error instanceof Error ? error.message : 'PDF_EXPORT_FAILED' };
  }
};

const createWebSpaApi = (): SpaApi => ({
  exportPdf: async () => ({ canceled: true, message: 'Use documents.exportPdf(docType, html) in web mode.' }),
  documents: {
    print: (options: SpaDocumentRequest) => webPrintDocument(options),
    exportPdf: (options: SpaDocumentRequest) => webExportDocument(options)
  },
  updates: {
    check: async () => false,
    install: async () => false,
    getStatus: async () => ({ status: 'none' }),
    onStatus: () => () => {}
  },
  auth: {
    login: async (username: string, password: string) => {
      const result = await invokeHttpIpc<UserWithToken | null>('auth:login', [username, password, null]);
      if (!result) return null;
      if (result.token) setToken(result.token);
      return stripTokenFromUser(result);
    },
    beginLogin: async (identity: string, password: string, context?: AuthFlowContext | null) => {
      const result = await invokeHttpIpc<AuthLikeResult>('auth:beginLogin', [identity, password, context ?? null]);
      if (result?.status === 'success' && result?.token) {
        setToken(result.token);
      }
      return stripTokenFromAuthResult(result);
    },
    setupProtectedPassword: (email: string, newPassword: string, context?: AuthFlowContext | null) =>
      invokeHttpIpc<AuthPasswordActionResult>('auth:setupProtectedPassword', [email, newPassword, context ?? null]),
    logout: async () => {
      try {
        await invokeHttpIpc<boolean>('auth:logout', []);
      } finally {
        setToken(null);
      }
      return true;
    },
    getCurrentUser: async () => invokeHttpIpc<AppUser | null>('auth:getCurrentUser', []),
    hasPermission: (permissionKey: keyof PermissionSet) => invokeHttpIpc<boolean>('auth:hasPermission', [permissionKey]),
    resetPassword: (employeeId: string, newPassword: string) => invokeHttpIpc<boolean>('auth:resetPassword', [employeeId, newPassword])
  },
  employees: {
    list: () => invokeHttpIpc<EmployeeRecord[]>('employees:list', []),
    search: (query: string) => invokeHttpIpc<EmployeeRecord[]>('employees:search', [query]),
    getById: (id: string) => invokeHttpIpc<EmployeeRecord | null>('employees:getById', [id]),
    create: (payload: EmployeeUpsertInput) => invokeHttpIpc<EmployeeRecord | null>('employees:create', [payload]),
    update: (id: string, payload: EmployeeUpsertInput) => invokeHttpIpc<EmployeeRecord | null>('employees:update', [id, payload]),
    delete: (id: string) => invokeHttpIpc<boolean>('employees:delete', [id]),
    setActive: (id: string, actif: boolean) => invokeHttpIpc<boolean>('employees:setActive', [id, actif])
  },
  salary: {
    advances: {
      list: (employeeId: string, month: number, year: number) => invokeHttpIpc<SalaryAdvanceRecord[]>('salary:advances:list', [employeeId, month, year]),
      create: (payload: SalaryAdvanceInput) => invokeHttpIpc<SalaryAdvanceRecord | null>('salary:advances:create', [payload]),
      delete: (id: string) => invokeHttpIpc<boolean>('salary:advances:delete', [id]),
      total: (employeeId: string, month: number, year: number) => invokeHttpIpc<number>('salary:advances:total', [employeeId, month, year])
    },
    bonuses: {
      list: (employeeId: string, month: number, year: number) => invokeHttpIpc<SalaryBonusRecord[]>('salary:bonuses:list', [employeeId, month, year]),
      create: (payload: SalaryBonusInput) => invokeHttpIpc<SalaryBonusRecord | null>('salary:bonuses:create', [payload]),
      delete: (id: string) => invokeHttpIpc<boolean>('salary:bonuses:delete', [id]),
      total: (employeeId: string, month: number, year: number) => invokeHttpIpc<number>('salary:bonuses:total', [employeeId, month, year])
    },
    overtimes: {
      list: (employeeId: string, month: number, year: number) => invokeHttpIpc<SalaryOvertimeRecord[]>('salary:overtimes:list', [employeeId, month, year]),
      create: (payload: SalaryOvertimeInput) => invokeHttpIpc<SalaryOvertimeRecord | null>('salary:overtimes:create', [payload]),
      delete: (id: string) => invokeHttpIpc<boolean>('salary:overtimes:delete', [id]),
      totalHours: (employeeId: string, month: number, year: number) => invokeHttpIpc<number>('salary:overtimes:totalHours', [employeeId, month, year])
    },
    summary: (employeeId: string, month: number, year: number) => invokeHttpIpc<SalarySummary | null>('salary:summary', [employeeId, month, year])
  },
  clients: {
    list: () => invokeHttpIpc<Client[]>('clients:list', []),
    getById: (id: string) => invokeHttpIpc<Client | null>('clients:getById', [id]),
    search: (query: string) => invokeHttpIpc<Client[]>('clients:search', [query]),
    upsert: (client: Client) => invokeHttpIpc<Client | null>('clients:upsert', [client]),
    delete: (id: string) => invokeHttpIpc<boolean>('clients:delete', [id]),
    findOrCreate: (client: Client, preferredId?: string | null) => invokeHttpIpc<Client | null>('clients:findOrCreate', [client, preferredId ?? null])
  },
  invoices: {
    getAll: () => invokeHttpIpc<Invoice[]>('invoices:getAll', []),
    getById: (id: string) => invokeHttpIpc<Invoice | null>('invoices:getById', [id]),
    put: (invoice: Invoice) => invokeHttpIpc<boolean>('invoices:put', [invoice]),
    delete: (id: string) => invokeHttpIpc<boolean>('invoices:delete', [id])
  },
  quotes: {
    getAll: () => invokeHttpIpc<Quote[]>('quotes:getAll', []),
    getById: (id: string) => invokeHttpIpc<Quote | null>('quotes:getById', [id]),
    put: (quote: Quote) => invokeHttpIpc<boolean>('quotes:put', [quote]),
    delete: (id: string) => invokeHttpIpc<boolean>('quotes:delete', [id]),
    convertToInvoice: (id: string) => invokeHttpIpc<SpaQuoteConvertResult>('quotes:convertToInvoice', [id])
  },
  products: {
    list: () => invokeHttpIpc<SpaProductRow[]>('products:list', []),
    listArchived: () => invokeHttpIpc<SpaProductRow[]>('products:listArchived', []),
    metadata: () => invokeHttpIpc<SpaProductMetadata>('products:metadata', []),
    addMetadata: (kind: 'category' | 'serie' | 'color', value: string) => invokeHttpIpc<SpaProductMetadataAddResult>('products:addMetadata', [kind, value]),
    create: (payload: SpaProductCreatePayload) => invokeHttpIpc<SpaProductCreateResult>('products:create', [payload]),
    update: (id: string, payload: SpaProductCreatePayload) => invokeHttpIpc<SpaProductUpdateResult>('products:update', [id, payload]),
    selectImage: () => webSelectProductImage(),
    upsert: (product: SpaProductInput) => invokeHttpIpc<boolean>('products:upsert', [product]),
    delete: (id: string) => invokeHttpIpc<boolean>('products:delete', [id]),
    archive: (id: string) => invokeHttpIpc<SpaProductArchiveResult>('products:archive', [id]),
    restore: (id: string) => invokeHttpIpc<SpaProductRestoreResult>('products:restore', [id]),
    purge: (id: string) => invokeHttpIpc<SpaProductPurgeResult>('products:purge', [id]),
    updatePrice: (productId: string, color: StockColor, newPrice: number, changedBy?: string) => invokeHttpIpc<boolean>('products:updatePrice', [productId, color, newPrice, changedBy]),
    priceHistory: (productId: string, color: StockColor) => invokeHttpIpc<SpaPriceHistoryEntry[]>('products:priceHistory', [productId, color]),
    restorePrice: (productId: string, color: StockColor, targetPrice: number, changedBy?: string) => invokeHttpIpc<boolean>('products:restorePrice', [productId, color, targetPrice, changedBy])
  },
  stock: {
    getAll: () => invokeHttpIpc<SpaStockRow[]>('stock:getAll', []),
    getItems: () => invokeHttpIpc<StockItem[]>('stock:items', []),
    applyMovement: (movement: StockMovement) => invokeHttpIpc<boolean>('stock:applyMovement', [movement]),
    setQty: (productId: string, color: string, qty: number) => invokeHttpIpc<boolean>('stock:setQty', [productId, color, qty]),
    increment: (productId: string, color: string, delta: number) => invokeHttpIpc<boolean>('stock:increment', [productId, color, delta]),
    decrement: (productId: string, color: string, delta: number) => invokeHttpIpc<boolean>('stock:decrement', [productId, color, delta])
  },
  movements: {
    list: () => invokeHttpIpc<StockMovement[]>('movements:list', []),
    add: (movement: StockMovement) => invokeHttpIpc<boolean>('movements:add', [movement])
  },
  inventory: {
    get: () => invokeHttpIpc<SpaInventoryResponse>('inventaire:get', [])
  },
  db: {
    backup: async () => ({ ok: false, message: 'DB_BACKUP_UNAVAILABLE_WEB' } as SpaDbBackupResult),
    listBackups: async () => [] as SpaDbBackupEntry[],
    restore: async () => false
  }
});

export const getWebSpaApi = (): SpaApi => {
  if (!webSpaApiSingleton) {
    webSpaApiSingleton = createWebSpaApi();
  }
  return webSpaApiSingleton;
};
