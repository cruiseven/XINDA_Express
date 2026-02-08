/**
 * 认证路由模块
 * 功能：处理用户登录、登出和验证
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

/**
 * 用户登录
 * POST /api/auth/login
 * 参数: username, password
 */
router.post('/login', async (req, res) => {
  try {
    await db.initDB();
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      return res.json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户
    const user = db.queryOne('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return res.json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查用户状态
    if (user.status === 'disabled') {
      return res.json({
        success: false,
        message: '该账户已被停用，请联系管理员'
      });
    }

    // 创建session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        username: user.username,
        id: user.id
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({
        success: false,
        message: '登出失败'
      });
    }
    res.json({
      success: true,
      message: '登出成功'
    });
  });
});

/**
 * 检查登录状态
 * GET /api/auth/check
 */
router.get('/check', (req, res) => {
  if (req.session.userId) {
    res.json({
      success: true,
      loggedIn: true,
      data: {
        username: req.session.username,
        id: req.session.userId
      }
    });
  } else {
    res.json({
      success: true,
      loggedIn: false
    });
  }
});

/**
 * 修改密码
 * POST /api/auth/change-password
 * 参数: old_password, new_password
 */
router.post('/change-password', async (req, res) => {
  try {
    await db.initDB();
    const { old_password, new_password } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.json({
        success: false,
        message: '请先登录'
      });
    }

    if (!old_password || !new_password) {
      return res.json({
        success: false,
        message: '旧密码和新密码都不能为空'
      });
    }

    const user = db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);

    if (!bcrypt.compareSync(old_password, user.password)) {
      return res.json({
        success: false,
        message: '旧密码错误'
      });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    db.saveDB();

    res.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.json({
      success: false,
      message: '修改密码失败'
    });
  }
});

module.exports = router;
