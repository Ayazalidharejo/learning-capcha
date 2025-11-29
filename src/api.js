// // import axios from 'axios'

// // // By default use same-origin (''), but allow overriding via VITE_API_BASE at build time
// // const BASE = (import.meta.env.VITE_API_BASE ?? '');

// // export async function call(path, opts = {}){
// //   // Build a URL. If BASE is empty we will use a relative path (same-origin) => good for deployments
// //   if (path.startsWith('http')) return (await axios({ url: path, ...opts })).data;
// //   const rel = path.startsWith('/') ? path : '/' + path;
// //   const url = (BASE ? (BASE.replace(/\/$/, '') + rel) : rel);
// //   try {
// //     const res = await axios({ url, ...opts });
// //     return res.data;
// //   } catch (e) {
// //     if (e.response) return { error: e.response.data?.error || JSON.stringify(e.response.data) };
// //     return { error: String(e) };
// //   }
// // }

// // export default { call };
// import axios from 'axios'

// // Get backend URL from environment
// const BASE = import.meta.env.VITE_API_BASE || '';

// console.log('🔗 API Base URL:', BASE || 'Same Origin (/)');

// export async function call(path, opts = {}) {
//   // Build full URL
//   const fullPath = path.startsWith('http') 
//     ? path 
//     : (BASE ? BASE.replace(/\/$/, '') + path : path);
  
//   console.log('📡 API Call:', opts.method || 'GET', fullPath);

//   try {
//     const config = {
//       url: fullPath,
//       method: opts.method || 'GET',
//       ...(opts.data && { data: opts.data }),
//       headers: {
//         'Content-Type': 'application/json',
//         ...(opts.headers || {})
//       },
//       timeout: 30000 // 30 seconds timeout
//     };

//     const res = await axios(config);
//     console.log('✅ API Response:', res.status, res.data);
//     return res.data;
    
//   } catch (e) {
//     console.error('❌ API Error:', e.message);
    
//     if (e.response) {
//       // Server responded with error status
//       console.error('Response error:', e.response.status, e.response.data);
//       const errorMsg = e.response.data?.error || e.response.data?.message || 'Server error';
//       return { error: errorMsg, status: e.response.status };
//     } else if (e.request) {
//       // Request made but no response
//       console.error('No response from server');
//       return { error: 'Cannot reach server. Please check your connection.' };
//     } else {
//       // Error in request setup
//       console.error('Request setup error:', e.message);
//       return { error: e.message };
//     }
//   }
// }

// export default { call };
import axios from 'axios';

// Backend URL - environment variable se milega
const getBaseURL = () => {
  // 1st priority: Environment variable
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // 2nd priority: Agar production mein deployed hai
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://learning-capcha-backend.vercel.app';
  }
  
  // 3rd priority: Local development
  return 'http://localhost:3030';
};

const BASE_URL = getBaseURL();

// Console mein dikhaega ki kaunsa URL use ho raha hai
console.log('🔗 Backend URL:', BASE_URL);

// API call function
export async function call(path, opts = {}) {
  // Full URL bana lo
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  
  console.log('📡 Request:', opts.method || 'GET', url);

  try {
    const response = await axios({
      url,
      method: opts.method || 'GET',
      data: opts.data,
      headers: {
        'Content-Type': 'application/json',
        ...opts.headers
      },
      timeout: 30000
    });

    console.log('✅ Response:', response.data);
    return response.data;

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Agar server ne response diya (400, 500, etc.)
    if (error.response) {
      return { 
        error: error.response.data?.error || 'Server error',
        status: error.response.status 
      };
    }

    // Agar server tak request nahi pohchi
    return { error: 'Cannot connect to server' };
  }
}

export default { call };