export interface MasterDocumentRenderOptions {
  root: HTMLElement;
  title: string;
  logTag?: string;
}

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const collectHeadMarkup = (): string => {
  const parts: string[] = [];
  const baseHref = document.baseURI || window.location.href;
  if (baseHref) {
    parts.push(`<base href="${escapeHtml(baseHref)}">`);
  }

  document.querySelectorAll<HTMLStyleElement>('style').forEach((styleEl) => {
    parts.push(styleEl.outerHTML);
  });

  document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((linkEl) => {
    const href = linkEl.getAttribute('href');
    if (!href) return;
    try {
      const absoluteHref = new URL(href, document.baseURI).toString();
      parts.push(`<link rel="stylesheet" href="${escapeHtml(absoluteHref)}">`);
    } catch {
      parts.push(linkEl.outerHTML);
    }
  });

  return parts.join('\n');
};

const waitForImageReady = (image: HTMLImageElement, timeoutMs: number): Promise<void> => new Promise((resolve) => {
  let settled = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const finish = () => {
    if (settled) return;
    settled = true;
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    image.removeEventListener('load', onLoad);
    image.removeEventListener('error', onError);
    resolve();
  };

  const onLoad = () => finish();
  const onError = () => finish();

  timeout = setTimeout(() => finish(), timeoutMs);
  image.addEventListener('load', onLoad, { once: true });
  image.addEventListener('error', onError, { once: true });
});

const toInlineDataUrl = async (
  sourceImage: HTMLImageElement | undefined,
  logTag: string
): Promise<string | null> => {
  if (!sourceImage) return null;
  if (!sourceImage.complete || sourceImage.naturalWidth === 0) {
    await waitForImageReady(sourceImage, 2500);
  }
  if (!sourceImage.complete || sourceImage.naturalWidth === 0) {
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = sourceImage.naturalWidth;
    canvas.height = sourceImage.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(sourceImage, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    const source = sourceImage.currentSrc || sourceImage.src || '';
    if (source.toLowerCase().includes('logospa')) {
      console.log(`[${logTag}] logo inlined as data URL`, { source });
    }
    return dataUrl;
  } catch {
    return null;
  }
};

const absolutizeNodeResources = async (
  snapshotRoot: HTMLElement,
  sourceRoot: HTMLElement,
  logTag: string
): Promise<void> => {
  const sourceImages = Array.from(sourceRoot.querySelectorAll<HTMLImageElement>('img'));
  const snapshotImages = Array.from(snapshotRoot.querySelectorAll<HTMLImageElement>('img'));

  for (let index = 0; index < snapshotImages.length; index += 1) {
    const img = snapshotImages[index];
    const sourceImage = sourceImages[index];

    const inlineDataUrl = await toInlineDataUrl(sourceImage, logTag);
    if (inlineDataUrl) {
      img.setAttribute('src', inlineDataUrl);
      continue;
    }

    const runtimeSrc = sourceImage?.currentSrc || sourceImage?.src || '';
    if (runtimeSrc) {
      img.setAttribute('src', runtimeSrc);
      if (runtimeSrc.toLowerCase().includes('logospa')) {
        console.warn(`[${logTag}] logo fallback source used`, { source: runtimeSrc });
      }
      continue;
    }

    const src = img.getAttribute('src');
    if (!src) continue;
    try {
      const absolute = new URL(src, document.baseURI).toString();
      img.setAttribute('src', absolute);
      if (absolute.toLowerCase().includes('logospa')) {
        console.warn(`[${logTag}] logo absolute source used`, { source: absolute });
      }
    } catch {
      if (src.toLowerCase().includes('logospa')) {
        console.warn(`[${logTag}] logo source unresolved`, { source: src });
      }
    }
  }
};

export const buildMasterDocumentHtml = async (options: MasterDocumentRenderOptions): Promise<string> => {
  const { root, title } = options;
  const logTag = options.logTag || 'invoice-render';

  const snapshot = root.cloneNode(true) as HTMLElement;
  await absolutizeNodeResources(snapshot, root, logTag);

  const headMarkup = collectHeadMarkup();
  const escapedTitle = escapeHtml(title);

  const html = [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${escapedTitle}</title>`,
    headMarkup,
    '</head>',
    '<body>',
    snapshot.outerHTML,
    '</body>',
    '</html>'
  ].join('');

  const hasHeader = snapshot.querySelector('.invoice-header,.top-header') !== null;
  const hasContent = snapshot.querySelector('.invoice-content') !== null;
  const hasFooter = snapshot.querySelector('.invoice-footer') !== null;

  console.log(`[${logTag}] master page layout generated`, {
    title,
    htmlLength: html.length
  });
  console.log(`[${logTag}] header/content/footer structure applied`, {
    hasHeader,
    hasContent,
    hasFooter
  });

  return html;
};
