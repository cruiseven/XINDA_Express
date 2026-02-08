/**
 * 发件人管理路由模块
 * 功能：处理发件人的增删改查操作
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * 获取所有发件人列表
 * GET /api/senders
 */
router.get('/', async (req, res) => {
  try {
    await db.initDB();
    const senders = db.queryAll('SELECT * FROM senders ORDER BY created_at DESC');
    res.json({
      success: true,
      data: senders
    });
  } catch (error) {
    console.error('获取发件人列表错误:', error);
    res.json({
      success: false,
      message: '获取发件人列表失败'
    });
  }
});

/**
 * 获取单个发件人信息
 * GET /api/senders/:id
 */
router.get('/:id', async (req, res) => {
  try {
    await db.initDB();
    const sender = db.queryOne('SELECT * FROM senders WHERE id = ?', [req.params.id]);
    
    if (!sender) {
      return res.json({
        success: false,
        message: '发件人不存在'
      });
    }

    res.json({
      success: true,
      data: sender
    });
  } catch (error) {
    console.error('获取发件人信息错误:', error);
    res.json({
      success: false,
      message: '获取发件人信息失败'
    });
  }
});

/**
 * 添加新发件人
 * POST /api/senders
 * 参数: name, phone, address
 */
router.post('/', async (req, res) => {
  try {
    await db.initDB();
    const { name, phone, address } = req.body;

    if (!name) {
      return res.json({
        success: false,
        message: '发件人名称不能为空'
      });
    }

    const result = db.execute(
      'INSERT INTO senders (name, phone, address) VALUES (?, ?, ?)',
      [name, phone || '', address || '']
    );
    db.saveDB();

    res.json({
      success: true,
      message: '发件人添加成功',
      data: { id: result.lastInsertRowid }
    });

  } catch (error) {
    console.error('添加发件人错误:', error);
    res.json({
      success: false,
      message: '添加发件人失败'
    });
  }
});

/**
 * 更新发件人信息
 * PUT /api/senders/:id
 */
router.put('/:id', async (req, res) => {
  try {
    await db.initDB();
    const { name, phone, address } = req.body;
    const senderId = req.params.id;

    const existing = db.queryOne('SELECT * FROM senders WHERE id = ?', [senderId]);
    if (!existing) {
      return res.json({
        success: false,
        message: '发件人不存在'
      });
    }

    db.execute(
      'UPDATE senders SET name = ?, phone = ?, address = ? WHERE id = ?',
      [
        name || existing.name,
        phone !== undefined ? phone : existing.phone,
        address !== undefined ? address : existing.address,
        senderId
      ]
    );
    db.saveDB();

    res.json({
      success: true,
      message: '发件人信息更新成功'
    });

  } catch (error) {
    console.error('更新发件人错误:', error);
    res.json({
      success: false,
      message: '更新发件人信息失败'
    });
  }
});

/**
 * 删除发件人
 * DELETE /api/senders/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await db.initDB();
    const senderId = req.params.id;

    const existing = db.queryOne('SELECT * FROM senders WHERE id = ?', [senderId]);
    if (!existing) {
      return res.json({
        success: false,
        message: '发件人不存在'
      });
    }

    // 检查是否有关联的发货记录
    const shipments = db.queryOne('SELECT COUNT(*) as count FROM shipments WHERE sender_id = ?', [senderId]);
    if (shipments && shipments.count > 0) {
      return res.json({
        success: false,
        message: '该发件人有关联的发货记录，无法删除'
      });
    }

    db.execute('DELETE FROM senders WHERE id = ?', [senderId]);
    db.saveDB();

    res.json({
      success: true,
      message: '发件人删除成功'
    });

  } catch (error) {
    console.error('删除发件人错误:', error);
    res.json({
      success: false,
      message: '删除发件人失败'
    });
  }
});

module.exports = router;
