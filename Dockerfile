# 使用官方的 Node.js 20 镜像
FROM node:20 AS build

# 创建并切换到 /usr/src/app 目录
WORKDIR /usr/src/app

# 将 package.json 和 package-lock.json 复制到工作目录
COPY package*.json ./

# 安装依赖
RUN npm install

# 将本地代码复制到工作目录
COPY . .

# 打印目录结构，检查文件是否正确复制
RUN ls -al /usr/src/app

# 运行构建命令
RUN npm run build

# 使用一个不同的基础镜像来提供静态文件
FROM nginx:alpine

# 将前一个阶段生成的构建输出复制到 Nginx 的静态文件目录
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# 打印目录结构，检查文件是否正确复制
RUN ls -al /usr/share/nginx/html

# 暴露容器的端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
