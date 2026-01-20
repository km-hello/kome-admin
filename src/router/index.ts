import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// 路由懒加载
const Login = () => import('@/views/Login.vue');
const AdminLayout = () => import('@/layout/AdminLayout.vue');
const Dashboard = () => import('@/views/Dashboard.vue');

/**
 * 路由配置
 */
const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {
            title: '登录',
            guest: true  // 标记为访客页面
        },
    },
    {
        path: '/',
        component: AdminLayout,
        meta: { requiresAuth: true },  // 需要登录
        children: [
            {
                path: '',
                redirect: 'dashboard',  // 默认重定向到 dashboard
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: '仪表盘' },
            },
            // 后续可以在这里添加更多子路由
            // { path: 'posts', component: PostList, meta: { title: '文章管理' } },
        ],
    },
    // 404 页面（可选）
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

/**
 * 创建路由实例
 */
const router = createRouter({
    history: createWebHistory(),
    routes,
});

/**
 * 全局前置守卫
 * 功能：检查登录状态，未登录则跳转到登录页
 */
router.beforeEach((to, _from, next) => {
    const token = localStorage.getItem('token');

    // 需要登录但未登录
    if (to.meta.requiresAuth && !token) {
        next('/login');
        return;
    }

    // 已登录访问登录页，重定向到首页
    if (to.path === '/login' && token) {
        next('/');
        return;
    }

    // 设置页面标题
    if (to.meta.title) {
        document.title = `${to.meta.title} - Kome Admin`;
    }

    next();
});

export default router;