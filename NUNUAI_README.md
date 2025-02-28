# NunuAI 项目概述

这是一个名为 **NunuAI** 的开源现代化聊天应用框架，基于 Next.js 构建的全栈项目。这是一个功能丰富的 AI 聊天应用，支持多种大型语言模型（LLMs）。

## 项目核心功能

1. **多模型聊天**：

   - 支持 OpenAI (ChatGPT)、Claude、Gemini、Groq、Ollama 等多种 AI 模型
   - 提供统一的聊天界面，可以轻松切换不同的 AI 服务提供商

2. **多模态交互**：

   - 支持文本、语音、图像等多种交互方式
   - 语音合成（TTS）功能，可以将 AI 回复转换为语音

3. **插件系统**：

   - 可扩展的 Function Call 插件系统
   - 允许开发者创建自定义功能扩展

4. **国际化支持**：

   - 多语言界面（至少支持英文和中文）
   - 支持 RTL（从右到左）语言布局

5. **用户认证**：

   - 支持多种认证方式，包括 NextAuth 和 Clerk
   - 用户管理和权限控制

6. **数据存储**：

   - 使用 Drizzle ORM 进行数据库操作
   - 支持多种数据库，包括 PostgreSQL
   - 支持会话、消息、主题等数据的持久化存储

7. **文件处理**：

   - 支持文件上传和处理
   - 支持 PDF、Office 文档等多种格式的解析

8. **RAG (检索增强生成) 功能**：

   - 支持基于文档的问答
   - 文档索引和检索功能

9. **响应式设计**：

   - 支持移动端和桌面端自适应布局
   - 针对不同设备提供优化的用户体验

10. **PWA 支持**：

    - 支持作为渐进式 Web 应用安装到设备

11. **主题定制**：

    - 支持明暗主题切换
    - 支持主题色和中性色定制

12. **部署选项**：
    - 支持 Vercel 一键部署
    - 提供 Docker 容器化部署方案
    - 自托管选项

## 技术架构

1. **前端**：

   - 基于 Next.js 15 框架
   - 使用 React 19 构建用户界面
   - 使用 Ant Design 和 antd-style 作为 UI 组件库
   - 使用 Zustand 进行状态管理
   - 使用 i18next 实现国际化

2. **后端**：

   - Next.js API 路由和服务器组件
   - tRPC 用于类型安全的 API
   - Drizzle ORM 用于数据库操作
   - 支持多种数据库，主要是 PostgreSQL

3. **数据存储**：

   - 使用 PostgreSQL 作为主要数据库
   - 支持 Neon Database 等云数据库服务
   - 使用 Drizzle 进行数据库迁移和管理

4. **AI 集成**：

   - 支持多种 AI 服务提供商的 API 集成
   - 包括 OpenAI、Anthropic、Google AI 等

5. **部署与监控**：
   - Vercel 部署支持
   - Sentry 错误监控
   - Vercel Analytics 和 Speed Insights 性能监控

## 项目结构

项目采用了模块化的结构，主要包括：

1. **app 目录**：Next.js App Router 结构，包含所有页面和路由

   - `[variants]` 目录：支持多种变体（语言、主题、设备类型）的路由
   - `(main)` 目录：主要应用功能，包括聊天、设置等
   - `(auth)` 目录：认证相关页面

2. **components 目录**：可复用的 UI 组件

3. **database 目录**：数据库相关代码

   - `schemas`：数据库表结构定义
   - `migrations`：数据库迁移脚本
   - `repositories`：数据访问层

4. **features 目录**：功能模块，如 PWA 安装等

5. **layout 目录**：布局组件，包括全局提供者等

6. **locales 目录**：国际化资源文件

7. **server 目录**：服务器端代码

8. **utils 目录**：工具函数和辅助方法

## 部署与配置

项目支持多种部署方式：

1. **Vercel 一键部署**：最简单的部署方式
2. **Docker 容器化部署**：提供 Dockerfile 和 docker-compose 配置
3. **自托管**：可以在自己的服务器上部署

配置通过环境变量进行，主要包括：

1. **访问控制**：可以设置访问密码
2. **AI 服务提供商配置**：各种 AI API 的密钥和端点
3. **数据库配置**：数据库连接信息
4. **认证配置**：认证服务的配置

---

---

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
