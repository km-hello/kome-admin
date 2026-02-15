# ==================== 阶段1: 构建 ====================
FROM node:22-alpine AS builder

WORKDIR /build

# 先复制依赖文件，利用 Docker 缓存
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci

# 复制源码和生产环境变量
COPY . .

# 构建生产版本
RUN npm run build

# ==================== 阶段2: 运行 ====================
FROM nginx:stable-alpine AS runtime

# 复制构建产物到 /admin 子路径下（与外层 Nginx 代理路径一致）
COPY --from=builder /build/dist /usr/share/nginx/html/admin

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
