# 云端同步与部署实施计划

## 目标
为 FourThings 应用启用云端数据持久化（Postgres），实现用户认证，并支持 Vercel 一键部署。

## 用户审查事项
> [!IMPORTANT]
> **数据库连接**：功能依赖于有效的 Postgres 连接字符串。确保在 Vercel 环境变量中设置 `POSTGRES_URL`。
> **认证**：实现基于 JWT 的简单认证系统。
> **同步策略**：目前实现手动"上传"和"下载"进行备份和恢复，以避免复杂的冲突解决。

## 变更内容

### 后端 (新增 `api/` 目录)
使用 Vercel Serverless Functions 处理数据库操作。

#### [NEW] `api/auth/register.ts`
- 处理用户注册。

#### [NEW] `api/auth/login.ts`
- 处理登录并返回 JWT。

#### [NEW] `api/sync.ts`
- `POST`: 接收本地数据（任务、日记）并写入数据库（Upsert）。
- `GET`: 获取所有用户数据以恢复本地状态。

#### [NEW] `lib/db.ts`
- Postgres 连接逻辑（使用 `pg` 连接池）。

### 前端

#### [MODIFY] `src/services/api.ts` (新文件)
- 与 `api/*` 端点通信的 HTTP 客户端。

#### [MODIFY] `src/services/auth.ts` (新文件)
- 认证状态管理（登录/登出/Token）。

#### [MODIFY] `src/components/SyncControls.tsx` (新组件)
- "上传到云端"和"从云端下载"的 UI。
- 登录/注册模态框。

#### [MODIFY] `src/App.tsx`
- 添加 Auth Context Provider。
- 在 UI 中添加同步控件。

### 配置

#### [NEW] `vercel.json`
- Vercel 部署配置（API 重写）。

#### [MODIFY] `package.json`
- 添加后端依赖：`pg`, `bcryptjs`, `jsonwebtoken`。

## 验证计划

### 自动化测试
- 无。
- 依赖代码正确性和部署后的手动验证。

### 手动验证
1.  **部署**：检查 `vercel deploy` 是否成功。
2.  **认证**：注册用户，登录。
3.  **同步**：离线创建任务 -> 点击"上传" -> 清除本地数据 -> 点击"下载" -> 验证任务恢复。
