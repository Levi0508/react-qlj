import React from 'react';
import { LinkFlow, utils } from '@/components/sdkGtjaLinkWeb';
import CustomForm from './CustomForm';
import tokenInterceptor from '@/utils/tokenIntercepter';
// import jwtInterceptor from '@/common/js/jwtInterceptor';
import styles from './index.module.less';
//隔离墙操作变动流程下发测试
// 页面使用tokenInterceptor为每个系统接口增加两个请求头：x-userId、x-userName。和下方x-flow-systemId共3个头必不可少
utils.request.interceptors.request.use(tokenInterceptor, { global: false });
// utils.request.interceptors.request.use(jwtInterceptor, { global: false });

function Ibcm() {

  return (
    <LinkFlow
      // 设置x-flow-systemId
      systemId="IBCM"
      routerPrefix="/ibcm"
      // apiPrefix="/fxpc_flow/flowCommon/flowApi"
      slots={{
        form: <CustomForm />
      }}
      className={styles.root}
    />
  );
}

export default Ibcm;