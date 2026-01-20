import { createApp } from 'vue'
import App from './App.vue'

// 引入全局样式
import './style.css'
import 'vue-sonner/style.css'
import {createPinia} from "pinia";
import router from "@/router";

// 创建 Vue 应用实例
const app = createApp(App)

// 注册插件
app.use(createPinia())  // 状态管理
app.use(router)         // 路由

// 挂载应用
app.mount('#app')

