# NunuAI 本地开发环境搭建指南

## 前置要求

在开始之前，请确保您已安装以下工具：

- Node.js (推荐 v18+)
- pnpm 包管理器
- Docker 和 Docker Compose
- Git

> 注意：Windows 和 macOS 的安装步骤可能略有不同，请根据您的操作系统选择适当的安装方法。

## 步骤一：启动数据库

首先，我们需要使用 Docker 启动一个 PostgreSQL 数据库实例：

```bash
# 创建 Docker 网络
docker network create pg

# 启动 PostgreSQL 容器（带 pgvector 扩展）
docker run --name my-postgres --network pg -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d pgvector/pgvector:pg16

# 验证容器是否正常运行
docker ps
```

确保在输出中看到 `my-postgres` 容器处于 `Up` 状态。

## 步骤二：配置环境变量

在项目根目录创建两个环境变量文件：`.env.local` 和 `.env`（两个文件内容相同，有些命令只读取特定文件）。
内容参考 `.env.nunuai`

## 步骤三：安装依赖并启动项目

```bash
# 安装项目依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

> 注意：每次启动项目都比较慢，请耐心等待直到浏览器显示主页。

## 步骤四：初始化数据库表结构

在开发服务器运行的同时，打开一个新的终端窗口，执行：

```bash
# 创建数据库表结构
pnpm run db:push
```

确保命令执行成功，输出应包含 `[✓] Changes applied`。

## 步骤五：登录系统

1. 在浏览器中访问 `http://localhost:3010`
2. 点击左上角头像
3. 点击 "登录" 按钮，跳转到登录页面
4. 选择可用的登录方式（如 GitHub、Google 等）
5. 完成授权流程

## 故障排除

如果遇到问题，请检查：

- 数据库连接是否正常：`psql postgres://postgres:mysecretpassword@127.0.0.1:5432/postgres -c "SELECT 1;"`
- pgvector 扩展是否已安装：`psql postgres://postgres:mysecretpassword@127.0.0.1:5432/postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"`
- 环境变量是否正确配置
- 开发服务器日志中是否有错误信息
- 靠实有问题，在群里 @废物熊猫

---

祝您开发顺利！
