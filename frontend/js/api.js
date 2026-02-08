/**
 * 新达快递发货管理系统 - API调用模块
 * 功能：封装所有后端API调用
 */

const API_BASE = '/api';

// 通用API调用函数
async function apiCall(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || '请求失败');
  }

  return data;
}

// ==================== 认证相关API ====================

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 */
async function login(username, password) {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

/**
 * 用户登出
 */
async function logout() {
  return apiCall('/auth/logout', {
    method: 'POST'
  });
}

/**
 * 检查登录状态
 */
async function checkAuth() {
  return apiCall('/auth/check');
}

/**
 * 修改密码
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 */
async function changePassword(oldPassword, newPassword) {
  return apiCall('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
  });
}

// ==================== 承运人相关API ====================

/**
 * 获取所有承运人列表
 */
async function getCarriers() {
  return apiCall('/carriers');
}

/**
 * 添加承运人
 * @param {Object} data - 承运人数据
 */
async function addCarrier(data) {
  return apiCall('/carriers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * 更新承运人
 * @param {number} id - 承运人ID
 * @param {Object} data - 更新数据
 */
async function updateCarrier(id, data) {
  return apiCall(`/carriers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * 删除承运人
 * @param {number} id - 承运人ID
 */
async function deleteCarrier(id) {
  return apiCall(`/carriers/${id}`, {
    method: 'DELETE'
  });
}

// ==================== 发件人相关API ====================

/**
 * 获取所有发件人列表
 */
async function getSenders() {
  return apiCall('/senders');
}

/**
 * 添加发件人
 * @param {Object} data - 发件人数据
 */
async function addSender(data) {
  return apiCall('/senders', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * 更新发件人
 * @param {number} id - 发件人ID
 * @param {Object} data - 更新数据
 */
async function updateSender(id, data) {
  return apiCall(`/senders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * 删除发件人
 * @param {number} id - 发件人ID
 */
async function deleteSender(id) {
  return apiCall(`/senders/${id}`, {
    method: 'DELETE'
  });
}

// ==================== 收货地址相关API ====================

/**
 * 获取所有收货地址列表
 */
async function getAddresses() {
  return apiCall('/addresses');
}

/**
 * 添加收货地址
 * @param {Object} data - 收货地址数据
 */
async function addAddress(data) {
  return apiCall('/addresses', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * 更新收货地址
 * @param {number} id - 地址ID
 * @param {Object} data - 更新数据
 */
async function updateAddress(id, data) {
  return apiCall(`/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * 删除收货地址
 * @param {number} id - 地址ID
 */
async function deleteAddress(id) {
  return apiCall(`/addresses/${id}`, {
    method: 'DELETE'
  });
}

// ==================== 快递物流查询API ====================

/**
 * 查询快递物流信息
 * @param {string} trackingNumber - 快递单号
 */
async function getTracking(trackingNumber) {
  try {
    var response = await fetch('https://uapis.cn/api/v1/misc/tracking/query?tracking_number=' + trackingNumber, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    var data = await response.json();
    
    if (data.tracks && data.tracks.length > 0) {
      var status = getStatusFromTracks(data.tracks);
      return {
        success: true,
        data: {
          tracking_number: trackingNumber,
          carrier: data.carrier_name || '未知',
          status: status,
          traces: data.tracks.map(function(track) {
            return {
              time: track.time,
              desc: track.context
            };
          }),
          update_time: new Date().toLocaleString('zh-CN')
        }
      };
    } else if (data.error || data.message) {
      return {
        success: false,
        message: data.message || data.error || '暂无物流信息'
      };
    } else {
      return {
        success: false,
        message: '暂无物流信息'
      };
    }
  } catch (error) {
    console.error('快递查询错误:', error);
    return {
      success: false,
      message: '查询失败，请检查网络'
    };
  }
}

/**
 * 根据物流轨迹判断当前状态
 * @param {Array} tracks - 物流轨迹
 */
function getStatusFromTracks(tracks) {
  if (!tracks || tracks.length === 0) return '未知';
  
  var latestContext = tracks[0].context.toLowerCase();
  
  if (latestContext.includes('已签收') || latestContext.includes('代签')) {
    return '已签收';
  } else if (latestContext.includes('派送') || latestContext.includes('投递')) {
    return '派送中';
  } else if (latestContext.includes('揽收') || latestContext.includes('揽件')) {
    return '已揽收';
  } else if (latestContext.includes('运输') || latestContext.includes('中转')) {
    return '运输中';
  } else if (latestContext.includes('退回') || latestContext.includes('退')) {
    return '退回';
  } else if (latestContext.includes('异常') || latestContext.includes('问题')) {
    return '异常';
  }
  
  return '运输中';
}

// ==================== 发货记录相关API ====================

/**
 * 获取发货记录列表
 * @param {Object} filters - 筛选条件
 */
async function getShipments(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiCall(`/shipments?${params}`);
}

/**
 * 获取发货记录汇总
 * @param {Object} filters - 筛选条件
 */
async function getShipmentSummary(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiCall(`/shipments/summary?${params}`);
}

/**
 * 获取月度统计
 */
async function getMonthlyStats() {
  return apiCall('/shipments/monthly');
}

/**
 * 获取单个发货记录详情
 * @param {number} id - 发货记录ID
 */
async function getShipment(id) {
  return apiCall(`/shipments/${id}`);
}

/**
 * 添加发货记录
 * @param {Object} data - 发货记录数据
 */
async function addShipment(data) {
  return apiCall('/shipments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * 更新发货记录
 * @param {number} id - 发货记录ID
 * @param {Object} data - 更新数据
 */
async function updateShipment(id, data) {
  return apiCall(`/shipments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * 删除发货记录
 * @param {number} id - 发货记录ID
 */
async function deleteShipment(id) {
  return apiCall(`/shipments/${id}`, {
    method: 'DELETE'
  });
}

// ==================== 用户管理相关API ====================

/**
 * 获取所有用户列表（仅限cruiseven）
 */
async function getUsers() {
  return apiCall('/users');
}

/**
 * 添加用户
 * @param {Object} data - 用户数据
 */
async function addUser(data) {
  return apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * 更新用户
 * @param {number} id - 用户ID
 * @param {Object} data - 更新数据
 */
async function updateUser(id, data) {
  return apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 */
async function deleteUser(id) {
  return apiCall(`/users/${id}`, {
    method: 'DELETE'
  });
}

/**
 * 更改用户状态
 * @param {number} id - 用户ID
 * @param {string} status - 状态 (active/disabled)
 */
async function updateUserStatus(id, status) {
  return apiCall(`/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

// ==================== 系统更新相关API ====================

/**
 * 获取当前版本信息
 */
async function getVersion() {
  return apiCall('/update/version');
}

/**
 * 检查GitHub最新版本
 */
async function checkUpdate() {
  return apiCall('/update/check');
}

/**
 * 执行系统更新
 */
async function executeUpdate() {
  return apiCall('/update/execute', {
    method: 'POST'
  });
}

/**
 * 获取更新日志
 */
async function getUpdateLogs() {
  return apiCall('/update/logs');
}
