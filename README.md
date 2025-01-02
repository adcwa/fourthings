 
# FourThings - 四象限任务管理应用

一个基于四象限法则的任务管理应用，帮助你更好地管理和安排任务优先级。

一个四象限管理 web 应用，使用 react 和 tailwindcss 开发。 数据存储在本地，使用 indexedDB 实现。支持多用户。 需要显示四象限的图表，使用 react-echarts 实现。在四象限中维护和显示任务。动画需要自然流畅。 按天维护四象限，每天数据归档，支持按天查看。 四象限下方额外增加两个模块，分别是任务列表和日记

## 功能特性

### 当前已实现功能

1. 任务管理
   - ✅ 创建、编辑、删除任务
   - ✅ 任务标题和详细描述
   - ✅ 任务完成状态切换
   - ✅ 任务拖拽排序
   - ✅ 跨象限任务移动

2. 四象限视图
   - ✅ 清晰的四象限布局
   - ✅ 每个象限独立滚动
   - ✅ 任务数量不限
   - ✅ 视觉区分不同象限
   - ✅ 任务卡片美观展示

3. 数据持久化
   - ✅ 使用 IndexedDB 本地存储
   - ✅ 自动保存所有更改
   - ✅ 页面刷新数据保持

4. 用户体验
   - ✅ 响应式设计
   - ✅ 拖拽交互
   - ✅ 动画过渡效果
   - ✅ 任务完成状态视觉反馈

### 开发中功能

1. 用户系统
   - 🚧 用户注册和登录
   - 🚧 多用户数据隔离
   - 🚧 用户偏好设置

2. 数据同步
   - 🚧 云端数据备份
   - 🚧 多设备同步
   - 🚧 离线支持

### 未来规划 (Roadmap)

1. 任务增强
   - 📅 任务截止日期
   - 📌 任务标签系统
   - 🔔 任务提醒
   - 📊 任务统计分析
   - 🔄 周期性任务

2. 协作功能
   - 👥 团队共享
   - 💬 任务评论
   - 📤 任务委派
   - 📎 文件附件

3. 数据可视化
   - 📈 任务完成趋势
   - 📊 时间分配分析
   - 🎯 目标完成度追踪

4. 集成功能
   - 📱 移动应用
   - 📆 日历集成
   - ✉️ 邮件通知
   - 🔗 第三方应用集成

## 技术栈

- 前端框架：React + TypeScript
- 状态管理：React Hooks
- UI 框架：TailwindCSS
- 数据存储：IndexedDB (Dexie.js)
- 构建工具：Vite

## 快速开始

1. 克隆项目
```bash
git clone [repository-url]
cd fourthings
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── QuadrantChart/  # 四象限图表组件
│   └── TaskForm/       # 任务表单组件
├── services/           # 服务层
│   └── db.ts          # 数据库服务
├── hooks/              # 自定义 Hooks
│   └── useTasks.ts    # 任务管理 Hook
├── pages/             # 页面组件
│   └── Dashboard.tsx  # 主面板页面
└── styles/            # 样式文件
    └── scrollbar.css  # 自定义滚动条样式
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 开发规范

1. 代码风格
   - 使用 TypeScript 严格模式
   - 遵循 ESLint 规则
   - 使用 Prettier 格式化代码

2. 组件开发
   - 遵循 React Hooks 最佳实践
   - 组件职责单一
   - 注重代码复用

3. 提交规范
   - 使用语义化的提交信息
   - 每个提交专注于单一改动
   - 保持提交历史清晰

## 许可证

MIT License - 详见 LICENSE 文件

## 联系方式

- 项目维护者：adcwa
- Email：adcwa
- 项目主页：[Project Homepage]

```
 
 