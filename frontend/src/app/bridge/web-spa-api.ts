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
import type { MyTaskUpdateInput, TaskNotificationRecord, TaskRecord, TaskUpsertInput } from '../models/task.models';

const WEB_TOKEN_KEY = 'spa:web-http-token';
let webSpaApiSingleton: SpaApi | null = null;
const AUTH_LOGIN_URL = '/api/auth/login';
const AUTH_SETUP_PASSWORD_URL = '/api/auth/setup-password';
const AUTH_ME_URL = '/api/auth/me';
const AUTH_LOGOUT_URL = '/api/auth/logout';
const AUTH_PERMISSIONS_URL = '/api/auth/permissions';
const AUTH_RESET_PASSWORD_URL = '/api/auth/reset-password';
const CLIENTS_URL = '/api/clients';
const INVOICES_URL = '/api/invoices';
const QUOTES_URL = '/api/quotes';
const PRODUCTS_URL = '/api/products';
const STOCK_URL = '/api/stock';
const MOVEMENTS_URL = '/api/movements';
const EMPLOYEES_URL = '/api/employees';
const TASKS_URL = '/api/tasks';
const MY_TASKS_URL = '/api/my-tasks';
const TASK_NOTIFICATIONS_URL = '/api/task-notifications';
const SALARY_URL = '/api/salary';
const INVENTORY_URL = '/api/inventory';

type AuthLikeResult = AuthBeginLoginResult & { token?: string };

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

const buildAuthedEventSourceUrl = (url: string): string => {
  const token = getToken();
  if (!token) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
};

const stripTokenFromAuthResult = (result: AuthLikeResult): AuthBeginLoginResult => {
  const { token: _token, ...next } = result;
  return next;
};

const invokeWebApiRequest = async <T>(
  url: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; body?: unknown; withAuth?: boolean } = {}
): Promise<T> => {
  const token = getToken();
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.withAuth && token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) })
  });

  let payload: { success?: boolean; result?: T; message?: string } | T | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401) {
    setToken(null);
  }

  if (!response.ok) {
    const failureMessage = payload && typeof payload === 'object' && 'message' in payload
      ? String(payload.message || '')
      : '';
    throw new Error(failureMessage || `AUTH_HTTP_FAILED:${url}`);
  }

  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (!payload.success) {
      throw new Error(payload.message || `AUTH_HTTP_FAILED:${url}`);
    }
    return payload.result as T;
  }

  return payload as T;
};

const buildSalaryScopeQuery = (employeeId: string, month: number, year: number): string => {
  const params = new URLSearchParams({
    employeeId,
    month: String(month),
    year: String(year)
  });
  return params.toString();
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
  const prefix = options.docType === 'invoice'
    ? 'facture'
    : options.docType === 'quote'
      ? 'devis'
      : 'inventaire';
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
    const orientation = options.pageOrientation === 'landscape' ? 'landscape' : 'portrait';
    const pageWidth = orientation === 'landscape' ? '297mm' : '210mm';
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
    stage.style.width = pageWidth;
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
        jsPDF: { unit: 'mm', format: 'a4', orientation },
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
      const result = await invokeWebApiRequest<AuthLikeResult>(AUTH_LOGIN_URL, {
        method: 'POST',
        body: { identity: username, password }
      });
      if (result?.status !== 'success' || !result.user) return null;
      if (result.token) setToken(result.token);
      return result.user;
    },
    beginLogin: async (identity: string, password: string, context?: AuthFlowContext | null) => {
      const result = await invokeWebApiRequest<AuthLikeResult>(AUTH_LOGIN_URL, {
        method: 'POST',
        body: { identity, password }
      });
      if (result?.status === 'success' && result?.token) {
        setToken(result.token);
      }
      return stripTokenFromAuthResult(result);
    },
    setupProtectedPassword: async (email: string, newPassword: string, context?: AuthFlowContext | null) =>
      invokeWebApiRequest<AuthPasswordActionResult>(AUTH_SETUP_PASSWORD_URL, {
        method: 'POST',
        body: { email, newPassword }
      }),
    logout: async () => {
      try {
        await invokeWebApiRequest<boolean>(AUTH_LOGOUT_URL, {
          method: 'POST',
          withAuth: true
        });
      } finally {
        setToken(null);
      }
      return true;
    },
    getCurrentUser: async () => {
      const result = await invokeWebApiRequest<AppUser | null>(AUTH_ME_URL, {
        method: 'GET',
        withAuth: true
      });
      if (!result) {
        setToken(null);
      }
      return result;
    },
    hasPermission: (permissionKey: keyof PermissionSet) =>
      invokeWebApiRequest<boolean>(`${AUTH_PERMISSIONS_URL}/${encodeURIComponent(permissionKey)}`, {
        method: 'GET',
        withAuth: true
      }),
    resetPassword: (employeeId: string, newPassword: string) =>
      invokeWebApiRequest<boolean>(AUTH_RESET_PASSWORD_URL, {
        method: 'POST',
        body: { employeeId, newPassword },
        withAuth: true
      })
  },
  clients: {
    list: () => invokeWebApiRequest<Client[]>(CLIENTS_URL, { method: 'GET', withAuth: true }),
    getById: (id: string) => invokeWebApiRequest<Client | null>(`${CLIENTS_URL}/${encodeURIComponent(id)}`, { method: 'GET', withAuth: true }),
    search: (query: string) => invokeWebApiRequest<Client[]>(`${CLIENTS_URL}/search?q=${encodeURIComponent(query)}`, { method: 'GET', withAuth: true }),
    upsert: (client: Client) => {
      const clientId = String(client?.id ?? '').trim();
      if (clientId) {
        return invokeWebApiRequest<Client | null>(`${CLIENTS_URL}/${encodeURIComponent(clientId)}`, {
          method: 'PUT',
          body: client,
          withAuth: true
        });
      }
      return invokeWebApiRequest<Client | null>(CLIENTS_URL, {
        method: 'POST',
        body: client,
        withAuth: true
      });
    },
    delete: (id: string) => invokeWebApiRequest<boolean>(`${CLIENTS_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      withAuth: true
    }),
    findOrCreate: (client: Client, preferredId?: string | null) =>
      invokeWebApiRequest<Client | null>(`${CLIENTS_URL}/find-or-create`, {
        method: 'POST',
        body: { client, preferredId: preferredId ?? null },
        withAuth: true
      })
  },
  invoices: {
    getAll: () => invokeWebApiRequest<Invoice[]>(INVOICES_URL, { method: 'GET', withAuth: true }),
    getById: (id: string) => invokeWebApiRequest<Invoice | null>(`${INVOICES_URL}/${encodeURIComponent(id)}`, { method: 'GET', withAuth: true }),
    put: (invoice: Invoice) => {
      const invoiceId = String(invoice?.id ?? '').trim();
      if (invoiceId) {
        return invokeWebApiRequest<boolean>(`${INVOICES_URL}/${encodeURIComponent(invoiceId)}`, {
          method: 'PUT',
          body: invoice,
          withAuth: true
        });
      }
      return invokeWebApiRequest<boolean>(INVOICES_URL, {
        method: 'POST',
        body: invoice,
        withAuth: true
      });
    },
    delete: (id: string) => invokeWebApiRequest<boolean>(`${INVOICES_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      withAuth: true
    })
  },
  employees: {
    list: () => invokeWebApiRequest<EmployeeRecord[]>(EMPLOYEES_URL, { method: 'GET', withAuth: true }),
    search: (query: string) => invokeWebApiRequest<EmployeeRecord[]>(`${EMPLOYEES_URL}/search?q=${encodeURIComponent(query)}`, { method: 'GET', withAuth: true }),
    getById: (id: string) => invokeWebApiRequest<EmployeeRecord | null>(`${EMPLOYEES_URL}/${encodeURIComponent(id)}`, { method: 'GET', withAuth: true }),
    create: (payload: EmployeeUpsertInput) => invokeWebApiRequest<EmployeeRecord | null>(EMPLOYEES_URL, {
      method: 'POST',
      body: payload,
      withAuth: true
    }),
    update: (id: string, payload: EmployeeUpsertInput) => invokeWebApiRequest<EmployeeRecord | null>(`${EMPLOYEES_URL}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
      withAuth: true
    }),
    delete: (id: string) => invokeWebApiRequest<boolean>(`${EMPLOYEES_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      withAuth: true
    }),
    setActive: (id: string, actif: boolean) => invokeWebApiRequest<boolean>(`${EMPLOYEES_URL}/${encodeURIComponent(id)}/active`, {
      method: 'PATCH',
      body: { actif },
      withAuth: true
    })
  },
  tasks: {
    list: (filters?: { employeeId?: string; status?: string; priority?: string }) => {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.set('employeeId', filters.employeeId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.priority) params.set('priority', filters.priority);
      const query = params.toString();
      const url = query ? `${TASKS_URL}?${query}` : TASKS_URL;
      return invokeWebApiRequest<TaskRecord[]>(url, { method: 'GET', withAuth: true });
    },
    getById: (id: string) => invokeWebApiRequest<TaskRecord | null>(`${TASKS_URL}/${encodeURIComponent(id)}`, { method: 'GET', withAuth: true }),
    create: (payload: TaskUpsertInput) => invokeWebApiRequest<TaskRecord | null>(TASKS_URL, {
      method: 'POST',
      body: payload,
      withAuth: true
    }),
    update: (id: string, payload: TaskUpsertInput) => invokeWebApiRequest<TaskRecord | null>(`${TASKS_URL}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
      withAuth: true
    }),
    delete: (id: string) => invokeWebApiRequest<boolean>(`${TASKS_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      withAuth: true
    })
  },
  myTasks: {
    list: (filters?: { status?: string; priority?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.priority) params.set('priority', filters.priority);
      const query = params.toString();
      const url = query ? `${MY_TASKS_URL}?${query}` : MY_TASKS_URL;
      return invokeWebApiRequest<TaskRecord[]>(url, { method: 'GET', withAuth: true });
    },
    getById: (id: string) => invokeWebApiRequest<TaskRecord | null>(`${MY_TASKS_URL}/${encodeURIComponent(id)}`, { method: 'GET', withAuth: true }),
    update: (id: string, payload: MyTaskUpdateInput) => invokeWebApiRequest<TaskRecord | null>(`${MY_TASKS_URL}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: payload,
      withAuth: true
    })
  },
  taskNotifications: {
    list: (limit = 20) => invokeWebApiRequest<TaskNotificationRecord[]>(`${TASK_NOTIFICATIONS_URL}?limit=${encodeURIComponent(String(limit))}`, {
      method: 'GET',
      withAuth: true
    }),
    markRead: (id: string) => invokeWebApiRequest<TaskNotificationRecord | null>(`${TASK_NOTIFICATIONS_URL}/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      withAuth: true
    }),
    onMessage: (listener: (notification: TaskNotificationRecord) => void) => {
      if (!hasWindow() || typeof EventSource === 'undefined') {
        return () => {};
      }

      const source = new EventSource(buildAuthedEventSourceUrl(`${TASK_NOTIFICATIONS_URL}/stream`));
      const onNotification = (event: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(event.data) as TaskNotificationRecord;
          listener(payload);
        } catch {
          // ignore malformed payloads
        }
      };

      source.addEventListener('task-notification', onNotification as EventListener);
      source.onerror = () => {
        // Let EventSource handle auto-reconnect.
      };

      return () => {
        source.removeEventListener('task-notification', onNotification as EventListener);
        source.close();
      };
    }
  },
  salary: {
    advances: {
      list: (employeeId: string, month: number, year: number) => invokeWebApiRequest<SalaryAdvanceRecord[]>(`${SALARY_URL}/advances?${buildSalaryScopeQuery(employeeId, month, year)}`, {
        method: 'GET',
        withAuth: true
      }),
      create: (payload: SalaryAdvanceInput) => invokeWebApiRequest<SalaryAdvanceRecord | null>(`${SALARY_URL}/advances`, {
        method: 'POST',
        body: payload,
        withAuth: true
      }),
      delete: (id: string) => invokeWebApiRequest<boolean>(`${SALARY_URL}/advances/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        withAuth: true
      }),
      total: (employeeId: string, month: number, year: number) => invokeWebApiRequest<number>(`${SALARY_URL}/advances/total?${buildSalaryScopeQuery(employeeId, month, year)}`, {
        method: 'GET',
        withAuth: true
      })
    },
    bonuses: {
      list: (employeeId: string, month: number, year: number) => invokeWebApiRequest<SalaryBonusRecord[]>(`${SALARY_URL}/bonuses?${buildSalaryScopeQuery(employeeId, month, year)}`, {
        method: 'GET',
        withAuth: true
      }),
      create: (payload: SalaryBonusInput) => invokeWebApiRequest<SalaryBonusRecord | null>(`${SALARY_URL}/bonuses`, {
        method: 'POST',
        body: payload,
        withAuth: true
      }),
      delete: (id: string) => invokeWebApiRequest<boolean>(`${SALARY_URL}/bonuses/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        withAuth: true
      }),
      total: (employeeId: string, month: number, year: number) => invokeWebApiRequest<number>(`${SALARY_URL}/bonuses/total?${buildSalaryScopeQuery(employeeId, month, year)}`, {
        method: 'GET',
        withAuth: true
      })
    },
    overtimes: {
      list: (employeeId: string, month: number, year: number) => invokeWebApiRequest<SalaryOvertimeRecord[]>(`${SALARY_URL}/overtimes?${buildSalaryScopeQuery(employeeId, month, year)}`, {
        method: 'GET',
        withAuth: true
      }),
      create: (payload: SalaryOvertimeInput) => invokeWebApiRequest<SalaryOvertimeRecord | null>(`${SALARY_URL}/overtimes`, {
        method: 'POST',
        body: payload,
        withAuth: true
      }),
      delete: (id: string) => invokeWebApiRequest<boolean>(`${SALARY_URL}/overtimes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        withAuth: true
      }),
      totalHours: (employeeId: string, month: number, year: number) => invokeWebApiRequest<number>(`${SALARY_URL}/overtimes/total-hours?${buildSalaryScopeQuery(employeeId, month, year)}`, {
        method: 'GET',
        withAuth: true
      })
    },
    summary: (employeeId: string, month: number, year: number) => invokeWebApiRequest<SalarySummary | null>(`${SALARY_URL}/summary?${buildSalaryScopeQuery(employeeId, month, year)}`, {
      method: 'GET',
      withAuth: true
    })
  },
  quotes: {
    getAll: () => invokeWebApiRequest<Quote[]>(QUOTES_URL, { method: 'GET', withAuth: true }),
    getById: (id: string) => invokeWebApiRequest<Quote | null>(`${QUOTES_URL}/${encodeURIComponent(id)}`, { method: 'GET', withAuth: true }),
    put: (quote: Quote) => {
      const quoteId = String(quote?.id ?? '').trim();
      if (quoteId) {
        return invokeWebApiRequest<boolean>(`${QUOTES_URL}/${encodeURIComponent(quoteId)}`, {
          method: 'PUT',
          body: quote,
          withAuth: true
        });
      }
      return invokeWebApiRequest<boolean>(QUOTES_URL, {
        method: 'POST',
        body: quote,
        withAuth: true
      });
    },
    delete: (id: string) => invokeWebApiRequest<boolean>(`${QUOTES_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      withAuth: true
    }),
    convertToInvoice: (id: string) => invokeWebApiRequest<SpaQuoteConvertResult>(`${QUOTES_URL}/${encodeURIComponent(id)}/convert-to-invoice`, {
      method: 'POST',
      withAuth: true
    })
  },
  products: {
    list: () => invokeWebApiRequest<SpaProductRow[]>(PRODUCTS_URL, { method: 'GET', withAuth: true }),
    listArchived: () => invokeWebApiRequest<SpaProductRow[]>(`${PRODUCTS_URL}/archived`, { method: 'GET', withAuth: true }),
    metadata: () => invokeWebApiRequest<SpaProductMetadata>(`${PRODUCTS_URL}/metadata`, { method: 'GET', withAuth: true }),
    addMetadata: (kind: 'category' | 'serie' | 'color', value: string) => invokeWebApiRequest<SpaProductMetadataAddResult>(`${PRODUCTS_URL}/metadata`, {
      method: 'POST',
      body: { kind, value },
      withAuth: true
    }),
    create: (payload: SpaProductCreatePayload) => invokeWebApiRequest<SpaProductCreateResult>(PRODUCTS_URL, {
      method: 'POST',
      body: payload,
      withAuth: true
    }),
    update: (id: string, payload: SpaProductCreatePayload) => invokeWebApiRequest<SpaProductUpdateResult>(`${PRODUCTS_URL}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
      withAuth: true
    }),
    selectImage: () => webSelectProductImage(),
    upsert: (product: SpaProductInput) => invokeWebApiRequest<boolean>(`${PRODUCTS_URL}/upsert`, {
      method: 'POST',
      body: product,
      withAuth: true
    }),
    delete: (id: string) => invokeWebApiRequest<boolean>(`${PRODUCTS_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      withAuth: true
    }),
    archive: (id: string) => invokeWebApiRequest<SpaProductArchiveResult>(`${PRODUCTS_URL}/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      withAuth: true
    }),
    restore: (id: string) => invokeWebApiRequest<SpaProductRestoreResult>(`${PRODUCTS_URL}/${encodeURIComponent(id)}/restore`, {
      method: 'POST',
      withAuth: true
    }),
    purge: (id: string) => invokeWebApiRequest<SpaProductPurgeResult>(`${PRODUCTS_URL}/${encodeURIComponent(id)}/purge`, {
      method: 'DELETE',
      withAuth: true
    }),
    updatePrice: (productId: string, color: StockColor, newPrice: number, changedBy?: string) => invokeWebApiRequest<boolean>(`${PRODUCTS_URL}/${encodeURIComponent(productId)}/price`, {
      method: 'PATCH',
      body: { color, newPrice, changedBy },
      withAuth: true
    }),
    priceHistory: (productId: string, color: StockColor) => invokeWebApiRequest<SpaPriceHistoryEntry[]>(`${PRODUCTS_URL}/${encodeURIComponent(productId)}/price-history?color=${encodeURIComponent(color)}`, {
      method: 'GET',
      withAuth: true
    }),
    restorePrice: (productId: string, color: StockColor, targetPrice: number, changedBy?: string) => invokeWebApiRequest<boolean>(`${PRODUCTS_URL}/${encodeURIComponent(productId)}/restore-price`, {
      method: 'POST',
      body: { color, targetPrice, changedBy },
      withAuth: true
    })
  },
  stock: {
    getAll: () => invokeWebApiRequest<SpaStockRow[]>(STOCK_URL, { method: 'GET', withAuth: true }),
    getItems: () => invokeWebApiRequest<StockItem[]>(`${STOCK_URL}/items`, { method: 'GET', withAuth: true }),
    applyMovement: (movement: StockMovement) => invokeWebApiRequest<boolean>(`${STOCK_URL}/movements`, {
      method: 'POST',
      body: movement,
      withAuth: true
    }),
    setQty: (productId: string, color: string, qty: number) => invokeWebApiRequest<boolean>(`${STOCK_URL}/${encodeURIComponent(productId)}/${encodeURIComponent(color)}/set-qty`, {
      method: 'PATCH',
      body: { qty },
      withAuth: true
    }),
    increment: (productId: string, color: string, delta: number) => invokeWebApiRequest<boolean>(`${STOCK_URL}/${encodeURIComponent(productId)}/${encodeURIComponent(color)}/increment`, {
      method: 'PATCH',
      body: { delta },
      withAuth: true
    }),
    decrement: (productId: string, color: string, delta: number) => invokeWebApiRequest<boolean>(`${STOCK_URL}/${encodeURIComponent(productId)}/${encodeURIComponent(color)}/decrement`, {
      method: 'PATCH',
      body: { delta },
      withAuth: true
    })
  },
  movements: {
    list: () => invokeWebApiRequest<StockMovement[]>(MOVEMENTS_URL, { method: 'GET', withAuth: true }),
    add: (movement: StockMovement) => invokeWebApiRequest<boolean>(MOVEMENTS_URL, {
      method: 'POST',
      body: movement,
      withAuth: true
    })
  },
  inventory: {
    get: () => invokeWebApiRequest<SpaInventoryResponse>(INVENTORY_URL, {
      method: 'GET',
      withAuth: true
    })
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

export const getWebAppApi = getWebSpaApi;
