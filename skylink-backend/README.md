# SkyLink Backend - 分布式航空订票系统（后端）

SkyLink 后端基于 Spring Boot + MyBatis-Plus 构建，集成 ShardingSphere-Proxy 完成分库分表，提供航班搜索（直飞/联程）、下单、支付、退改签与管理后台接口。

## 目录

- [快速开始](#快速开始)
- [详细使用说明](#详细使用说明)
- [核心能力说明](#核心能力说明)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 快速开始

### 前置要求

- JDK 21+
- Docker & Docker Compose（用于 MySQL + ShardingSphere Proxy）

> 数据库与代理推荐按仓库根目录 README 的方式启动：[../README.md](../README.md)

### 启动

```bash
./mvnw spring-boot:run
```

默认地址：`http://localhost:9999`

验证：

```bash
curl http://localhost:9999/api/v1/system/health
```

## 详细使用说明

### API 文档与约定

- Swagger UI：`http://localhost:9999/swagger-ui/index.html`
- 接口清单/枚举/错误码（建议作为联调权威来源）：[../API_AUDIT_REPORT.md](../API_AUDIT_REPORT.md)

### 统一响应结构

后端接口统一返回 `code/msg/data` 结构，且前端需要同时兼容：

- JSON `code`（优先）
- HTTP status（部分场景会同步设置为 400/401/403/409/500 等）

### 鉴权与权限（Header）

- 用户端：建议使用 `Authorization: Bearer <token>`（登录接口返回）；也兼容 `X-User-Id` 回退方案（开发/测试用途）。
- 管理端：通常需要 `X-User-Type: 2`；部分操作还需要 `X-Admin-Role: 2`。

## 核心能力说明

### 联程（Interline）

- 支持 Split-Join 拼接联程方案
- 约束中转时间：$2h \le \Delta t \le 24h$

### Mode B（下单锁座、支付后可换座）

- 下单阶段可锁定座位并写入订单 `seat_id`
- 支付成功后确认座位为已售
- 支付后可换座（原子换座，冲突时失败）

### 订单超时自动取消

- 通过定时任务扫描待支付订单并取消，同时释放座位
- 具体超时窗口与扫描频率以代码与系统配置为准（任务实现位置：`module/order/task/OrderTimeoutTask`）

## 贡献指南

1. 新建分支：`git checkout -b feature/<topic>`
2. 提交前自测：`./mvnw test`
3. 提交信息包含：模块 + 目的 + 影响范围
4. PR 描述包含：验证步骤、接口变更（如有）、兼容性说明

## 许可证

本仓库当前未包含 LICENSE 文件，因此不授予任何开源许可。若需要开源发布，请先补充 LICENSE 并在此处更新说明。
