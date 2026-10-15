/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import { extend } from 'umi-request';

import linkInterceptor from './interceptors/linkInterceptor';

/**
 * 配置request请求时的默认参数
 */

const request = extend({
  credentials: 'include', // 默认请求是否带上cookie
});

// 注册拦截器
request.interceptors.request.use(linkInterceptor.systemIdInterceptor, {global: false});

export default request;
