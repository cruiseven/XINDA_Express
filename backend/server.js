/**
 * 新达快递发货管理系统 - 主服务器文件
 * 功能：启动Express服务器，配置路由和中间件
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

// 导入路由
const authRoutes = require('./routes/auth');
const carrierRoutes = require('./routes/carriers');
const senderRoutes = require('./routes/senders');
const addressRoutes = require('./routes/addresses');
const shipmentRoutes = require('./routes/shipments');
const userRoutes = require('./routes/users');
const updateRoutes = require('./routes/update');
const trackingRoutes = require('./routes/tracking');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（前端页面）
app.use(express.static(path.join(__dirname, '../frontend')));

// Session配置
app.use(session({
  secret: 'xinda-express-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/carriers', carrierRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/update', updateRoutes);
app.use('/api/tracking', trackingRoutes);

// 根路径返回前端首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 登录页
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// 健康检查接口 (用于Docker)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '页面未找到'
  });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDB();
    console.log('数据库初始化完成！');

    // 启动Express服务器
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 鑫达快递发货管理系统启动成功！                          ║
║      XINDA MACHINERY Express System                       ║
║                                                           ║
║   访问地址: http://localhost:${PORT}                          ║
║   登录页面: http://localhost:${PORT}/login                   ║
║                                                           ║
║   管理员账号: cruiseven                                    ║
║   初始密码: 1qaz2wsx                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
