import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { path: '/', component: '@/pages/index', exact: true },
    { path: '/wallPaper', component: '@/pages/wallPaper/index' },
  ],
  fastRefresh: {},
});
