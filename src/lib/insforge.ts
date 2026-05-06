import { createClient } from '@insforge/sdk';

const rawBaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '';

export const insforge = createClient({
  baseUrl,
  anonKey,
});

export { baseUrl, anonKey };