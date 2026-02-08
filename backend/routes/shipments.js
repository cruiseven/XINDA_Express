/**
 * 发货记录管理路由模块
 * 功能：处理发货记录的增删改查、筛选和汇总统计
 */

const express = require('express');
const db = require('../db');

const router = express.Router();

/**
 * 获取所有发货记录列表
 * GET /api/shipments
 * 支持筛选参数: 
 *   - month: 按月份筛选 (格式: 2024-01)
 *   - carrier_id: 按承运人筛选
 *   - status: 按状态筛选
 *   - search: 搜索单号或备注
 */
router.get('/', async (req, res) => {
  try {
    await db.initDB();
    const { month, carrier_id, status, search } = req.query;
    
    let query = `
      SELECT 
        s.*,
        c.name as carrier_name,
        se.name as sender_name,
        a.recipient_name,
        a.recipient_phone,
        a.recipient_address
      FROM shipments s
      LEFT JOIN carriers c ON s.carrier_id = c.id
      LEFT JOIN senders se ON s.sender_id = se.id
      LEFT JOIN addresses a ON s.address_id = a.id
      WHERE 1=1
    `;
    
    const params = [];

    // 按月份筛选
    if (month) {
      query += ` AND strftime('%Y-%m', s.shipping_date) = ?`;
      params.push(month);
    }

    // 按承运人筛选
    if (carrier_id && carrier_id !== 'all') {
      query += ` AND s.carrier_id = ?`;
      params.push(parseInt(carrier_id));
    }

    // 按状态筛选
    if (status && status !== 'all') {
      query += ` AND s.status = ?`;
      params.push(status);
    }

    // 搜索筛选
    if (search) {
      query += ` AND (s.tracking_number LIKE ? OR s.notes LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY s.shipping_date DESC, s.created_at DESC`;

    const shipments = db.queryAll(query, params);

    res.json({
      success: true,
      data: shipments
    });

  } catch (error) {
    console.error('获取发货记录列表错误:', error);
    res.json({
      success: false,
      message: '获取发货记录列表失败'
    });
  }
});

/**
 * 获取发货记录汇总统计
 * GET /api/shipments/summary
 * 支持筛选参数: month, carrier_id
 */
router.get('/summary', async (req, res) => {
  try {
    await db.initDB();
    const { month, carrier_id } = req.query;

    // 按承运人和月份汇总
    let query = `
      SELECT 
        c.id as carrier_id,
        c.name as carrier_name,
        strftime('%Y-%m', s.shipping_date) as month,
        COUNT(*) as total_count,
        COALESCE(SUM(s.amount), 0) as total_amount,
        COALESCE(SUM(s.weight), 0) as total_weight
      FROM shipments s
      JOIN carriers c ON s.carrier_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (month) {
      query += ` AND strftime('%Y-%m', s.shipping_date) = ?`;
      params.push(month);
    }

    if (carrier_id && carrier_id !== 'all') {
      query += ` AND s.carrier_id = ?`;
      params.push(parseInt(carrier_id));
    }

    query += ` GROUP BY c.id, strftime('%Y-%m', s.shipping_date) ORDER BY month DESC, total_amount DESC`;

    const summary = db.queryAll(query, params);

    // 计算总计
    const totals = {
      total_count: summary.reduce((sum, item) => sum + item.total_count, 0),
      total_amount: summary.reduce((sum, item) => sum + item.total_amount, 0),
      total_weight: summary.reduce((sum, item) => sum + item.total_weight, 0)
    };

    res.json({
      success: true,
      data: {
        details: summary,
        totals: totals
      }
    });

  } catch (error) {
    console.error('获取汇总统计错误:', error);
    res.json({
      success: false,
      message: '获取汇总统计失败'
    });
  }
});

/**
 * 获取按月份统计
 * GET /api/shipments/monthly
 */
router.get('/monthly', async (req, res) => {
  try {
    await db.initDB();
    const query = `
      SELECT 
        strftime('%Y-%m', s.shipping_date) as month,
        COUNT(*) as total_count,
        COALESCE(SUM(s.amount), 0) as total_amount
      FROM shipments s
      GROUP BY strftime('%Y-%m', s.shipping_date)
      ORDER BY month DESC
    `;

    const monthly = db.queryAll(query);

    res.json({
      success: true,
      data: monthly
    });

  } catch (error) {
    console.error('获取月度统计错误:', error);
    res.json({
      success: false,
      message: '获取月度统计失败'
    });
  }
});

/**
 * 获取单个发货记录详情
 * GET /api/shipments/:id
 */
router.get('/:id', async (req, res) => {
  try {
    await db.initDB();
    const shipment = db.queryOne(`
      SELECT 
        s.*,
        c.name as carrier_name,
        se.name as sender_name,
        a.recipient_name,
        a.recipient_phone,
        a.recipient_address
      FROM shipments s
      LEFT JOIN carriers c ON s.carrier_id = c.id
      LEFT JOIN senders se ON s.sender_id = se.id
      LEFT JOIN addresses a ON s.address_id = a.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (!shipment) {
      return res.json({
        success: false,
        message: '发货记录不存在'
      });
    }

    res.json({
      success: true,
      data: shipment
    });
  } catch (error) {
    console.error('获取发货记录详情错误:', error);
    res.json({
      success: false,
      message: '获取发货记录详情失败'
    });
  }
});

/**
 * 添加新发货记录
 * POST /api/shipments
 * 参数: tracking_number, carrier_id, sender_id, address_id, weight, amount, shipping_date, notes, status
 */
router.post('/', async (req, res) => {
  try {
    await db.initDB();
    const { 
      tracking_number, 
      carrier_id, 
      sender_id, 
      address_id, 
      weight, 
      amount, 
      shipping_date, 
      notes,
      status 
    } = req.body;

    // 参数验证
    if (!tracking_number || !carrier_id || !sender_id || !address_id || !shipping_date) {
      return res.json({
        success: false,
        message: '单号、承运人、发件人、收货地址和发货日期都不能为空'
      });
    }

    // 检查单号是否已存在
    const existing = db.queryOne('SELECT * FROM shipments WHERE tracking_number = ?', [tracking_number]);
    if (existing) {
      return res.json({
        success: false,
        message: '该单号已存在，请勿重复添加'
      });
    }

    const result = db.execute(`
      INSERT INTO shipments (
        tracking_number, carrier_id, sender_id, address_id, 
        weight, amount, shipping_date, notes, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tracking_number,
      parseInt(carrier_id),
      parseInt(sender_id),
      parseInt(address_id),
      parseFloat(weight) || 0,
      parseFloat(amount) || 0,
      shipping_date,
      notes || '',
      status || '已发货'
    ]);
    db.saveDB();

    res.json({
      success: true,
      message: '发货记录添加成功',
      data: { id: result.lastInsertRowid }
    });

  } catch (error) {
    console.error('添加发货记录错误:', error);
    res.json({
      success: false,
      message: '添加发货记录失败'
    });
  }
});

/**
 * 更新发货记录
 * PUT /api/shipments/:id
 */
router.put('/:id', async (req, res) => {
  try {
    await db.initDB();
    const { 
      tracking_number, 
      carrier_id, 
      sender_id, 
      address_id, 
      weight, 
      amount, 
      shipping_date, 
      notes,
      status 
    } = req.body;
    
    const shipmentId = req.params.id;

    const existing = db.queryOne('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (!existing) {
      return res.json({
        success: false,
        message: '发货记录不存在'
      });
    }

    // 检查单号是否被其他记录使用
    if (tracking_number && tracking_number !== existing.tracking_number) {
      const duplicate = db.queryOne('SELECT * FROM shipments WHERE tracking_number = ? AND id != ?', [tracking_number, shipmentId]);
      if (duplicate) {
        return res.json({
          success: false,
          message: '该单号已被其他记录使用'
        });
      }
    }

    db.execute(`
      UPDATE shipments 
      SET tracking_number = ?,
          carrier_id = ?,
          sender_id = ?,
          address_id = ?,
          weight = ?,
          amount = ?,
          shipping_date = ?,
          notes = ?,
          status = ?
      WHERE id = ?
    `, [
      tracking_number || existing.tracking_number,
      carrier_id ? parseInt(carrier_id) : existing.carrier_id,
      sender_id ? parseInt(sender_id) : existing.sender_id,
      address_id ? parseInt(address_id) : existing.address_id,
      weight !== undefined ? parseFloat(weight) : existing.weight,
      amount !== undefined ? parseFloat(amount) : existing.amount,
      shipping_date || existing.shipping_date,
      notes !== undefined ? notes : existing.notes,
      status || existing.status,
      shipmentId
    ]);
    db.saveDB();

    res.json({
      success: true,
      message: '发货记录更新成功'
    });

  } catch (error) {
    console.error('更新发货记录错误:', error);
    res.json({
      success: false,
      message: '更新发货记录失败'
    });
  }
});

/**
 * 删除发货记录
 * DELETE /api/shipments/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    await db.initDB();
    const shipmentId = req.params.id;

    const existing = db.queryOne('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (!existing) {
      return res.json({
        success: false,
        message: '发货记录不存在'
      });
    }

    db.execute('DELETE FROM shipments WHERE id = ?', [shipmentId]);
    db.saveDB();

    res.json({
      success: true,
      message: '发货记录删除成功'
    });

  } catch (error) {
    console.error('删除发货记录错误:', error);
    res.json({
      success: false,
      message: '删除发货记录失败'
    });
  }
});

module.exports = router;
