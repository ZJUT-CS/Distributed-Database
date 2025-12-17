# SkyLink - 智能航班预订系统

基于分布式数据库的现代化航班预订平台，提供航班查询、预订、支付、退改签等全流程服务。

## 📋 项目架构

```
Distributed-Database/
├── skylink-frontend/          # React + TypeScript + Vite 前端
├── skylink-backend/           # Spring Boot 后端
└── Shardingsphere-proxy/      # ShardingSphere 分库分表配置
```

## 🚀 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router 7
- **UI**: Tailwind CSS + Lucide Icons
- **HTTP客户端**: Axios
- **AI集成**: Google Gemini API

### 后端
- **框架**: Spring Boot 3.x
- **ORM**: MyBatis-Plus
- **安全**: Spring Security + BCrypt
- **数据库**: MySQL 8.0
- **分库分表**: Apache ShardingSphere 5.5.2

### 基础设施
- **容器化**: Docker + Docker Compose
- **数据库代理**: ShardingSphere Proxy

## 📡 端口配置

| 服务 | 端口 | 说明 |
|-----|------|------|
| 前端开发服务器 | 5173 | Vite开发服务器 |
| 后端API | 9999 | Spring Boot服务 |
| MySQL | 3306 | 数据库主库 |
| ShardingSphere Proxy | 3307 | 分库分表代理 |

详细端口配置请参考 [PORT_CONFIGURATION.md](./PORT_CONFIGURATION.md)

## 🔧 快速开始

### 前置要求

- Node.js 18+
- Java 17+
- Maven 3.6+
- Docker & Docker Compose

### 1. 启动数据库

```bash
cd Shardingsphere-proxy
docker-compose up -d
```

验证数据库启动:
```bash
docker ps
```

### 2. 启动后端

```bash
cd skylink-backend

# Windows
mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

后端将在 `http://localhost:9999` 启动

### 3. 启动前端

首先配置环境变量:
```bash
cd skylink-frontend
cp .env.example .env.local
# 编辑 .env.local 配置 VITE_API_URL 和 VITE_GEMINI_API_KEY
```

安装依赖并启动:
```bash
npm install
npm run dev
```

前端将在 `http://localhost:5173` 启动并自动打开浏览器

## 🔐 登录账户

### 普通用户
- 可通过前端注册页面创建账户
- 使用手机号 + 密码登录
- 接口: `POST /auth/login`

### 管理员
- 接口: `POST /auth/admin/login`
- 需要先通过接口创建管理员账户: `POST /auth/admin/register`
- 使用用户名 + 密码登录

初始化管理员账户示例:
```bash
curl -X POST http://localhost:9999/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": 1
  }'
```

## 📚 API文档

### 认证相关
- `POST /auth/login` - 用户登录
- `POST /auth/phone-register` - 用户注册
- `POST /auth/admin/login` - 管理员登录
- `POST /auth/admin/register` - 管理员注册

### 航班相关
- `GET /flights` - 查询航班
- `GET /flights/{id}` - 获取航班详情
- `POST /flights` - 创建航班（管理员）

### 订单相关
- `POST /orders` - 创建订单
- `GET /orders` - 查询订单列表
- `GET /orders/{id}` - 获取订单详情

### 管理员相关
- `GET /admin/**` - 管理员功能接口

完整API文档请参考后端Swagger: `http://localhost:9999/swagger-ui.html`

## 🗄️ 数据库配置

### 连接信息

**直连MySQL** (不推荐):
```
Host: localhost
Port: 3306
Database: sharding_db
Username: root
Password: shardingsphere
```

**通过ShardingSphere Proxy** (推荐):
```
Host: 26.122.246.196
Port: 3307
Database: sharding_db
Username: root
Password: shardingsphere
```

### 分库分表策略

- 按用户ID分片
- 按订单时间分片
- 详细配置见 `Shardingsphere-proxy/conf/config-sharding_db.yaml`

## 🌐 环境变量

### 前端环境变量

创建 `.env.local` 文件:
```env
# 后端API地址
VITE_API_URL=http://localhost:9999

# Gemini AI API密钥
VITE_GEMINI_API_KEY=your_api_key_here
```

### 后端环境变量

可通过修改 `application.yml` 或启动参数覆盖:
```bash
java -jar skylink-backend.jar \
  --server.port=9999 \
  --spring.datasource.url=jdbc:mysql://host:3307/sharding_db
```

## 🏗️ 项目结构

### 前端目录结构
```
skylink-frontend/
├── src/
│   ├── components/      # 组件
│   ├── pages/          # 页面
│   ├── services/       # API服务
│   ├── hooks/          # React Hooks
│   ├── types/          # TypeScript类型
│   └── router/         # 路由配置
├── public/             # 静态资源
└── vite.config.ts      # Vite配置
```

### 后端目录结构
```
skylink-backend/src/main/java/com/team/skylink/
├── controller/         # 控制器
├── entity/            # 实体类
├── mapper/            # MyBatis映射器
├── dto/               # 数据传输对象
├── config/            # 配置类
└── common/            # 通用类
```

## 🔒 安全配置

- 密码使用 BCrypt 加密存储
- CORS 已配置允许跨域请求
- JWT Token 支持（开发中）
- SQL注入防护（MyBatis-Plus）

## 🐛 调试接口

开发环境提供调试接口:
- `GET /debug/**` - 数据库连接测试等

生产环境请禁用这些接口。

## 📦 构建部署

### 前端打包
```bash
cd skylink-frontend
npm run build
# 产物在 dist/ 目录
```

### 后端打包
```bash
cd skylink-backend
./mvnw clean package
# 产物在 target/ 目录
```

### Docker部署
```bash
# 构建镜像
docker build -t skylink-frontend ./skylink-frontend
docker build -t skylink-backend ./skylink-backend

# 运行容器
docker run -d -p 80:5173 skylink-frontend
docker run -d -p 9999:9999 skylink-backend
```

## 🧪 测试

### 前端测试
```bash
cd skylink-frontend
npm run test
```

### 后端测试
```bash
cd skylink-backend
./mvnw test
```

## 📊 监控与日志

### 后端日志
- 默认输出到控制台
- 可配置日志文件路径

### ShardingSphere日志
```bash
cd Shardingsphere-proxy
tail -f logs/stdout.log
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证

## 📞 联系方式

- 项目主页: [GitHub Repository]
- 问题反馈: [GitHub Issues]

## 🙏 致谢

- Spring Boot
- React
- Apache ShardingSphere
- Google Gemini AI

---

**最后更新**: 2025-12-17  
**版本**: 1.0.0
