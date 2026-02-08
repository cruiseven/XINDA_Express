## 修复 Docker 卷挂载问题

### 问题
Docker 无法将卷挂载为单个文件：
```
error mounting ... to "/app/backend/database.sqlite": not a directory
```

### 解决方案
使用 bind mount 直接挂载本地数据库文件：

```yaml
volumes:
  - ./backend/database.sqlite:/app/backend/database.sqlite:ro
```

### 步骤
1. 修改 docker-compose.yml，使用 bind mount
2. 确保服务器上有 `backend/database.sqlite` 文件
3. 重新启动容器

### 优点
- ✅ 数据库文件直接挂载到容器内
- ✅ 配置文件（update-config.json）会随代码更新
- ✅ 自动重新安装 node_modules
- ✅ 解决卷挂载问题