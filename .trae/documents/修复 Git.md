## 修复 GitHub 自动更新功能

### 问题
`update-config.json` 被 `.gitignore` 忽略，导致服务器上的配置文件无法通过 `git pull` 更新，显示的版本号仍然是 v1.0.0。

### 解决方案

1. **修改 `.gitignore`**
   - 从忽略列表中移除 `backend/update-config.json`
   - 保留 `backend/database.sqlite`（数据库文件，继续忽略）

2. **更新本地配置文件**
   - 在 `backend/update-config.json` 中设置：
     - currentVersion: v1.1.0
     - githubRepo: cruiseven/XINDA_Express

3. **提交并推送到 GitHub**
   - 添加 `update-config.json` 到 Git
   - 提交更改
   - 推送到 GitHub

4. **在服务器上更新**
   ```bash
   cd /opt/stacks/XINDA_Express
   git pull origin main
   docker-compose restart
   ```

### 安全性保证
- ✅ 数据库文件 `database.sqlite` 仍然被忽略，不会泄露
- ✅ 只有 `update-config.json` 会被提交，包含版本号和 GitHub 仓库名（不包含敏感数据）
- ✅ Docker 环境变量中已配置 `GITHUB_REPO`，即使配置文件丢失也能正常工作