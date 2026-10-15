import React from 'react';
import withContext from './withContext';

export const LinkFlowContext = React.createContext({});

/**
 * 将流程属性，包括dispatchFlow注入传入组件的props中
 */
export const withFlowContext = withContext(LinkFlowContext);
