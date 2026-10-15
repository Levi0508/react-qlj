// /**
//  * jwt的拦截器，用于设置token，并在所有请求时带上token
//  */

//  import common from './common';
// //  const { getCookies } = common

// const tokenKey = 'dts_access_token';

// const getToken = () => {
//     if(sessionStorage.getItem(tokenKey)) {
//         return sessionStorage.getItem(tokenKey);
//     }
//     // return getCookies("access_token");
// };

// const setToken = (token) => {
//     if(token) {
//         return sessionStorage.setItem(tokenKey, token);
//     }
//     // return sessionStorage.setItem(tokenKey,getCookies("access_token"))
// };

// const jwtInterceptor = (url, options = {}) => {
//     let { headers } = options;
//     if (!headers) headers = {}; 
//     const token = getToken();  
//     if (token && token !== 'null') {
//         headers.Authorization = `Bearer ${token}`;
//         return (
//             {
//                 url,
//                 options: { ...options, headers },
//             }
//         );
//     }
//     return {
//         url,
//         options,
//     };
// };

// jwtInterceptor.tokenKey = tokenKey;
// jwtInterceptor.setToken = setToken;
// jwtInterceptor.getToken = getToken;

// export default jwtInterceptor;