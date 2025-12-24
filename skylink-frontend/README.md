# SkyLink Frontend - 用户端与管理后台（前端）

该前端基于 React + TypeScript + Vite，包含用户端购票流程与管理后台页面。

## 目录

- [快速开始](#快速开始)
- [详细使用说明](#详细使用说明)
- [脚本命令](#脚本命令)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 快速开始

### 前置要求

- Node.js 18+

### 安装与启动

```bash
npm install
```

创建 `skylink-frontend/.env.local`（示例）：

```env
VITE_API_URL=http://localhost:9999
VITE_GEMINI_API_KEY=your_key_here
```

启动开发服务器：

```bash
npm run dev
```

默认访问：`http://localhost:5173`

## 详细使用说明

### 后端依赖

- 后端默认地址：`http://localhost:9999`
- Swagger UI：`http://localhost:9999/swagger-ui/index.html`

### API 参考

前端不在此重复维护完整 API 清单。请以仓库根目录的 API 审计文档为准：

- [../API_AUDIT_REPORT.md](../API_AUDIT_REPORT.md)

### 环境变量

- `VITE_API_URL`：后端 API 基地址（默认 `http://localhost:9999`）
- `VITE_GEMINI_API_KEY`：AI 推荐功能使用的 Gemini Key（可选；未配置时建议在 UI 做降级处理）

## 脚本命令

- `npm run dev`：启动开发服务器
- `npm run build`：生产构建
- `npm run preview`：本地预览构建产物

> 如 `package.json` 中包含额外脚本（lint/test），以实际脚本为准。

## 贡献指南

1. 新建分支：`git checkout -b feature/<topic>`
2. 提交前检查：`npm run build`
3. PR 描述包含：页面/接口改动点、验证方式、截图（如涉及 UI）

## 许可证

本仓库当前未包含 LICENSE 文件，因此不授予任何开源许可。若需要开源发布，请先补充 LICENSE 并在此处更新说明。
