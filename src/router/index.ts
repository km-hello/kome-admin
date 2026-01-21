import {createRouter, createWebHistory, type Router} from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import {useUserStore} from "@/stores/user.ts";

// 路由懒加载
const Login = () => import('@/views/Login.vue');
const AdminLayout = () => import('@/layout/AdminLayout.vue');
const Dashboard = () => import('@/views/Dashboard.vue');

/**
 * 定义应用的路由配置。
 * 该配置包含多个路由规则，具体包括访客页面、需要认证的页面，以及通用的 404 重定向。
 *
 * 路由结构说明：
 * 1. `path`：路由的路径。
 * 2. `name`：可选，路由的名称，用于标识具体的路由。
 * 3. `component`：对应路径加载的组件。
 * 4. `meta`：元信息，用于存储路由相关的附加信息（如标题、权限控制等）。
 * 5. `children`：嵌套路由，用于表示子页面结构。
 * 6. `redirect`：重定向规则，用于路径跳转。
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
 * 创建并配置一个路由器实例。
 *
 * 该路由器使用 Web 历史模式，并注册了一组预定义的路由。
 *
 * @constant
 * @type {Router}
 */
const router: Router = createRouter({
    history: createWebHistory(),
    routes,
});



router.beforeEach((to, _from, next) => {
    const userStore = useUserStore();

    // 1. 需要登录 但 未登录 -> 去登录页
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
        next('/login');
        return;
    }

    // 2. 已登录 但 访问登录页 -> 去首页
    if (to.path === '/login' && userStore.isLoggedIn) {
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