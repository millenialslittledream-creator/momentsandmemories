import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const BUCKET = 'template-assets';
const SOURCE_DIR = path.resolve('public', 'templates');
const MAX_CONCURRENCY = 5;

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY before running this migration.');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(absolutePath)));
    else if (entry.isFile()) files.push(absolutePath);
  }

  return files;
}

function contentType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      throw new Error(`Unsupported template asset: ${filePath}`);
  }
}

async function ensureBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  const existing = buckets.find((bucket) => bucket.name === BUCKET);
  const options = {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  };

  const { error } = existing
    ? await supabase.storage.updateBucket(BUCKET, options)
    : await supabase.storage.createBucket(BUCKET, options);
  if (error) throw error;
}

async function uploadFile(filePath) {
  const objectPath = path.relative(SOURCE_DIR, filePath).split(path.sep).join('/');
  const body = await readFile(filePath);
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, body, {
    cacheControl: '31536000',
    contentType: contentType(filePath),
    upsert: true,
  });
  if (error) throw new Error(`${objectPath}: ${error.message}`);
  return objectPath;
}

await ensureBucket();
const files = await collectFiles(SOURCE_DIR);
let completed = 0;

for (let index = 0; index < files.length; index += MAX_CONCURRENCY) {
  const batch = files.slice(index, index + MAX_CONCURRENCY);
  await Promise.all(batch.map(uploadFile));
  completed += batch.length;
  process.stdout.write(`Uploaded ${completed}/${files.length}\r`);
}

process.stdout.write(`Uploaded ${files.length} template assets to ${BUCKET}.\n`);
