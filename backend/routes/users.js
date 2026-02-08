/**
 * 用户管理路由模块
 * 功能：处理用户的增删改查和状态管理（仅限cruiseven用户）
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

/**
 * 权限检查中间件 - 只允许cruiseven访问
 */
function requireAdmin(req, res, next) {
    if (req.session.username !== 'cruiseven') {
        return res.json({
            success: false,
            message: '无权限访问此功能'
        });
    }
    next();
}

/**
 * 获取所有用户列表
 * GET /api/users
 */
router.get('/', requireAdmin, async (req, res) => {
    try {
        await db.initDB();
        const users = db.queryAll('SELECT id, username, status, created_at FROM users ORDER BY id ASC');

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});

/**
 * 创建新用户
 * POST /api/users
 * 参数: username, password
 */
router.post('/', requireAdmin, async (req, res) => {
    try {
        await db.initDB();
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        // 检查用户名是否已存在
        const existing = db.queryOne('SELECT * FROM users WHERE username = ?', [username]);
        if (existing) {
            return res.json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 创建新用户
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = db.execute(
            'INSERT INTO users (username, password, status) VALUES (?, ?, ?)',
            [username, hashedPassword, 'active']
        );
        db.saveDB();

        res.json({
            success: true,
            message: '用户创建成功',
            data: { id: result.lastInsertRowid }
        });
    } catch (error) {
        console.error('创建用户错误:', error);
        res.json({
            success: false,
            message: '创建用户失败'
        });
    }
});

/**
 * 更新用户信息
 * PUT /api/users/:id
 * 参数: username, password (可选)
 */
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        await db.initDB();
        const userId = req.params.id;
        const { username, password } = req.body;

        const existing = db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
        if (!existing) {
            return res.json({
                success: false,
                message: '用户不存在'
            });
        }

        // 不能修改cruiseven用户的用户名
        if (existing.username === 'cruiseven' && username && username !== 'cruiseven') {
            return res.json({
                success: false,
                message: '不能修改管理员用户名'
            });
        }

        // 检查新用户名是否被其他用户占用
        if (username && username !== existing.username) {
            const duplicate = db.queryOne('SELECT * FROM users WHERE username = ? AND id != ?', [username, userId]);
            if (duplicate) {
                return res.json({
                    success: false,
                    message: '用户名已被使用'
                });
            }
        }

        // 更新用户信息
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            db.execute(
                'UPDATE users SET username = ?, password = ? WHERE id = ?',
                [username || existing.username, hashedPassword, userId]
            );
        } else {
            db.execute(
                'UPDATE users SET username = ? WHERE id = ?',
                [username || existing.username, userId]
            );
        }
        db.saveDB();

        res.json({
            success: true,
            message: '用户更新成功'
        });
    } catch (error) {
        console.error('更新用户错误:', error);
        res.json({
            success: false,
            message: '更新用户失败'
        });
    }
});

/**
 * 删除用户
 * DELETE /api/users/:id
 */
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        await db.initDB();
        const userId = req.params.id;

        const existing = db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
        if (!existing) {
            return res.json({
                success: false,
                message: '用户不存在'
            });
        }

        // 不能删除cruiseven用户
        if (existing.username === 'cruiseven') {
            return res.json({
                success: false,
                message: '不能删除管理员账户'
            });
        }

        db.execute('DELETE FROM users WHERE id = ?', [userId]);
        db.saveDB();

        res.json({
            success: true,
            message: '用户删除成功'
        });
    } catch (error) {
        console.error('删除用户错误:', error);
        res.json({
            success: false,
            message: '删除用户失败'
        });
    }
});

/**
 * 更改用户状态
 * PUT /api/users/:id/status
 * 参数: status ('active' 或 'disabled')
 */
router.put('/:id/status', requireAdmin, async (req, res) => {
    try {
        await db.initDB();
        const userId = req.params.id;
        const { status } = req.body;

        if (!status || !['active', 'disabled'].includes(status)) {
            return res.json({
                success: false,
                message: '无效的状态值'
            });
        }

        const existing = db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
        if (!existing) {
            return res.json({
                success: false,
                message: '用户不存在'
            });
        }

        // 不能停用cruiseven用户
        if (existing.username === 'cruiseven' && status === 'disabled') {
            return res.json({
                success: false,
                message: '不能停用管理员账户'
            });
        }

        db.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
        db.saveDB();

        res.json({
            success: true,
            message: `用户${status === 'active' ? '启用' : '停用'}成功`
        });
    } catch (error) {
        console.error('更改用户状态错误:', error);
        res.json({
            success: false,
            message: '更改用户状态失败'
        });
    }
});

module.exports = router;
