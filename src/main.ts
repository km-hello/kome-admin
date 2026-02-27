/**
 * main.ts - 应用入口
 *
 * 职责：创建 Vue 应用实例，注册全局插件（Pinia、Vue Router），挂载至 DOM。
 */

import { createApp } from 'vue'
import {createPinia} from "pinia";
import App from './App.vue'
import router from "@/router";
/** 引入全局样式 */
import './style.css'
import 'vue-sonner/style.css'

/** 创建 Vue 应用实例 */
const app = createApp(App)
const pinia = createPinia();

/** 注册插件 */
app.use(pinia)  // 状态管理
app.use(router)  // 路由

/** 挂载应用 */
app.mount('#app')

