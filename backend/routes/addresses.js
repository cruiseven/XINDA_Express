/**
 * 收货地址管理路由模块
 * 功能：处理收货地址的增删改查操作
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * 获取所有收货地址列表
 * GET /api/addresses
 */
router.get('/', async (req, res) => {
  try {
    await db.initDB();
    const addresses = db.queryAll('SELECT * FROM addresses ORDER BY created_at DESC');
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('获取收货地址列表错误:', error);
    res.json({
      success: false,
      message: '获取收货地址列表失败'
    });
  }
});

/**
 * 获取单个收货地址信息
 * GET /api/addresses/:id
 */
router.get('/:id', async (req, res) => {
  try {
    await db.initDB();
    const address = db.queryOne('SELECT * FROM addresses WHERE id = ?', [req.params.id]);
    
    if (!address) {
      return res.json({
        success: false,
        message: '收货地址不存在'
      });
    }

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('获取收货地址信息错误:', error);
    res.json({
      success: false,
      message: '获取收货地址信息失败'
    });
  }
});

/**
 * 添加新收货地址
 * POST /api/addresses
 * 参数: recipient_name, contact_person, recipient_phone, recipient_address
 */
router.post('/', async (req, res) => {
  try {
    await db.initDB();
    const { recipient_name, contact_person, recipient_phone, recipient_address } = req.body;

    console.log('添加收货地址收到的数据:', req.body);

    if (!recipient_name || !recipient_phone || !recipient_address) {
      return res.json({
        success: false,
        message: '收货人姓名、电话和地址都不能为空'
      });
    }

    const result = db.execute(
      'INSERT INTO addresses (recipient_name, contact_person, recipient_phone, recipient_address) VALUES (?, ?, ?, ?)',
      [recipient_name, contact_person || '', recipient_phone, recipient_address]
    );
    db.saveDB();

    // 验证插入的数据
    const inserted = db.queryOne('SELECT * FROM addresses WHERE id = ?', [result.lastInsertRowid]);
    console.log('插入后的数据:', inserted);

    res.json({
      success: true,
      message: '收货地址添加成功',
      data: { id: result.lastInsertRowid }
    });

  } catch (error) {
    console.error('添加收货地址错误:', error);
    res.json({
      success: false,
      message: '添加收货地址失败'
    });
  }
});

/**
 * 更新收货地址信息
 * PUT /api/addresses/:id
 */
router.put('/:id', async (req, res) => {
  try {
    await db.initDB();
    const { recipient_name, contact_person, recipient_phone, recipient_address } = req.body;
    const addressId = req.params.id;

    const existing = db.queryOne('SELECT * FROM addresses WHERE id = ?', [addressId]);
    if (!existing) {
      return res.json({
        success: false,
        message: '收货地址不存在'
      });
    }

    db.execute(
      'UPDATE addresses SET recipient_name = ?, contact_person = ?, recipient_phone = ?, recipient_address = ? WHERE id = ?',
      [
        recipient_name || existing.recipient_name,
        contact_person !== undefined ? contact_person : existing.contact_person,
        recipient_phone || existing.recipient_phone,
        recipient_address || existing.recipient_address,
        addressId
      ]
    );
    db.saveDB();

    res.json({
      success: true,
      message: '收货地址更新成功'
    });

  } catch (error) {
    console.error('更新收货地址错误:', error);
    res.json({
      success: false,
      message: '更新收货地址失败'
    });
  }
});

/**
 * 删除收货地址
 * DELETE /api/addresses/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await db.initDB();
    const addressId = req.params.id;

    const existing = db.queryOne('SELECT * FROM addresses WHERE id = ?', [addressId]);
    if (!existing) {
      return res.json({
        success: false,
        message: '收货地址不存在'
      });
    }

    // 检查是否有关联的发货记录
    const shipments = db.queryOne('SELECT COUNT(*) as count FROM shipments WHERE address_id = ?', [addressId]);
    if (shipments && shipments.count > 0) {
      return res.json({
        success: false,
        message: '该收货地址有关联的发货记录，无法删除'
      });
    }

    db.execute('DELETE FROM addresses WHERE id = ?', [addressId]);
    db.saveDB();

    res.json({
      success: true,
      message: '收货地址删除成功'
    });

  } catch (error) {
    console.error('删除收货地址错误:', error);
    res.json({
      success: false,
      message: '删除收货地址失败'
    });
  }
});

module.exports = router;
