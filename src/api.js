import axios from 'axios'

const BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:3030')

export async function call(path, opts = {}){
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  try {
    const res = await axios({ url, ...opts });
    return res.data;
  } catch (e) {
    if (e.response) return { error: e.response.data?.error || JSON.stringify(e.response.data) };
    return { error: String(e) };
  }
}

export default { call };
