/**
 * jwt的拦截器，用于设置token，并在所有请求时带上token
 */
import store from '@/store';
import { RequestOptionsInit } from 'umi-request';

// const tokenKey = 'token';

// const getToken = () => {
//     if (sessionStorage.getItem(tokenKey)) {
//         return sessionStorage.getItem(tokenKey);
//     }
//     // return getCookies("access_token");
// };

const tokenInterceptor = (url: string, options: RequestOptionsInit) => {
    const userInfo = store.getModelState('user');
    let { headers } = options;
    if (!headers) headers = {};
    // const token = getToken();
    // if (token && token !== 'null') {
    //     headers['Authorization'] = `Bearer ${token}`;
    // }
    headers['x-userId'] = userInfo.userId;
    headers['x-userName'] = userInfo.displayName;
    return {
        url,
        options,
    };
};

export default tokenInterceptor;