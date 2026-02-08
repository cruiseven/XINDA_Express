## GitHub自动更新功能配置方案

### 1. 配置GitHub仓库地址
修改 `backend/update-config.json`：
- `githubRepo`: `"cruiseven/XINDA_Express"`

### 2. 更新当前版本号
- 将 `currentVersion` 改为当前版本（如 `v1.1.0`）

### 3. 本地测试
- 刷新页面 → 系统管理 → 检查更新
- 验证GitHub API调用是否正常

### 4. Docker部署注意事项
- Docker容器内需要安装git才能执行`git pull`
- 更新后需要重启应用才能生效