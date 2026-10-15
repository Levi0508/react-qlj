import { IRouterConfig } from 'ice';
import { renderNotFound, isInIcestark } from '@ice/stark-app';
import BasicLayout from '@/layouts/BasicLayout';
import NotFound from '@/components/NotFound';

import Ibcm001 from './pages/ibcm001';
import Ibcm002 from './pages/ibcm002';
import Ibcm003 from './pages/ibcm003';
import Ibcm004 from './pages/ibcm004';

const routerConfig: IRouterConfig[] = [
  {
    path: '/',
    component: BasicLayout,
    children: [
      {
        path: '/ibcm/IBCM001',
        exact: true,
        component: Ibcm001,
      },
      {
        path: '/ibcm/IBCM002',
        exact: true,
        component: Ibcm002,
      },
      {
        path: '/ibcm/IBCM003',
        exact: true,
        component: Ibcm003,
      },
      {
        path: '/ibcm/IBCM004',
        exact: true,
        component: Ibcm004,
      },
      {
        // 微应用独立运行 404 路由渲染 NotFound 组件
        component: isInIcestark() ? () => renderNotFound() : NotFound,
      },
    ],
  },
];

export default routerConfig;
