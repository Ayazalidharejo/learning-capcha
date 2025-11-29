import axios from 'axios'

// By default use same-origin (''), but allow overriding via VITE_API_BASE at build time
const BASE = (import.meta.env.VITE_API_BASE ?? '');

export async function call(path, opts = {}){
  // Build a URL. If BASE is empty we will use a relative path (same-origin) => good for deployments
  if (path.startsWith('http')) return (await axios({ url: path, ...opts })).data;
  const rel = path.startsWith('/') ? path : '/' + path;
  const url = (BASE ? (BASE.replace(/\/$/, '') + rel) : rel);
  try {
    const res = await axios({ url, ...opts });
    return res.data;
  } catch (e) {
    if (e.response) return { error: e.response.data?.error || JSON.stringify(e.response.data) };
    return { error: String(e) };
  }
}

export default { call };
