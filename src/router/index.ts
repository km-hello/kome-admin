import { createRouter, createWebHistory, type Router } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useUserStore } from "@/stores/user.ts";
import { useSiteStore } from "@/stores/site.ts";

// 路由懒加载
const Login = () => import('@/views/Login.vue');
const AdminLayout = () => import('@/layout/AdminLayout.vue');
const Dashboard = () => import('@/views/Dashboard.vue');
const Tag = () => import('@/views/Tag.vue');
const Link = () => import('@/views/Link.vue');
const Memo = () => import('@/views/Memo.vue');
const Post = () => import('@/views/Post.vue');
const PostEditor = () => import('@/views/PostEditor.vue');
const Settings = () => import('@/views/Settings.vue');

/**
 * 需要刷新统计数据的页面路径
 */
const STATS_DEPENDENT_ROUTES = ['/dashboard', '/posts', '/tags', '/memos', '/links'];

/**
 * 定义应用的路由配置。
 */
const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {
            title: '登录',
            guest: true
        },
    },
    {
        path: '/',
        component: AdminLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: 'dashboard',
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: { title: 'Dashboard' },
            },
            {
                path: 'posts',
                meta: { title: 'Posts' },
                children: [
                    {
                        path: '',
                        name: 'Posts',
                        component: Post,
                        meta: { breadcrumb: false },  // 不单独显示，使用父级的 title
                    },
                    {
                        path: 'new',
                        name: 'PostCreate',
                        component: PostEditor,
                        meta: { title: 'New Post' },
                    },
                    {
                        path: 'edit/:id',
                        name: 'PostEdit',
                        component: PostEditor,
                        meta: { title: 'Edit Post' },
                    },
                ],
            },

            {
                path: 'memos',
                name: 'Memos',
                component: Memo,
                meta: { title: 'Memos' },
            },
            {
                path: 'tags',
                name: 'Tags',
                component: Tag,
                meta: { title: 'Tags' },
            },
            {
                path: 'links',
                name: 'Links',
                component: Link,
                meta: { title: 'Links' },
            },
            {
                path: 'settings',
                name: 'Settings',
                component: Settings,
                meta: { title: 'Settings' },
            },
        ],
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];

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

/**
 * 路由切换后，检查是否需要刷新统计数据
 */
router.afterEach((to) => {
    // 只在需要统计数据的页面检查刷新
    if (STATS_DEPENDENT_ROUTES.includes(to.path)) {
        const siteStore = useSiteStore();

        // 如果数据已失效，自动刷新
        if (siteStore.needsRefresh) {
            siteStore.fetchStats().catch(err => {
                console.error('Failed to refresh stats on route change:', err);
            });
        }
    }
});

export default router;