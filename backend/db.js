/**
 * 数据库连接管理模块
 * 封装sql.js的操作，提供简化的API，并包含初始化逻辑
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let db = null;
const dbPath = path.join(__dirname, 'database.sqlite');

/**
 * 初始化数据库连接
 */
async function initDB() {
  if (db) return db;

  const SQL = await initSqlJs();

  // 检查数据库文件是否存在
  const dbExists = fs.existsSync(dbPath);

  if (dbExists) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 确保表结构存在（无论是否新库，都尝试运行建表语句，IF NOT EXISTS 会处理）
  await initTables(db);

  // 如果是新数据库或数据为空，初始化示例数据
  await initSeedData(db);

  return db;
}

/**
 * 初始化数据表结构
 */
async function initTables(database) {
  console.log('正在检查数据表...');

  // 创建用户表
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建承运人表
  database.run(`
    CREATE TABLE IF NOT EXISTS carriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建发件人表
  database.run(`
    CREATE TABLE IF NOT EXISTS senders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建收货地址表
  database.run(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_name TEXT NOT NULL,
      contact_person TEXT,
      recipient_phone TEXT NOT NULL,
      recipient_address TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 迁移：添加contact_person字段（如果不存在）
  try {
    database.run('ALTER TABLE addresses ADD COLUMN contact_person TEXT');
  } catch (e) {
    // 字段可能已存在，忽略错误
  }

  // 创建发货记录表
  database.run(`
    CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT UNIQUE NOT NULL,
      carrier_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      address_id INTEGER NOT NULL,
      weight REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT '已发货',
      shipping_date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (carrier_id) REFERENCES carriers(id),
      FOREIGN KEY (sender_id) REFERENCES senders(id),
      FOREIGN KEY (address_id) REFERENCES addresses(id)
    )
  `);

  console.log('数据表检查完成！');
}

/**
 * 初始化示例数据
 */
async function initSeedData(database) {
  // 检查是否已有用户数据
  const existingUserResult = database.exec('SELECT * FROM users WHERE username = ?', ['cruiseven']);
  const existingUser = existingUserResult.length > 0 ? existingUserResult[0].values[0] : null;

  if (!existingUser) {
    console.log('正在初始化示例数据...');
    // 创建管理员用户（密码：1qaz2wsx）
    const hashedPassword = bcrypt.hashSync('1qaz2wsx', 10);
    database.run('INSERT INTO users (username, password) VALUES (?, ?)', ['cruiseven', hashedPassword]);
    console.log('✓ 管理员用户创建成功 (用户名: cruiseven, 密码: 1qaz2wsx)');
  }

  // 检查是否已有承运人数据
  const existingCarriersResult = database.exec('SELECT COUNT(*) as count FROM carriers');
  const existingCarriers = existingCarriersResult.length > 0 ? existingCarriersResult[0].values[0][0] : 0;

  if (existingCarriers === 0) {
    database.run("INSERT INTO carriers (name, contact_person, phone, address) VALUES ('顺丰速运', '张经理', '13800138000', '北京市朝阳区顺丰总部')");
    database.run("INSERT INTO carriers (name, contact_person, phone, address) VALUES ('中通快递', '李主管', '13900139000', '上海市青浦区中通总部')");
    database.run("INSERT INTO carriers (name, contact_person, phone, address) VALUES ('圆通速递', '王经理', '13700137000', '广东省深圳市圆通大厦')");
    database.run("INSERT INTO carriers (name, contact_person, phone, address) VALUES ('韵达快递', '赵经理', '13600136000', '浙江省杭州市韵达园区')");
    database.run("INSERT INTO carriers (name, contact_person, phone, address) VALUES ('申通快递', '钱经理', '13500135000', '江苏省南京市申通大楼')");
    console.log('✓ 示例承运人数据创建成功');
  }

  // 检查是否已有发件人数据
  const existingSendersResult = database.exec('SELECT COUNT(*) as count FROM senders');
  const existingSenders = existingSendersResult.length > 0 ? existingSendersResult[0].values[0][0] : 0;

  if (existingSenders === 0) {
    database.run("INSERT INTO senders (name, phone, address) VALUES ('鑫达公司', '010-12345678', '北京市海淀区新技术大厦')");
    database.run("INSERT INTO senders (name, phone, address) VALUES ('仓库一部', '010-87654321', '北京市朝阳区仓库路1号')");
    database.run("INSERT INTO senders (name, phone, address) VALUES ('总部发货点', '010-11223344', '北京市西城区总部大街88号')");
    console.log('✓ 示例发件人数据创建成功');
  }

  // 检查是否已有收货地址数据
  const existingAddressesResult = database.exec('SELECT COUNT(*) as count FROM addresses');
  const existingAddresses = existingAddressesResult.length > 0 ? existingAddressesResult[0].values[0][0] : 0;

  if (existingAddresses === 0) {
    database.run("INSERT INTO addresses (recipient_name, contact_person, recipient_phone, recipient_address) VALUES ('李先生', '张三', '18611112222', '上海市浦东新区陆家嘴环路1000号')");
    database.run("INSERT INTO addresses (recipient_name, contact_person, recipient_phone, recipient_address) VALUES ('王女士', '李四', '18633334444', '广州市天河区体育西路189号')");
    database.run("INSERT INTO addresses (recipient_name, contact_person, recipient_phone, recipient_address) VALUES ('赵先生', '王五', '18655556666', '深圳市南山区科技园路100号')");
    database.run("INSERT INTO addresses (recipient_name, contact_person, recipient_phone, recipient_address) VALUES ('陈女士', '赵六', '18677778888', '杭州市西湖区文三路478号')");
    database.run("INSERT INTO addresses (recipient_name, contact_person, recipient_phone, recipient_address) VALUES ('刘先生', '陈七', '18699990000', '南京市鼓楼区中山北路200号')");
    console.log('✓ 示例收货地址数据创建成功');
  }

  // 如果进行了初始化，强制保存一次
  if (!existingUser || existingCarriers === 0) {
    saveDB();
  }
}

/**
 * 保存数据库到文件
 */
function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

/**
 * 执行查询，返回所有结果
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 */
function queryAll(sql, params = []) {
  if (!db) return [];

  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Query error:', error);
    return [];
  }
}

/**
 * 执行查询，返回单个结果
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 */
function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * 执行插入/更新/删除操作
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数
 * @returns {Object} { lastInsertRowid, changes }
 */
function execute(sql, params = []) {
  if (!db) return { lastInsertRowid: 0, changes: 0 };

  try {
    db.run(sql, params);
    const changes = db.getRowsModified();

    return {
      lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0]?.values[0][0] || 0,
      changes: changes
    };
  } catch (error) {
    console.error('Execute error:', error);
    return { lastInsertRowid: 0, changes: 0 };
  }
}

module.exports = {
  initDB,
  saveDB,
  queryAll,
  queryOne,
  execute,
  getDB: () => db
};
