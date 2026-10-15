// src/models/user.ts
import { request } from 'ice';

export default {
  // 定义 model 的初始 state
  state: {
    userId: '',
    username: '',
    displayName: ''
  },

  // 定义改变该模型状态的纯函数
  reducers: {
    update(prevState, payload) {
      return {
        ...prevState,
        ...payload,
      };
    },
  },

//   // 定义处理该模型副作用的函数
//   effects: (dispatch) => ({
//     async getUser(token) {
//       const userInfo = await request({
//         url: '/check_token',
//         instanceName: 'oauth',
//         method: 'get',
//         params: {
//           token: token,
//         }
//       });
//       dispatch.user.update({
//         username: userInfo.username,
//         userId: userInfo.user_id,
//         displayName: userInfo.display_name,
//       });
//     }
//   }),
};