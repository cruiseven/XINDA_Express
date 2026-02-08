/**
 * 承运人管理路由模块
 * 功能：处理承运人的增删改查操作
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * 获取所有承运人列表
 * GET /api/carriers
 */
router.get('/', async (req, res) => {
  try {
    await db.initDB();
    const carriers = db.queryAll('SELECT * FROM carriers ORDER BY created_at DESC');
    res.json({
      success: true,
      data: carriers
    });
  } catch (error) {
    console.error('获取承运人列表错误:', error);
    res.json({
      success: false,
      message: '获取承运人列表失败'
    });
  }
});

/**
 * 获取单个承运人信息
 * GET /api/carriers/:id
 */
router.get('/:id', async (req, res) => {
  try {
    await db.initDB();
    const carrier = db.queryOne('SELECT * FROM carriers WHERE id = ?', [req.params.id]);
    
    if (!carrier) {
      return res.json({
        success: false,
        message: '承运人不存在'
      });
    }

    res.json({
      success: true,
      data: carrier
    });
  } catch (error) {
    console.error('获取承运人信息错误:', error);
    res.json({
      success: false,
      message: '获取承运人信息失败'
    });
  }
});

/**
 * 添加新承运人
 * POST /api/carriers
 * 参数: name, contact_person, phone, address
 */
router.post('/', async (req, res) => {
  try {
    await db.initDB();
    const { name, contact_person, phone, address } = req.body;

    if (!name) {
      return res.json({
        success: false,
        message: '承运人名称不能为空'
      });
    }

    const result = db.execute(
      'INSERT INTO carriers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)',
      [name, contact_person || '', phone || '', address || '']
    );
    db.saveDB();

    res.json({
      success: true,
      message: '承运人添加成功',
      data: { id: result.lastInsertRowid }
    });

  } catch (error) {
    console.error('添加承运人错误:', error);
    res.json({
      success: false,
      message: '添加承运人失败'
    });
  }
});

/**
 * 更新承运人信息
 * PUT /api/carriers/:id
 */
router.put('/:id', async (req, res) => {
  try {
    await db.initDB();
    const { name, contact_person, phone, address } = req.body;
    const carrierId = req.params.id;

    const existing = db.queryOne('SELECT * FROM carriers WHERE id = ?', [carrierId]);
    if (!existing) {
      return res.json({
        success: false,
        message: '承运人不存在'
      });
    }

    db.execute(
      'UPDATE carriers SET name = ?, contact_person = ?, phone = ?, address = ? WHERE id = ?',
      [
        name || existing.name,
        contact_person !== undefined ? contact_person : existing.contact_person,
        phone !== undefined ? phone : existing.phone,
        address !== undefined ? address : existing.address,
        carrierId
      ]
    );
    db.saveDB();

    res.json({
      success: true,
      message: '承运人信息更新成功'
    });

  } catch (error) {
    console.error('更新承运人错误:', error);
    res.json({
      success: false,
      message: '更新承运人信息失败'
    });
  }
});

/**
 * 删除承运人
 * DELETE /api/carriers/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await db.initDB();
    const carrierId = req.params.id;

    const existing = db.queryOne('SELECT * FROM carriers WHERE id = ?', [carrierId]);
    if (!existing) {
      return res.json({
        success: false,
        message: '承运人不存在'
      });
    }

    // 检查是否有关联的发货记录
    const shipments = db.queryOne('SELECT COUNT(*) as count FROM shipments WHERE carrier_id = ?', [carrierId]);
    if (shipments && shipments.count > 0) {
      return res.json({
        success: false,
        message: '该承运人有关联的发货记录，无法删除'
      });
    }

    db.execute('DELETE FROM carriers WHERE id = ?', [carrierId]);
    db.saveDB();

    res.json({
      success: true,
      message: '承运人删除成功'
    });

  } catch (error) {
    console.error('删除承运人错误:', error);
    res.json({
      success: false,
      message: '删除承运人失败'
    });
  }
});

module.exports = router;
