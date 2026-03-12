import { watch } from 'vue';
import type { Ref } from 'vue';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from "@/stores/auth.ts";
import { useSiteStore } from "@/stores/site.ts";
import i18n from "@/i18n";

/**
 * 需要刷新统计数据的页面路径
 */
const STATS_DEPENDENT_ROUTES = ['/dashboard', '/posts', '/tags', '/memos', '/links'];

/**
 * 路由配置表
 *
 * 路由结构：
 *   /login                → Login         登录页
 *   /setup                → Setup         初始化设置页
 *   /                     → AdminLayout   管理后台布局
 *     ├─ /dashboard       → Dashboard     仪表盘
 *     ├─ /posts           → Posts         文章列表
 *     │  ├─ /posts/new    → PostCreate    新建文章
 *     │  └─ /posts/edit/:id → PostEdit    编辑文章
 *     ├─ /memos           → Memos         动态列表
 *     ├─ /tags            → Tags          标签管理
 *     ├─ /links           → Links         友链管理
 *     └─ /settings        → Settings      系统设置
 *   /*                    → Redirect /    404 重定向到首页
 */
const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: {
            title: 'Login',
            guest: true
        },
    },
    {
        path: '/setup',
        name: 'Setup',
        component: () => import('@/views/Setup.vue'),
        meta: {
            title: 'Setup',
            setup: true
        },
    },
    {
        path: '/',
        component: () => import('@/layout/AdminLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: 'dashboard',
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/views/Dashboard.vue'),
                meta: { title: 'Dashboard' },
            },
            {
                path: 'posts',
                meta: { title: 'Posts' },
                children: [
                    {
                        path: '',
                        name: 'Posts',
                        component: () => import('@/views/Post.vue'),
                        meta: { breadcrumb: false },
                    },
                    {
                        path: 'new',
                        name: 'PostCreate',
                        component: () => import('@/views/PostEditor.vue'),
                        meta: { title: 'New Post' },
                    },
                    {
                        path: 'edit/:id',
                        name: 'PostEdit',
                        component: () => import('@/views/PostEditor.vue'),
                        meta: { title: 'Edit Post' },
                    },
                ],
            },

            {
                path: 'memos',
                name: 'Memos',
                component: () => import('@/views/Memo.vue'),
                meta: { title: 'Memos' },
            },
            {
                path: 'tags',
                name: 'Tags',
                component: () => import('@/views/Tag.vue'),
                meta: { title: 'Tags' },
            },
            {
                path: 'links',
                name: 'Links',
                component: () => import('@/views/Link.vue'),
                meta: { title: 'Links' },
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('@/views/Settings.vue'),
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
    history: createWebHistory('/admin'),
    routes,
});

/**
 * 根据路由 meta.title 和当前语言设置页面标题。
 * 将 meta.title 转为 nav.{title} 翻译键，翻译失败时回退到原始英文值。
 */
function updateDocumentTitle(title?: string) {
    if (title) {
        const titleKey = `nav.${title.toLowerCase()}`;
        const translated = i18n.global.t(titleKey);
        document.title = `${translated !== titleKey ? translated : title} - ${i18n.global.t('brand.name')}`;
    }
}

/**
 * 路由前置守卫：处理认证和初始化检查
 */
router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore();
    const siteStore = useSiteStore();

    // 首次加载时先检查初始化状态，避免冷启动直达 /setup 时绕过判断
    if (siteStore.initialized === null) {
        await siteStore.checkInitialized();
    }

    // 未初始化 → 强制去 /setup
    if (siteStore.initialized === false && to.path !== '/setup') {
        next('/setup');
        return;
    }

    // 已初始化 → 不能访问 /setup
    if (siteStore.initialized === true && to.path === '/setup') {
        next('/login');
        return;
    }

    // 需要登录的页面在放行前做一次静默会话校验，避免过期 token 先渲染后台页
    if (to.meta.requiresAuth) {
        if (!authStore.hasToken) {
            next('/login');
            return;
        }

        const isValidSession = await authStore.validateSession();
        if (!isValidSession) {
            next('/login');
            return;
        }
    }

    // 有 token 时访问登录页，先验证会话；有效则回首页，无效则留在登录页
    if (to.path === '/login' && authStore.hasToken) {
        const isValidSession = await authStore.validateSession();
        if (isValidSession) {
            next('/');
            return;
        }
    }

    // 设置页面标题
    updateDocumentTitle(to.meta.title as string);

    next();
});

/**
 * 路由后置守卫：检查是否需要刷新统计数据
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

/**
 * 监听语言切换：实时更新当前页面标题（不依赖路由跳转）
 */
const localeRef = i18n.global.locale as unknown as Ref<string>;
watch(localeRef, () => {
    const currentTitle = router.currentRoute.value.meta.title as string;
    updateDocumentTitle(currentTitle);
});

export default router;
