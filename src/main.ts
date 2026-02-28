import { createApp } from 'vue'
import {createPinia} from "pinia";
import App from './App.vue'
import router from "@/router";

import './style.css'
import 'vue-sonner/style.css'

const app = createApp(App)
const pinia = createPinia();

app.use(pinia)  // 状态管理
app.use(router)  // 路由

app.mount('#app')

