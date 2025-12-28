# 云端同步实现指南

我已使用 Vercel Serverless Functions 和 Postgres 实现了用户系统和云端同步。

## 变更内容

### 后端 (Vercel Functions)
- **数据库连接**: `api/_lib/db.ts` 使用 `POSTGRES_URL` 连接到 Postgres。
- **认证**: `api/auth/register.ts` 和 `api/auth/login.ts` 处理用户凭证并返回 JWT。
- **同步**: `api/sync.ts` 处理将本地数据备份到云端 (Upsert) 和从云端恢复 (Select)。已进行优化以匹配前端数据格式（camelCase）。

### 前端
- **同步服务**: `src/services/SyncService.ts` 实现了自动同步逻辑，包括登录时自动下载和数据变更时自动上传。它还处理了日期格式的转换。
- **UI 更新**: 简化了 `src/components/SyncControls.tsx`，使其更加紧凑。

## 设置指南

> [!WARNING]
> 如果遇到权限错误 (`npm install`)，请运行:
> ```bash
> sudo chown -R 501:20 "/Users/wangfeng/.npm"
> npm install
> ```

### 数据库设置
1. 使用 `docs/schema.sql` 在您的 Bytebase/Postgres 数据库中创建表。
2. **重要**: 如果您的数据库密码包含特殊字符（如 `?`），请确保在连接字符串中对其进行 URL 编码（例如 `?` -> `%3F`）。

### 部署与环境
1. 部署到 Vercel: `vercel --prod`
2. 在 Vercel 中设置环境变量:
   - `POSTGRES_URL`: 您的数据库连接字符串。
   - `JWT_SECRET`: 一个安全的随机字符串。

### 使用方法
- 点击右上角的 "Login" 进行登录。登录后会自动下载云端数据。
- 数据变更会自动上传（有 2 秒延迟）。
- 状态指示器会显示 "Syncing...", "Synced" 或 "Failed"。
- 提供了手动强制上传/下载按钮以备不时之需。
