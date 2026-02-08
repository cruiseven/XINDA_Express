# 新达快递发货管理系统

一个基于 Node.js + SQLite 的快递发货管理系统，支持多用户管理、发货记录追踪、承运人管理、数据统计和导出功能。

## ✨ 功能特性

### 基础功能
- **用户认证** - 支持登录、登出、密码修改
- **发货记录管理** - 添加、编辑、删除发货记录
- **基础数据管理** - 承运人、发件人、收货地址管理
- **数据统计** - 按月份和承运人统计发货量、金额、重量
- **数据导出** - 支持导出 CSV 格式数据
- **多用户管理** - 仅管理员可管理用户账户

### 🚀 GitHub 自动更新（新增）
- **自动检测更新** - 自动检查 GitHub 最新版本
- **一键更新** - 管理员可点击按钮直接更新系统
- **版本管理** - 自动记录当前版本和更新历史
- **安全更新** - 数据库不会被覆盖

## 📁 项目结构

```
XINDA_express/
├── backend/                 # 后端代码
│   ├── server.js           # 主服务器文件
│   ├── database.js         # 数据库初始化
│   ├── db.js              # 数据库连接管理
│   ├── routes/            # API路由
│   │   ├── auth.js        # 认证API
│   │   ├── carriers.js    # 承运人管理
│   │   ├── sellers.js     # 发件人管理
│   │   ├── addresses.js   # 收货地址管理
│   │   ├── shipments.js   # 发货记录管理
│   │   ├── users.js      # 用户管理
│   │   └── update.js      # GitHub自动更新API
│   ├── update-config.json  # 版本配置文件（会提交到GitHub）
│   └── package.json
├── frontend/               # 前端代码
│   ├── index.html         # 主页面
│   ├── login.html         # 登录页面
│   ├── css/
│   │   └── style.css      # 样式文件
│   └── js/
│       ├── api.js         # API调用模块
│       ├── auth.js        # 认证处理
│       └── app.js         # 主应用逻辑
├── data/                   # 数据目录（数据库文件，不上传到GitHub）
│   └── database.sqlite    # SQLite 数据库文件
├── Dockerfile             # Docker 构建文件
├── docker-compose.yml     # Docker Compose 配置
└── package.json           # 项目依赖配置
```

## 📂 data 目录说明

`data/` 目录专门用于存放数据库文件：
- **位置**: 项目根目录下的 `data/` 文件夹
- **文件**: `data/database.sqlite` - SQLite 数据库文件
- **用途**: 存储所有发货记录、用户信息、承运人等核心数据

### ⚠️ 重要提示

- `data/` 目录已被 `.gitignore` 忽略，**不会上传到 GitHub**
- 数据库文件需要手动上传到服务器或从备份恢复
- 每次部署时确保服务器上有 `data/database.sqlite` 文件

## 🚀 快速开始

### 方式1：直接运行

```bash
cd backend
npm install
npm start
```

服务器将在 `http://localhost:6000` 启动

### 方式2：Docker部署

```bash
# 1. 克隆或下载项目代码
git clone https://github.com/cruiseven/XINDA_Express.git
cd XINDA_Express

# 2. 准备数据目录（从备份恢复数据库）
mkdir -p data
# 将数据库文件复制到 data 目录
# cp /path/to/backup/database.sqlite data/

# 3. 启动容器
docker-compose up -d
```

### ⚠️ 重要：首次部署步骤

首次部署或重装系统时，需要手动准备数据库文件：

```bash
# 1. 确保有数据库文件
ls -la data/database.sqlite

# 2. 如果没有，从备份恢复
mkdir -p data
cp /path/to/your/database.sqlite data/

# 3. 启动
docker-compose up -d
```

## 🔐 默认账号

- **用户名**: `cruiseven`
- **密码**: `1qaz2wsx`

首次登录后建议立即修改密码！

## 📖 使用说明

### 1. 登录系统
访问 `http://localhost:6000/login` 或 `http://localhost:6000`，使用管理员账号登录。

### 2. 基础数据配置
在添加发货记录前，请先配置：
- **承运人管理** - 添加合作的快递公司
- **发件人管理** - 添加常用发件人信息
- **收货地址管理** - 添加常用收货地址

### 3. 发货记录操作
- 点击「+ 添加发货记录」添加新记录
- 使用筛选功能按月份、承运人、状态查询
- 支持导出全部或筛选后的数据为 CSV

### 4. 数据统计
- 查看总发货量、总金额、总重量统计
- 按承运人和月份查看详细统计

### 5. 系统配置
只有管理员（cruiseven）可以访问：
- **用户管理** - 添加/禁用用户账户
- **系统更新** - GitHub 自动更新功能

## 🔄 GitHub 自动更新配置

### 配置步骤

#### 1. 创建 GitHub Release

在你的 GitHub 仓库中创建 Release：

1. 进入仓库 → 点击 "Releases" → "Create a new release"
2. Tag version: `v1.0.1`（版本号格式：`v*.*.*`）
3. Release title: `v1.0.1`
4. 点击 "Publish release"

#### 2. 设置仓库地址

**方式一：环境变量**
```bash
# Windows PowerShell
setx GITHUB_REPO "你的用户名/仓库名"
```

**方式二：编辑配置文件**
```json
// backend/update-config.json
{
  "currentVersion": "v1.0.0",
  "githubRepo": "你的用户名/仓库名"
}
```

### 使用更新功能

1. 使用 `cruiseven` 账号登录
2. 点击左侧菜单的「系统配置」
3. 在「系统更新」区域查看版本信息
4. 点击「🔍 检查更新」检查是否有新版本
5. 如果有新版本，点击「⬇️ 立即更新」
6. 更新完成后刷新页面

### 更新说明

- ✅ **会更新**: 前端文件、后端代码（除 database.js）
- ❌ **不会更新**: 数据库文件、配置文件、node_modules

### 更新日志

更新日志保存在 `backend/update-log.json`

## 🔧 API 接口

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/check` - 检查登录状态
- `POST /api/auth/change-password` - 修改密码

### 数据管理
- `GET/POST /api/carriers` - 承运人管理
- `GET/POST /api/sellers` - 发件人管理
- `GET/POST /api/addresses` - 收货地址管理
- `GET/POST /api/shipments` - 发货记录管理
- `GET /api/shipments/summary` - 发货统计
- `GET /api/users` - 用户管理

### 系统更新
- `GET /api/update/version` - 获取当前版本
- `GET /api/update/check` - 检查 GitHub 更新
- `POST /api/update/execute` - 执行更新
- `GET /api/update/logs` - 获取更新日志

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite (sql.js)
- **前端**: 原生 HTML/CSS/JavaScript
- **部署**: Docker

## 📝 更新日志

### v1.0.0 (2024-02-07)
- ✨ 初始版本发布
- ✨ 用户认证系统
- ✨ 发货记录管理
- ✨ 承运人、发件人、收货地址管理
- ✨ 数据统计和导出功能
- ✨ GitHub 自动更新功能

## 📄 许可证

MIT License

## 👤 作者

**鑫达机械 (XINDA MACHINERY)**

---

如有问题或建议，欢迎提交 Issue 或 Pull Request！
