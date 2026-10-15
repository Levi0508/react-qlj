/*
 * @Author: 114398 chenhaiyang@gtht.com  
 * @Date: 2025-10-30 10:33:48 方法
 * @LastEditors: 114398 chenhaiyang@gtht.com
 * @LastEditTime: 2026-06-02 20:28:54
 * @FilePath: \ibcm-flow-ui-pro\src\app.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { runApp, IAppConfig } from 'ice';
import { parse } from 'qs';
import axios from "axios";

const appConfig: IAppConfig = {
  app: {
    getInitialData: async () => {
      const params = parse(window.location.href.split('?')[1]) || {};
      let url = '?';
      for (let key in params) {
        if ('access_token' == key) {
          continue;
        }
        url += key + '=' + params[key] + '&'
      }
      url = url.substring(0, url.length - 1);
      // 隐藏url里的token11

      window.history.replaceState(null, '', window.location.origin + window.location.pathname + url);
      let access_token = params.access_token;
      if (!access_token) {
        access_token = sessionStorage.getItem("token")
      } else {
        sessionStorage.setItem("token", access_token);
      }
      const piid = params.piid;
      sessionStorage.setItem("piid", piid);

      // const userInfo = await axios.get("/oauth/check_token", {
      //   params: {
      //     token: access_token
      //   }
      // });
      // return {
      //   initialStates: {
      //     // 返回后保存到名为user的model
      //     user: {
      //       userId: userInfo.data.user_id,
      //       username: userInfo.data.username,
      //       displayName: encodeURI(userInfo.data.display_name),
      //     }
      //   }
      // }
      // 开发时无需调用，可直接把user信息写死
      return {
        initialStates: {
          // 返回后保存到名为user的model
          user: {
            userId: '018152', // 112065
            username: 'huangzhichang',
            displayName: encodeURI('黄志昌'),
          }
          // user: {
          //     userId: '035937', // 114398
          //     username: 'chenhaiyang',
          //     displayName: encodeURI('陈海洋'),
          //   }
        }
      }
    }
  },
  router: {
    type: 'browser',
  },
  icestark: {
    type: 'child',
  },
  request: [{
    baseURL: '/ibcm_flow',
    // 拦截器
    interceptors: {
      request: {
        onConfig: (config) => {
          // 发送请求前：可以对 RequestConfig 做一些统一处理
          // const [userState, userDispatchers] = store.useModel('user');
          return config;
        },
        onError: (error) => {
          return Promise.reject(error);
        },
      },
      response: {
        onConfig: (response) => {
          // 请求成功：可以做全局的 toast 展示，或者对 response 做一些格式化
          if (response.status !== 200) {
            alert('请求失败');
          }
          return response;
        },
        onError: (error) => {
          // 请求出错：服务端返回错误状态码
          console.log(error);
          return Promise.reject(error);
        },
      },
    },
  }]
};

runApp(appConfig);
