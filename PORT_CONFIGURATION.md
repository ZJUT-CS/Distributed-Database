# SkyLink 项目端口配置对照表

## 📋 端口映射概览

| 服务名称 | 前端调用端口 | 后端实际端口 | 协议类型 | 状态 | 备注 |
|---------|------------|------------|---------|------|------|
| SkyLink Frontend | - | 5173 | HTTP | ✅ 正常 | Vite开发服务器 |
| SkyLink Backend API | 9999 | 9999 | HTTP | ✅ 正常 | Spring Boot服务 |
| MySQL数据库 | - | 3306 | TCP | ✅ 正常 | Docker容器内部 |
| ShardingSphere Proxy | 3307 | 3307 | TCP | ✅ 正常 | 分库分表代理 |

---

## 🔍 详细端口配置分析

### 1. 前端服务 (skylink-frontend)

#### 开发环境
- **服务端口**: `5173`
- **配置文件**: `vite.config.ts`
- **配置项**:
  ```typescript
  server: {
    port: 5173,
    open: true
  }
  ```

#### API请求配置
- **目标后端**: `http://localhost:9999`
- **配置文件**: `src/services/api.ts`
- **环境变量支持**: 
  - 开发环境: `VITE_API_URL` (可选, 默认 `http://localhost:9999`)
  - 生产环境: 通过环境变量 `VITE_API_URL` 覆盖
- **配置方式**: 
  ```typescript
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9999'
  ```

#### 其他环境变量
- **Gemini API**: `VITE_GEMINI_API_KEY` (用于AI推荐功能)

---

### 2. 后端服务 (skylink-backend)

#### Spring Boot应用
- **服务端口**: `9999`
- **配置文件**: `src/main/resources/application.yml`
- **配置项**:
  ```yaml
  server:
    port: 9999
  ```

#### API端点分组
| 端点路径 | Controller | 功能描述 |
|---------|-----------|---------|
| `/auth/**` | AuthController | 认证相关(登录/注册) |
| `/flights/**` | FlightController | 航班查询/管理 |
| `/orders/**` | OrderController | 订单管理 |
| `/payments/**` | PaymentController | 支付处理 |
| `/refund-change/**` | RefundChangeController | 退改签处理 |
| `/admin/**` | AdminController | 管理员功能 |
| `/trade/**` | TradeController | 交易相关 |
| `/global/**` | GlobalController | 全局配置 |
| `/debug/**` | DbTestController | 调试接口 |

---

### 3. 数据库服务

#### MySQL主库
- **宿主机端口**: `3306`
- **容器内端口**: `3306`
- **配置文件**: `Shardingsphere-proxy/docker-compose.yml`
- **访问方式**: 
  - 外部访问: `localhost:3306`
  - 容器内访问: `mysql:3306`
- **账户信息**:
  - 用户名: `root`
  - 密码: `shardingsphere` (默认)

#### ShardingSphere Proxy
- **宿主机端口**: `3307`
- **容器内端口**: `3307`
- **后端连接配置**: `application.yml`
  ```yaml
  spring:
    datasource:
      url: jdbc:mysql://26.122.246.196:3307/sharding_db
  ```
- **功能**: 分库分表代理层

---

## 🌐 环境配置

### 开发环境 (Development)

| 服务 | 地址 | 端口 |
|-----|------|-----|
| 前端 | http://localhost:5173 | 5173 |
| 后端API | http://localhost:9999 | 9999 |
| MySQL | localhost | 3306 |
| ShardingSphere | 26.122.246.196 | 3307 |

### 生产环境 (Production)

**前端配置**:
- 设置环境变量 `VITE_API_URL` 指向生产后端地址
- 示例: `VITE_API_URL=https://api.skylink.com` 或 `http://production-server:9999`

**后端配置**:
- 修改 `application.yml` 或使用 Spring Profile
- 数据库地址更改为生产环境地址
- 可通过 `--server.port=xxxx` 启动参数覆盖端口

---

## 🔒 特殊场景配置

### 1. 跨域配置 (CORS)
- **配置文件**: `skylink-backend/src/main/java/com/team/skylink/config/CorsConfig.java`
- **允许来源**: `*` (所有来源)
- **允许方法**: GET, POST, PUT, DELETE, OPTIONS
- **生产环境建议**: 限制为前端实际域名

### 2. 负载均衡场景
如使用 Nginx 等反向代理:
```nginx
upstream skylink_backend {
    server 127.0.0.1:9999;
    # server 127.0.0.1:9998;  # 多实例负载均衡
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://skylink_backend/;
    }
}
```

前端配置相应更改为:
```
VITE_API_URL=http://your-domain.com/api
```

### 3. Docker Compose 部署
如需容器化部署，端口映射示例:
```yaml
services:
  frontend:
    ports:
      - "80:5173"
  backend:
    ports:
      - "9999:9999"
```

---

## ✅ 端口配置验证清单

- [x] 前端 `api.ts` 中 baseURL 默认指向 `localhost:9999`
- [x] 后端 `application.yml` 配置端口为 `9999`
- [x] 前端 vite 开发服务器端口 `5173`
- [x] Docker MySQL 端口映射 `3306:3306`
- [x] Docker ShardingSphere 端口映射 `3307:3307`
- [x] CORS 配置允许跨域请求
- [x] 所有 Controller 路径映射正确
- [x] 数据库连接地址指向 ShardingSphere Proxy `3307`

---

## 🔧 配置修改指南

### 修改前端API地址

**开发环境**:
1. 在项目根目录创建 `.env.local` 文件
2. 添加配置: `VITE_API_URL=http://your-backend-url:port`

**生产环境**:
1. 构建时传入环境变量: `VITE_API_URL=xxx npm run build`
2. 或在部署平台配置环境变量

### 修改后端端口

**方式1: 修改配置文件**
编辑 `application.yml`:
```yaml
server:
  port: 8080  # 修改为目标端口
```

**方式2: 启动参数**
```bash
java -jar skylink-backend.jar --server.port=8080
```

**方式3: 环境变量**
```bash
SERVER_PORT=8080 java -jar skylink-backend.jar
```

---

## 📌 注意事项

1. **开发环境端口冲突**: 
   - 如端口已被占用，可修改 `vite.config.ts` 或 `application.yml`
   - 确保修改后前后端配置保持一致

2. **防火墙配置**:
   - 生产环境需开放相应端口
   - 建议仅开放必要端口，数据库端口不对外暴露

3. **HTTPS配置**:
   - 生产环境建议启用HTTPS
   - 需配置SSL证书
   - 前端 `VITE_API_URL` 使用 `https://` 协议

4. **数据库地址**:
   - 当前配置使用外部IP `26.122.246.196:3307`
   - 生产环境应使用内网地址或容器网络通信

---

## 🚀 快速启动命令

### 开发环境启动

**后端**:
```bash
cd skylink-backend
./mvnw spring-boot:run
# 或
./mvnw.cmd spring-boot:run  # Windows
```

**前端**:
```bash
cd skylink-frontend
npm install
npm run dev
```

**数据库**:
```bash
cd Shardingsphere-proxy
docker-compose up -d
```

### 验证端口是否正常监听

**Windows**:
```powershell
netstat -ano | findstr "5173"  # 前端
netstat -ano | findstr "9999"  # 后端
netstat -ano | findstr "3306"  # MySQL
netstat -ano | findstr "3307"  # ShardingSphere
```

**Linux/Mac**:
```bash
lsof -i :5173   # 前端
lsof -i :9999   # 后端
lsof -i :3306   # MySQL
lsof -i :3307   # ShardingSphere
```

---

## 📞 故障排查

### 1. 前端无法连接后端
- 检查后端是否启动: 访问 `http://localhost:9999/actuator/health`
- 检查 CORS 配置
- 检查防火墙/安全组设置
- 验证 `VITE_API_URL` 配置

### 2. 后端无法连接数据库
- 检查 ShardingSphere 容器状态: `docker ps`
- 检查数据库地址和端口
- 验证数据库账户密码
- 查看后端日志

### 3. 端口已被占用
- 查找占用进程并终止
- 或修改配置使用其他端口

---

**最后更新**: 2025-12-17  
**版本**: 1.0.0  
**维护者**: Development Team
