# 新达快递发货管理系统 - Docker配置文件
# 基于Node.js的容器化部署

# 使用Node.js 18 LTS作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置Node.js环境变量
ENV NODE_ENV=production
ENV PORT=6000

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装Node.js依赖
RUN npm ci --only=production

# 复制应用程序代码
COPY backend ./backend
COPY frontend ./frontend

# 暴露端口
EXPOSE 6000

# 启动应用程序
CMD ["npm", "start", "--prefix", "backend"]
