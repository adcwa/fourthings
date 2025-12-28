# 部署指南 (Deployment Guide)

本项目配置为使用 [Vercel](https://vercel.com) 进行全栈部署。
由于我们使用了 Vercel Serverless Functions (`api/` 目录) 作为后端，Vercel 会自动识别并同时部署前端 (Vite) 和后端 API。

## 部署步骤

### 1. 准备数据库
本项目使用 Postgres 数据库。你需要：
1. 创建一个 Postgres 数据库 (推荐使用 Bytebase, Supabase, 或 Neon)。
2. 获取数据库连接字符串 (`postgres://...`)。
3. 在数据库中执行 `docs/schema.sql` 中的 SQL 语句以创建表结构。

### 2. Vercel 部署

你可以通过以下两种方式之一进行部署：

#### 方式 A: 使用 Vercel CLI (推荐用于开发/手动部署)
在项目根目录下运行：

```bash
# 安装 vercel cli (如果未安装)
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

按照提示操作。当问及 "Set up and deploy?" 时选 Y。

#### 方式 B: Git 集成 (推荐用于生产)
1. 将代码推送到 GitHub/GitLab。
2. 在 Vercel 控制台 "Add New Project"。
3. 导入你的代码仓库。

### 3. 配置环境变量
**非常重要**：在 Vercel 的项目设置 (Settings -> Environment Variables) 中添加以下变量：

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `POSTGRES_URL` | Postgres 数据库连接字符串 | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | 用于签名 JWT 的随机密钥 | `my-super-secret-key-123` |

### 4. 完成
部署完成后，Vercel 会提供一个 URL (例如 `https://fourthings.vercel.app`)。
- 前端页面可直接访问。
- API 位于 `/api/*` (例如 `https://fourthings.vercel.app/api/auth/login`)。

## 本地开发与测试
要在本地模拟 Vercel 环境 (包括 API)，请使用 `vercel dev`:

```bash
vercel dev
```
这将同时启动前端和后端 API，允许你在本地测试完整功能。

## 桌面端部署 (Desktop Deployment)

本项目支持构建为 macOS 桌面应用。
详细构建指南请参阅: [Desktop Build Guide](./desktop_build.md)
