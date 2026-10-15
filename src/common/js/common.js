// import jwtInterceptor from './jwtInterceptor';
// /**
//  * 获取cookie的方法
//  */
// const getCookies = (key) => {
//   let array = document.cookie.split(";");
//   let result = "";
//   for (let i = 0; i < array.length; i++){
//     let cookie = array[i].split("=");
//     if (key == cookie[0].replace(/^\s*|\s*$/g,"")) {
//       result = cookie[1].replace(/^\s*|\s*$/g,"");
//       break;
//     }
//   }
//   return result;
// }

// /**
//  * 获取url上的token
//  * 通用
//  * @param paraName 
//  * @returns 
//  */
// const getToken = (paraName = 'access_token')=> { 
//     var url = document.location.toString();
//     var arrObj = url.split('?');
//     let token;
//     if (arrObj.length > 1) {
//         var arrPara = arrObj[1].split('&');
//         let arr;
//         for (var i = 0; i < arrPara.length; i++) {
//             arr = arrPara[i].split('=');
//             if (arr != null && arr[0] == paraName) {
//                 token = arr[1];
//             }
//         }
//         if (token) {
//             jwtInterceptor.setToken(token);
//         } else {
//             token = jwtInterceptor.getToken(paraName);
//         }
//     } else {
//         token = jwtInterceptor.getToken(paraName)
//     }
//     return token;
// }

// const common = () => {

// }
// common.getCookies = getCookies
// common.getToken = getToken
// export default common;