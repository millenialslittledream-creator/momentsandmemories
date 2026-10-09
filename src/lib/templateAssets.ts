const TEMPLATE_PATH_PREFIX = '/templates/';

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function defaultTemplateAssetBaseUrl(): string {
  const configured = (import.meta.env.VITE_TEMPLATE_ASSET_BASE_URL || '').trim();
  if (configured) return trimTrailingSlashes(configured);

  // Production artwork lives in a public Supabase Storage bucket so the Vite
  // deployment stays below Vercel's source upload limit. Development keeps the
  // checked-in files available under public/templates for offline work.
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  if (!import.meta.env.PROD || !supabaseUrl || supabaseUrl.includes('placeholder')) return '';

  return `${trimTrailingSlashes(supabaseUrl)}/storage/v1/object/public/template-assets`;
}

export function buildTemplateAssetUrl(path: string, baseUrl: string): string {
  if (!path.startsWith(TEMPLATE_PATH_PREFIX) || !baseUrl) return path;

  const relativePath = path
    .slice(TEMPLATE_PATH_PREFIX.length)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${trimTrailingSlashes(baseUrl)}/${relativePath}`;
}

const templateAssetBaseUrl = defaultTemplateAssetBaseUrl();

export function templateAssetUrl(path: string): string {
  return buildTemplateAssetUrl(path, templateAssetBaseUrl);
}
