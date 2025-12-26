# SkyLink（Distributed-Database）- 分布式航空订票系统

SkyLink 是一个面向“航班搜索-下单-支付-售后”的分布式订票系统示例工程，包含用户端与管理后台，后端集成 ShardingSphere 分库分表。

## 目录

- [项目结构](#项目结构)
- [主要功能](#主要功能)
- [快速开始](#快速开始)
- [详细使用说明](#详细使用说明)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 项目结构

```text
Distributed-Database/
├── skylink-frontend/          # React + TypeScript + Vite
├── skylink-backend/           # Spring Boot 后端
├── Shardingsphere-proxy/      # MySQL + ShardingSphere Proxy
├── PORT_CONFIGURATION.md      # 端口与环境变量说明
├── API_AUDIT_REPORT.md        # API 审计（接口清单/枚举/错误码）
└── SKYLINK_OPTIMIZATION_REPORT_2025-12-24.md  # 优化落地建议
```

## 主要功能

- 航班搜索：直飞 + 联程组合（Split-Join）
- 订单交易：下单、取消、支付、退改签
- 选座功能：
  - 可视化座位图，支持状态实时同步
  - 座位状态标识：绿色（可选/当前）、黄色（已选待确认）、红色（已售）、橙色（锁定）
  - 支持并发选座冲突处理与乐观锁控制
- Mode B：下单锁座、支付后支持换座（后端已具备能力）
- 管理后台：航班/订单/用户/支付/日志/系统配置等

## 快速开始

### 前置要求

- Node.js 18+
- JDK 21+
- Docker & Docker Compose

### 1) 启动数据库与代理

```bash
cd Shardingsphere-proxy
docker-compose up -d
```

### 2) 启动后端

```bash
cd skylink-backend

# Windows
mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

后端默认启动：`http://localhost:9999`

### 3) 启动前端

```bash
cd skylink-frontend
npm install
```

创建 `skylink-frontend/.env.local`（示例）：

```env
VITE_API_URL=http://localhost:9999
VITE_GEMINI_API_KEY=your_key_here
```

启动：

```bash
npm run dev
```

前端默认启动：`http://localhost:5173`

### （可选）Windows 一键启动脚本

仓库根目录提供 `start.bat`，会分别在新窗口启动前后端。

注意：当前脚本包含本机绝对路径，如在其他机器上使用，需要先把路径改为相对路径或本机实际路径。

## 详细使用说明

### 服务地址

- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:9999/api/v1`
- Swagger UI：`http://localhost:9999/swagger-ui/index.html`

### API 参考与约定

- 接口清单、枚举值、错误码：见 [API_AUDIT_REPORT.md](API_AUDIT_REPORT.md)
- 端口与环境变量：见 [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md)

#### 订单链路锚点（重要）

- `flightId` 为全链路强一致锚点（下单/支付/退改签/联程组合等均以此为准）。
- `flightNo` 仅用于展示或兼容查询入口；如需用 `flightNo` 查询，必须满足“唯一解析”（否则前端应提示改用 `flightId`）。
- 雪花 ID 在前端一律以 **string** 承载与传输，避免 JS number 精度问题。

### 调用示例（curl）

用户登录（获取 token）：

```bash
curl -X POST http://localhost:9999/api/v1/users/sessions ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\":\"13800138000\",\"password\":\"123456\"}"
```

航班搜索：

```bash
curl "http://localhost:9999/api/v1/flights?departurePlace=上海&destination=北京&departureDate=2025-12-20&page=1&size=10"
```

### 分布式/一致性注意事项

- 支付与订单状态存在“最终一致性”特征；前端应以订单状态回源结果为准。
- 管理端接口通常要求 Header：`X-User-Type: 2`；部分操作还要求 `X-Admin-Role: 2`（详见 `API_AUDIT_REPORT.md`）。

## 贡献指南

1. 新建分支：`git checkout -b feature/<topic>`
2. 提交信息清晰（建议包含模块与目的）
3. 提交前自测：
   - 前端：`cd skylink-frontend && npm run build`
   - 后端：`cd skylink-backend && ./mvnw test`
4. 发起 Pull Request 并描述：改动点、影响范围、验证方式

## 许可证

本仓库当前未包含 LICENSE 文件，因此不授予任何开源许可。若需要开源发布，请先补充 LICENSE 并在此处更新说明。
