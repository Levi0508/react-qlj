import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';

export default props => {
  return (
    // antd 提供了一个 React 组件 ConfigProvider 用于全局配置国际化文案。全局配置antd组件为中文。
    <ConfigProvider locale={zhCN}>
      <div className="icestark-child-app">
        {props.children}
      </div>
    </ConfigProvider>
  );
};
