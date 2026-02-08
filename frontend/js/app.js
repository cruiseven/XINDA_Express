/**
 * 新达快递发货管理系统 - 主应用脚本
 * 功能：处理页面交互、数据展示和业务逻辑
 */

// 全局状态管理
var currentUser = null;
var shipmentsData = [];
var carriersData = [];
var sendersData = [];
var addressesData = [];

// 保存原始showPage函数
var originalShowPage = null;

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', async function () {
  try {
    // 检查登录状态
    var authResult = await checkAuth();
    if (!authResult.loggedIn) {
      // 未登录，跳转到登录页
      window.location.href = '/login';
      return;
    }

    // 设置当前用户
    currentUser = authResult.data;
    document.getElementById('currentUser').textContent = '欢迎，' + currentUser.username;

    // 如果是cruiseven用户，显示系统配置菜单
    if (currentUser.username === 'cruiseven') {
      var systemNav = document.getElementById('systemNav');
      if (systemNav) {
        systemNav.style.display = 'flex';
      }
    }

    // 初始化应用
    await initApp();

    // 如果已登录用户是cruiseven，初始化系统配置页面
    if (currentUser.username === 'cruiseven') {
      await initSystemPage();
    }

  } catch (error) {
    console.error('初始化失败:', error);
    showToast('加载失败，请刷新页面重试');
  }
});

/**
 * 初始化应用
 */
async function initApp() {
  // 绑定导航事件
  bindNavigationEvents();

  // 绑定登出事件
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // 绑定筛选按钮事件
  var filterBtn = document.getElementById('filterBtn');
  if (filterBtn) {
    filterBtn.addEventListener('click', loadShipments);
  }

  // 绑定添加发货记录按钮
  var addShipmentBtn = document.getElementById('addShipmentBtn');
  if (addShipmentBtn) {
    addShipmentBtn.addEventListener('click', function() {
      showShipmentModal();
    });
  }

  // 绑定汇总月份筛选事件
  var summaryMonth = document.getElementById('summaryMonth');
  if (summaryMonth) {
    summaryMonth.addEventListener('change', loadSummary);
  }

  // 绑定导出按钮事件
  var exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
  }

  // 绑定承运人管理按钮
  var addCarrierBtn = document.getElementById('addCarrierBtn');
  if (addCarrierBtn) {
    addCarrierBtn.addEventListener('click', function() {
      showCarrierModal();
    });
  }

  // 绑定发件人管理按钮
  var addSenderBtn = document.getElementById('addSenderBtn');
  if (addSenderBtn) {
    addSenderBtn.addEventListener('click', function() {
      showSenderModal();
    });
  }

  // 绑定收货地址管理按钮
  var addAddressBtn = document.getElementById('addAddressBtn');
  if (addAddressBtn) {
    addAddressBtn.addEventListener('click', function() {
      showAddressModal();
    });
  }

  // 绑定用户管理按钮
  var addUserBtn = document.getElementById('addUserBtn');
  if (addUserBtn) {
    addUserBtn.addEventListener('click', function() {
      showUserModal();
    });
  }

  // 加载基础数据
  await loadBaseData();

  // 加载默认页面（发货记录）
  await navigateToPage('shipments');
}

/**
 * 加载基础数据（承运人、发件人、收货地址）
 */
async function loadBaseData() {
  try {
    var carriersResult = await getCarriers();
    var sendersResult = await getSenders();
    var addressesResult = await getAddresses();

    carriersData = carriersResult.data;
    sendersData = sendersResult.data;
    addressesData = addressesResult.data;

    // 初始化承运人筛选下拉框
    var filterCarrier = document.getElementById('filterCarrier');
    if (filterCarrier) {
      carriersData.forEach(function(carrier) {
        var option = document.createElement('option');
        option.value = carrier.id;
        option.textContent = carrier.name;
        filterCarrier.appendChild(option);
      });
    }

  } catch (error) {
    console.error('加载基础数据失败:', error);
    showToast('加载基础数据失败');
  }
}

// ==================== 导航管理 ====================

/**
 * 绑定导航菜单事件
 */
function bindNavigationEvents() {
  var navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(function(item) {
    item.addEventListener('click', async function(e) {
      e.preventDefault();
      var page = this.dataset.page;
      await navigateToPage(page);
    });
  });
}

/**
 * 导航到指定页面
 * @param {string} page - 页面标识
 */
async function navigateToPage(page) {
  // 更新导航状态
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // 更新页面显示
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
  });
  var targetPage = document.getElementById('page-' + page);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // 加载页面数据
  switch (page) {
    case 'shipments':
      await loadShipments();
      break;
    case 'summary':
      await loadSummary();
      break;
    case 'carriers':
      await loadCarriers();
      break;
    case 'senders':
      await loadSenders();
      break;
    case 'addresses':
      await loadAddresses();
      break;
    case 'system':
      // 系统配置页面由initSystemPage处理
      break;
  }
}

// ==================== 发货记录管理 ====================

/**
 * 加载发货记录列表
 */
async function loadShipments() {
  var month = document.getElementById('filterMonth').value;
  var carrierId = document.getElementById('filterCarrier').value;
  var status = document.getElementById('filterStatus').value;
  var search = document.getElementById('filterSearch').value;

  var filters = {};
  if (month) filters.month = month;
  if (carrierId && carrierId !== 'all') filters.carrier_id = carrierId;
  if (status && status !== 'all') filters.status = status;
  if (search) filters.search = search;

  try {
    var result = await getShipments(filters);
    shipmentsData = result.data;
    renderShipmentsTable(shipmentsData);

  } catch (error) {
    console.error('加载发货记录失败:', error);
    showToast('加载发货记录失败');
  }
}

/**
 * 渲染发货记录表格
 * @param {Array} data - 发货记录数据
 */
function renderShipmentsTable(data) {
  var tbody = document.getElementById('shipmentsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" class="empty-text">暂无发货记录</td></tr>';
    return;
  }

  data.forEach(function(item) {
    var tr = document.createElement('tr');
    var statusBadge = getStatusBadge(item.status);
    var notes = item.notes || '-';
    var weight = item.weight || '-';
    var amount = item.amount ? '¥' + item.amount : '-';
    var address = item.recipient_address || '-';

    tr.innerHTML = '<td>' + item.shipping_date + '</td>' +
      '<td>' + (item.carrier_name || '') + '</td>' +
      '<td>' + item.tracking_number + '</td>' +
      '<td>' + (item.sender_name || '') + '</td>' +
      '<td>' + (item.recipient_name || '') + '</td>' +
      '<td>' + (item.recipient_phone || '') + '</td>' +
      '<td class="td-address">' + address + '</td>' +
      '<td>' + weight + '</td>' +
      '<td>' + amount + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' + notes + '</td>' +
      '<td class="action-cell">' +
      '<button class="btn-icon tracking" onclick="showTracking(\'' + item.tracking_number + '\')" title="物流查询">🚚</button>' +
      '<button class="btn-icon edit" onclick="editShipment(' + item.id + ')" title="编辑">✏️</button>' +
      '<button class="btn-icon delete" onclick="deleteShipment(' + item.id + ')" title="删除">🗑️</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

/**
 * 获取状态标签HTML
 * @param {string} status - 状态
 */
function getStatusBadge(status) {
  var statusMap = {
    '已发货': 'status-blue',
    '运输中': 'status-yellow',
    '已签收': 'status-green',
    '退回': 'status-red'
  };
  return '<span class="status-badge ' + (statusMap[status] || '') + '">' + status + '</span>';
}

// ==================== 汇总统计 ====================

/**
 * 加载汇总统计
 */
async function loadSummary() {
  var month = document.getElementById('summaryMonth').value;

  var filters = {};
  if (month) filters.month = month;

  try {
    var result = await getShipmentSummary(filters);
    var summary = result.data;

    // 更新统计卡片
    document.getElementById('totalCount').textContent = summary.totals.total_count;
    document.getElementById('totalAmount').textContent = '¥' + summary.totals.total_amount.toFixed(2);
    document.getElementById('totalWeight').textContent = summary.totals.total_weight.toFixed(2) + ' kg';

    // 渲染汇总表格
    renderSummaryTable(summary.details);

  } catch (error) {
    console.error('加载汇总统计失败:', error);
    showToast('加载汇总统计失败');
  }
}

/**
 * 渲染汇总表格
 * @param {Array} data - 汇总数据
 */
function renderSummaryTable(data) {
  var tbody = document.getElementById('summaryTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-text">暂无统计数据</td></tr>';
    return;
  }

  data.forEach(function(item) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + item.carrier_name + '</td>' +
      '<td>' + item.month + '</td>' +
      '<td>' + item.total_count + '</td>' +
      '<td>¥' + item.total_amount.toFixed(2) + '</td>' +
      '<td>' + item.total_weight.toFixed(2) + '</td>';
    tbody.appendChild(tr);
  });
}

// ==================== 承运人管理 ====================

/**
 * 加载承运人列表
 */
async function loadCarriers() {
  try {
    var result = await getCarriers();
    renderCarriersTable(result.data);
  } catch (error) {
    console.error('加载承运人失败:', error);
    showToast('加载承运人失败');
  }
}

/**
 * 渲染承运人表格
 * @param {Array} data - 承运人数据
 */
function renderCarriersTable(data) {
  var tbody = document.getElementById('carriersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-text">暂无承运人</td></tr>';
    return;
  }

  data.forEach(function(item) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + item.id + '</td>' +
      '<td>' + item.name + '</td>' +
      '<td>' + (item.contact_person || '-') + '</td>' +
      '<td>' + (item.phone || '-') + '</td>' +
      '<td>' + (item.address || '-') + '</td>' +
      '<td>' + item.created_at + '</td>' +
      '<td class="action-cell">' +
      '<button class="btn-icon edit" onclick="editCarrier(' + item.id + ')" title="编辑">✏️</button>' +
      '<button class="btn-icon delete" onclick="deleteCarrier(' + item.id + ')" title="删除">🗑️</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

/**
 * 显示发货记录模态框
 * @param {Object} shipment - 发货记录数据（编辑时传入）
 */
function showShipmentModal(shipment) {
  shipment = shipment || null;
  var isEdit = shipment !== null;

  document.getElementById('modalTitle').textContent = isEdit ? '编辑发货记录' : '添加发货记录';

  // 构建承运人选项
  var carrierOptions = carriersData.map(function(c) {
    var selected = shipment && shipment.carrier_id === c.id ? ' selected' : '';
    return '<option value="' + c.id + '"' + selected + '>' + c.name + '</option>';
  }).join('');

  // 构建发件人选项
  var senderOptions = sendersData.map(function(s) {
    var selected = shipment && shipment.sender_id === s.id ? ' selected' : '';
    return '<option value="' + s.id + '"' + selected + '>' + s.name + '</option>';
  }).join('');

  // 构建收货地址选项
  var addressOptions = addressesData.map(function(a) {
    var displayText = a.recipient_name + ' - ' + a.recipient_phone;
    var fullInfo = displayText + ' 📍 ' + a.recipient_address;
    var selected = shipment && shipment.address_id === a.id ? ' selected' : '';
    return '<option value="' + displayText + '" data-id="' + a.id + '" data-full="' + fullInfo.replace(/"/g, '&quot;') + '"' + selected + '>' + fullInfo + '</option>';
  }).join('');

  var today = new Date().toISOString().split('T')[0];
  var formHtml = '<form id="shipmentForm">' +
    '<input type="hidden" name="id" value="' + (shipment ? shipment.id : '') + '">' +
    '<div class="form-row">' +
    '<div class="form-group">' +
    '<label>快递单号 *</label>' +
    '<input type="text" name="tracking_number" value="' + (shipment ? shipment.tracking_number : '') + '" required placeholder="请输入快递单号">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>发货日期 *</label>' +
    '<input type="date" name="shipping_date" value="' + (shipment ? shipment.shipping_date : today) + '" required>' +
    '</div>' +
    '</div>' +
    '<div class="form-row">' +
    '<div class="form-group">' +
    '<label>承运人 *</label>' +
    '<select name="carrier_id" required><option value="">请选择承运人</option>' + carrierOptions + '</select>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>发件人 *</label>' +
    '<select name="sender_id" required><option value="">请选择发件人</option>' + senderOptions + '</select>' +
    '</div>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>收货地址 *</label>' +
    '<input type="text" id="addressSearchInput" list="addressList" placeholder="输入姓名或电话搜索..." autocomplete="off" required>' +
    '<datalist id="addressList">' + addressOptions + '</datalist>' +
    '<input type="hidden" name="address_id" id="addressIdInput" value="' + (shipment ? shipment.address_id || '' : '') + '" required>' +
    '<div id="selectedAddressInfo" class="selected-address-info"></div>' +
    '</div>' +
    '<div class="form-row">' +
    '<div class="form-group">' +
    '<label>重量(kg)</label>' +
    '<input type="number" name="weight" value="' + (shipment ? shipment.weight : '') + '" step="0.1" min="0" placeholder="0.00">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>金额(元)</label>' +
    '<input type="number" name="amount" value="' + (shipment ? shipment.amount : '') + '" step="0.01" min="0" placeholder="0.00">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>状态</label>' +
    '<select name="status">' +
    '<option value="已发货"' + (shipment && shipment.status === '已发货' ? ' selected' : '') + '>已发货</option>' +
    '<option value="运输中"' + (shipment && shipment.status === '运输中' ? ' selected' : '') + '>运输中</option>' +
    '<option value="已签收"' + (shipment && shipment.status === '已签收' ? ' selected' : '') + '>已签收</option>' +
    '<option value="退回"' + (shipment && shipment.status === '退回' ? ' selected' : '') + '>退回</option>' +
    '</select>' +
    '</div>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>备注</label>' +
    '<textarea name="notes" rows="2" placeholder="请输入备注信息">' + (shipment ? shipment.notes : '') + '</textarea>' +
    '</div>' +
    '<div class="form-actions">' +
    '<button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>' +
    '<button type="submit" class="btn btn-primary">' + (isEdit ? '保存' : '添加') + '</button>' +
    '</div>' +
    '</form>';

  document.getElementById('modalBody').innerHTML = formHtml;
  openModal();

  // 如果是编辑模式，显示已选地址信息
  if (isEdit && shipment && shipment.address_id) {
    var selectedAddress = addressesData.find(function(a) { return a.id === parseInt(shipment.address_id); });
    if (selectedAddress) {
      var addressInput = document.getElementById('addressSearchInput');
      var addressInfo = document.getElementById('selectedAddressInfo');
      if (addressInput && addressInfo) {
        addressInput.value = selectedAddress.recipient_name + ' - ' + selectedAddress.recipient_phone;
        addressInfo.innerHTML = '<span class="address-preview">📍 ' + selectedAddress.recipient_address + '</span>';
      }
    }
  }

  // 收货地址搜索和选择逻辑
  var addressInput = document.getElementById('addressSearchInput');
  var addressIdInput = document.getElementById('addressIdInput');
  var addressInfo = document.getElementById('selectedAddressInfo');
  
  if (addressInput && addressIdInput) {
    addressInput.addEventListener('input', function() {
      var searchValue = this.value.trim().toLowerCase();
      var matchedOption = null;
      
      // 查找匹配的选项（姓名、电话、地址都可以匹配）
      var dataList = document.getElementById('addressList');
      if (dataList) {
        var options = dataList.querySelectorAll('option');
        for (var i = 0; i < options.length; i++) {
          var option = options[i];
          var optionValue = option.value.toLowerCase();
          var optionFull = option.getAttribute('data-full').toLowerCase();
          
          // 同时匹配：姓名、电话、地址
          var matches = searchValue === '' || 
                        optionValue.includes(searchValue) || 
                        optionFull.includes(searchValue);
          
          option.style.display = matches ? '' : 'none';
          
          // 如果完全匹配input的值，设置ID
          if (searchValue && optionValue === searchValue) {
            matchedOption = option;
          }
        }
      }
      
      if (matchedOption) {
        addressIdInput.value = matchedOption.getAttribute('data-id');
        var address = addressesData.find(function(a) { return a.id == matchedOption.getAttribute('data-id'); });
        if (address && addressInfo) {
          addressInfo.innerHTML = '<span class="address-preview">📍 ' + address.recipient_address + '</span>';
        }
      } else if (searchValue === '') {
        // 清空时也清空ID
        addressIdInput.value = '';
        if (addressInfo) {
          addressInfo.innerHTML = '';
        }
      }
    });
    
    addressInput.addEventListener('change', function() {
      var searchValue = this.value.trim();
      var dataList = document.getElementById('addressList');
      
      if (dataList && searchValue) {
        var options = dataList.querySelectorAll('option');
        for (var i = 0; i < options.length; i++) {
          var option = options[i];
          // 匹配姓名、电话或地址
          var optionValue = option.value.toLowerCase();
          var optionFull = option.getAttribute('data-full').toLowerCase();
          var searchLower = searchValue.toLowerCase();
          
          if (optionValue === searchLower || optionFull.includes(searchLower)) {
            addressIdInput.value = option.getAttribute('data-id');
            var address = addressesData.find(function(a) { return a.id == option.getAttribute('data-id'); });
            if (address && addressInfo) {
              addressInfo.innerHTML = '<span class="address-preview">📍 ' + address.recipient_address + '</span>';
            }
            break;
          }
        }
      }
    });
  }

  document.getElementById('shipmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 验证收货地址是否选择
    var addressId = document.getElementById('addressIdInput');
    if (!addressId || !addressId.value) {
      showToast('请选择或输入有效的收货地址');
      return;
    }
    
    var formData = new FormData(e.target);
    var data = {};
    formData.forEach(function(value, key) {
      data[key] = value;
    });

    try {
      if (isEdit) {
        await updateShipment(shipment.id, data);
        showToast('发货记录更新成功');
      } else {
        await addShipment(data);
        showToast('发货记录添加成功');
      }
      closeModal();
      await loadShipments();
    } catch (error) {
      showToast(error.message || '操作失败');
    }
  });
}

/**
 * 显示承运人模态框
 * @param {Object} carrier - 承运人数据（编辑时传入）
 */
function showCarrierModal(carrier) {
  carrier = carrier || null;
  var isEdit = carrier !== null;

  document.getElementById('modalTitle').textContent = isEdit ? '编辑承运人' : '添加承运人';

  var formHtml = '<form id="carrierForm">' +
    '<input type="hidden" name="id" value="' + (carrier ? carrier.id : '') + '">' +
    '<div class="form-group">' +
    '<label>承运人名称 *</label>' +
    '<input type="text" name="name" value="' + (carrier ? carrier.name : '') + '" required>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>联系人</label>' +
    '<input type="text" name="contact_person" value="' + (carrier ? carrier.contact_person || '' : '') + '">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>联系电话</label>' +
    '<input type="text" name="phone" value="' + (carrier ? carrier.phone || '' : '') + '">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>地址</label>' +
    '<textarea name="address" rows="2">' + (carrier ? carrier.address || '' : '') + '</textarea>' +
    '</div>' +
    '<div class="form-actions">' +
    '<button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>' +
    '<button type="submit" class="btn btn-primary">' + (isEdit ? '保存' : '添加') + '</button>' +
    '</div>' +
    '</form>';

  document.getElementById('modalBody').innerHTML = formHtml;
  openModal();

  document.getElementById('carrierForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var formData = new FormData(e.target);
    var data = {};
    formData.forEach(function(value, key) {
      data[key] = value;
    });

    try {
      if (isEdit) {
        await updateCarrier(carrier.id, data);
        showToast('承运人更新成功');
      } else {
        await addCarrier(data);
        showToast('承运人添加成功');
      }
      closeModal();
      await loadCarriers();
      await loadBaseData();
    } catch (error) {
      showToast(error.message || '操作失败');
    }
  });
}

/**
 * 编辑承运人
 * @param {number} id - 承运人ID
 */
async function editCarrier(id) {
  var carrier = carriersData.find(function(c) { return c.id === id; });
  if (carrier) {
    showCarrierModal(carrier);
  }
}

/**
 * 删除承运人
 * @param {number} id - 承运人ID
 */
async function deleteCarrier(id) {
  if (!confirm('确定要删除该承运人吗？')) return;

  try {
    await deleteCarrier(id);
    showToast('承运人删除成功');
    await loadCarriers();
    await loadBaseData();
  } catch (error) {
    showToast(error.message || '删除失败');
  }
}

/**
 * 编辑发货记录
 * @param {number} id - 发货记录ID
 */
async function editShipment(id) {
  var shipment = shipmentsData.find(function(s) { return s.id === id; });
  if (shipment) {
    showShipmentModal(shipment);
  }
}

/**
 * 删除发货记录
 * @param {number} id - 发货记录ID
 */
async function deleteShipment(id) {
  if (!confirm('确定要删除该发货记录吗？')) return;

  try {
    await deleteShipment(id);
    showToast('发货记录删除成功');
    await loadShipments();
  } catch (error) {
    showToast(error.message || '删除失败');
  }
}

// ==================== 发件人管理 ====================

/**
 * 加载发件人列表
 */
async function loadSenders() {
  try {
    var result = await getSenders();
    renderSendersTable(result.data);
  } catch (error) {
    console.error('加载发件人失败:', error);
    showToast('加载发件人失败');
  }
}

/**
 * 渲染发件人表格
 * @param {Array} data - 发件人数据
 */
function renderSendersTable(data) {
  var tbody = document.getElementById('sendersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-text">暂无发件人</td></tr>';
    return;
  }

  data.forEach(function(item) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + item.id + '</td>' +
      '<td>' + item.name + '</td>' +
      '<td>' + (item.phone || '-') + '</td>' +
      '<td>' + (item.address || '-') + '</td>' +
      '<td>' + item.created_at + '</td>' +
      '<td class="action-cell">' +
      '<button class="btn-icon edit" onclick="editSender(' + item.id + ')" title="编辑">✏️</button>' +
      '<button class="btn-icon delete" onclick="deleteSender(' + item.id + ')" title="删除">🗑️</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

/**
 * 显示发件人模态框
 * @param {Object} sender - 发件人数据（编辑时传入）
 */
function showSenderModal(sender) {
  sender = sender || null;
  var isEdit = sender !== null;

  document.getElementById('modalTitle').textContent = isEdit ? '编辑发件人' : '添加发件人';

  var formHtml = '<form id="senderForm">' +
    '<input type="hidden" name="id" value="' + (sender ? sender.id : '') + '">' +
    '<div class="form-group">' +
    '<label>发件人名称 *</label>' +
    '<input type="text" name="name" value="' + (sender ? sender.name : '') + '" required>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>联系电话</label>' +
    '<input type="text" name="phone" value="' + (sender ? sender.phone || '' : '') + '">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>地址</label>' +
    '<textarea name="address" rows="2">' + (sender ? sender.address || '' : '') + '</textarea>' +
    '</div>' +
    '<div class="form-actions">' +
    '<button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>' +
    '<button type="submit" class="btn btn-primary">' + (isEdit ? '保存' : '添加') + '</button>' +
    '</div>' +
    '</form>';

  document.getElementById('modalBody').innerHTML = formHtml;
  openModal();

  document.getElementById('senderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var formData = new FormData(e.target);
    var data = {};
    formData.forEach(function(value, key) {
      data[key] = value;
    });

    try {
      if (isEdit) {
        await updateSender(sender.id, data);
        showToast('发件人更新成功');
      } else {
        await addSender(data);
        showToast('发件人添加成功');
      }
      closeModal();
      await loadSenders();
      await loadBaseData();
    } catch (error) {
      showToast(error.message || '操作失败');
    }
  });
}

/**
 * 编辑发件人
 * @param {number} id - 发件人ID
 */
async function editSender(id) {
  var sender = sendersData.find(function(s) { return s.id === id; });
  if (sender) {
    showSenderModal(sender);
  }
}

/**
 * 删除发件人
 * @param {number} id - 发件人ID
 */
async function deleteSender(id) {
  if (!confirm('确定要删除该发件人吗？')) return;

  try {
    await deleteSender(id);
    showToast('发件人删除成功');
    await loadSenders();
    await loadBaseData();
  } catch (error) {
    showToast(error.message || '删除失败');
  }
}

// ==================== 收货地址管理 ====================

/**
 * 加载收货地址列表
 */
async function loadAddresses() {
  try {
    var result = await getAddresses();
    renderAddressesTable(result.data);
  } catch (error) {
    console.error('加载收货地址失败:', error);
    showToast('加载收货地址失败');
  }
}

/**
 * 渲染收货地址表格
 * @param {Array} data - 收货地址数据
 */
function renderAddressesTable(data) {
  var tbody = document.getElementById('addressesTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-text">暂无收货地址</td></tr>';
    return;
  }

  data.forEach(function(item) {
    var tr = document.createElement('tr');
    var contactPerson = item.contact_person && item.contact_person !== 'null' ? item.contact_person : '-';
    tr.innerHTML = '<td>' + item.id + '</td>' +
      '<td>' + (item.recipient_name || '-') + '</td>' +
      '<td>' + contactPerson + '</td>' +
      '<td>' + (item.recipient_phone || '-') + '</td>' +
      '<td>' + (item.recipient_address || '-') + '</td>' +
      '<td>' + item.created_at + '</td>' +
      '<td class="action-cell">' +
      '<button class="btn-icon edit" onclick="editAddress(' + item.id + ')" title="编辑">✏️</button>' +
      '<button class="btn-icon delete" onclick="deleteAddress(' + item.id + ')" title="删除">🗑️</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

/**
 * 显示收货地址模态框
 * @param {Object} address - 收货地址数据（编辑时传入）
 */
function showAddressModal(address) {
  address = address || null;
  var isEdit = address !== null;

  document.getElementById('modalTitle').textContent = isEdit ? '编辑收货地址' : '添加收货地址';

  var formHtml = '<form id="addressForm">' +
    '<input type="hidden" name="id" value="' + (address ? address.id : '') + '">' +
    '<div class="form-row">' +
    '<div class="form-group">' +
    '<label>收货人（公司抬头）*</label>' +
    '<input type="text" name="recipient_name" value="' + (address ? address.recipient_name || '' : '') + '" required placeholder="如：鑫达机械">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>联系人 *</label>' +
    '<input type="text" name="contact_person" value="' + (address && address.contact_person && address.contact_person !== 'null' ? address.contact_person : '') + '" required placeholder="实际联系人姓名">' +
    '</div>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>联系电话 *</label>' +
    '<input type="text" name="recipient_phone" value="' + (address ? address.recipient_phone : '') + '" required placeholder="手机号或电话号码">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>收货地址 *</label>' +
    '<textarea name="recipient_address" rows="2" required placeholder="详细收货地址">' + (address ? address.recipient_address : '') + '</textarea>' +
    '</div>' +
    '<div class="form-actions">' +
    '<button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>' +
    '<button type="submit" class="btn btn-primary">' + (isEdit ? '保存' : '添加') + '</button>' +
    '</div>' +
    '</form>';

  document.getElementById('modalBody').innerHTML = formHtml;
  openModal();

  document.getElementById('addressForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var formData = new FormData(e.target);
    var data = {};
    formData.forEach(function(value, key) {
      data[key] = value;
    });

    try {
      if (isEdit) {
        await updateAddress(address.id, data);
        showToast('收货地址更新成功');
      } else {
        await addAddress(data);
        showToast('收货地址添加成功');
      }
      closeModal();
      await loadAddresses();
      await loadBaseData();
    } catch (error) {
      showToast(error.message || '操作失败');
    }
  });
}

/**
 * 编辑收货地址
 * @param {number} id - 地址ID
 */
async function editAddress(id) {
  var address = addressesData.find(function(a) { return a.id === id; });
  if (address) {
    showAddressModal(address);
  }
}

/**
 * 删除收货地址
 * @param {number} id - 地址ID
 */
async function deleteAddress(id) {
  if (!confirm('确定要删除该收货地址吗？')) return;

  try {
    await deleteAddress(id);
    showToast('收货地址删除成功');
    await loadAddresses();
    await loadBaseData();
  } catch (error) {
    showToast(error.message || '删除失败');
  }
}

// ==================== 用户认证 ====================

/**
 * 处理用户登出
 */
async function handleLogout() {
  try {
    await logout();
    window.location.href = '/login';
  } catch (error) {
    console.error('登出失败:', error);
    window.location.href = '/login';
  }
}

// ==================== 模态框管理 ====================

/**
 * 打开模态框
 */
function openModal() {
  var modal = document.getElementById('modal');
  modal.style.display = 'flex';
}

/**
 * 关闭模态框
 */
function closeModal() {
  var modal = document.getElementById('modal');
  modal.style.display = 'none';
}

/**
 * 点击模态框外部关闭
 */
document.addEventListener('click', function(e) {
  var modal = document.getElementById('modal');
  if (e.target === modal) {
    closeModal();
  }
});

// ==================== 提示信息 ====================

/**
 * 显示提示信息
 * @param {string} message - 提示消息
 */
function showToast(message) {
  var toast = document.getElementById('toast');
  var toastMessage = document.getElementById('toastMessage');

  toastMessage.textContent = message;
  toast.style.display = 'block';
  toast.style.opacity = '1';

  // 3秒后自动消失
  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() {
      toast.style.display = 'none';
    }, 300);
  }, 3000);
}

// ==================== 数据导出 ====================

/**
 * 导出发货记录为CSV格式
 */
function exportToCSV() {
  if (shipmentsData.length === 0) {
    showToast('没有可导出的数据');
    return;
  }

  var headers = ['发货日期', '承运人', '单号', '发件人', '收货人', '收货电话', '收货地址', '重量(kg)', '金额(元)', '状态', '备注'];

  var rows = shipmentsData.map(function(item) {
    return [
      item.shipping_date,
      item.carrier_name || '',
      item.tracking_number,
      item.sender_name || '',
      item.recipient_name || '',
      item.recipient_phone || '',
      item.recipient_address || '',
      item.weight || '',
      item.amount || '',
      item.status,
      item.notes || ''
    ];
  });

  var csvContent = headers.join(',') + '\n';

  rows.forEach(function(row) {
    csvContent += row.map(function(cell) {
      return '"' + String(cell).replace(/"/g, '""') + '"';
    }).join(',') + '\n';
  });

  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  var url = URL.createObjectURL(blob);

  var date = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', '发货记录_' + date + '.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('数据导出成功');
}

// ==================== GitHub自动更新 ====================

/**
 * 初始化系统配置页面
 */
async function initSystemPage() {
  // 绑定检查更新按钮
  var checkUpdateBtn = document.getElementById('checkUpdateBtn');
  if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', checkForUpdates);
  }

  // 绑定更新按钮
  var updateBtn = document.getElementById('updateBtn');
  if (updateBtn) {
    updateBtn.addEventListener('click', performUpdate);
  }

  // 加载当前版本
  await loadCurrentVersion();
}

/**
 * 加载当前版本信息
 */
async function loadCurrentVersion() {
  try {
    var versionResult = await getVersion();
    if (versionResult.success) {
      document.getElementById('currentVersion').textContent = versionResult.data.currentVersion;
      document.getElementById('githubRepo').textContent = versionResult.data.githubRepo || '未配置';
    }
  } catch (error) {
    console.error('加载版本信息失败:', error);
  }

  // 自动检查更新
  await checkForUpdates();
}

/**
 * 检查GitHub是否有新版本
 */
async function checkForUpdates() {
  var latestVersionSpan = document.getElementById('latestVersion');
  var updateBtn = document.getElementById('updateBtn');
  
  latestVersionSpan.textContent = '检查中...';
  latestVersionSpan.className = 'loading';
  updateBtn.style.display = 'none';

  try {
    var checkResult = await checkUpdate();
    
    if (checkResult.success) {
      var latestVersion = checkResult.data.latestVersion;
      var currentVersion = checkResult.data.currentVersion;
      
      latestVersionSpan.textContent = latestVersion;
      
      if (latestVersion !== currentVersion) {
        latestVersionSpan.className = 'new-version';
        latestVersionSpan.textContent += ' (有新版本!)';
        updateBtn.style.display = 'inline-block';
        showUpdateLog('发现新版本: ' + latestVersion, 'success');
      } else {
        latestVersionSpan.className = 'no-update';
        latestVersionSpan.textContent += ' (已是最新)';
        showUpdateLog('当前已是最新版本: ' + currentVersion, 'info');
      }
    } else {
      latestVersionSpan.textContent = checkResult.message || '检查失败';
      latestVersionSpan.className = 'error';
    }
  } catch (error) {
    latestVersionSpan.textContent = '检查失败';
    latestVersionSpan.className = 'error';
    showUpdateLog('检查更新失败: ' + error.message, 'error');
  }
}

/**
 * 执行系统更新
 */
async function performUpdate() {
  var updateBtn = document.getElementById('updateBtn');
  var checkUpdateBtn = document.getElementById('checkUpdateBtn');
  
  updateBtn.disabled = true;
  updateBtn.textContent = '更新中...';
  checkUpdateBtn.disabled = true;
  
  showUpdateLog('开始执行更新...', 'info');

  try {
    var updateResult = await executeUpdate();
    
    if (updateResult.success) {
      showUpdateLog('更新已启动!', 'success');
      showUpdateLog('新版本: ' + updateResult.data.newVersion, 'success');
      showUpdateLog('请刷新页面查看新版本信息', 'warning');
      
      updateBtn.textContent = '✅ 更新完成';
      updateBtn.disabled = false;
      
      // 3秒后刷新页面
      setTimeout(function() {
        window.location.reload();
      }, 3000);
    } else {
      showUpdateLog('更新失败: ' + updateResult.message, 'error');
      updateBtn.textContent = '⬇️ 立即更新';
      updateBtn.disabled = false;
    }
  } catch (error) {
    showUpdateLog('更新失败: ' + error.message, 'error');
    updateBtn.textContent = '⬇️ 立即更新';
    updateBtn.disabled = false;
  }
  
  checkUpdateBtn.disabled = false;
}

/**
 * 显示更新日志
 * @param {string} message - 日志消息
 * @param {string} type - 日志类型 (success, error, info, warning)
 */
function showUpdateLog(message, type) {
  var updateLog = document.getElementById('updateLog');
  if (!updateLog) return;
  
  var timestamp = new Date().toLocaleString('zh-CN');
  var logEntry = '<span class="' + type + '">[' + timestamp + '] ' + message + '</span>\n';
  
  updateLog.innerHTML = logEntry + updateLog.innerHTML;
}

// 暴露全局函数
window.navigateToPage = navigateToPage;
window.showShipmentModal = showShipmentModal;
window.showCarrierModal = showCarrierModal;
window.showSenderModal = showSenderModal;
window.showAddressModal = showAddressModal;
window.showUserModal = showUserModal;
window.editShipment = editShipment;
window.editCarrier = editCarrier;
window.editSender = editSender;
window.editAddress = editAddress;
window.editUser = editUser;
window.deleteShipment = deleteShipment;
window.deleteCarrier = deleteCarrier;
window.deleteSender = deleteSender;
window.deleteAddress = deleteAddress;
window.deleteUser = deleteUser;
window.closeModal = closeModal;

// ==================== 用户管理 ====================

/**
 * 加载用户列表
 */
async function loadUsers() {
  try {
    var result = await getUsers();
    renderUsersTable(result.data);
  } catch (error) {
    console.error('加载用户失败:', error);
    showToast('加载用户失败');
  }
}

/**
 * 渲染用户表格
 * @param {Array} data - 用户数据
 */
function renderUsersTable(data) {
  var tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-text">暂无用户</td></tr>';
    return;
  }

  data.forEach(function(item) {
    var statusBadge = item.status === 'active' 
      ? '<span class="status-badge status-green">正常</span>'
      : '<span class="status-badge status-red">禁用</span>';
    
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + item.id + '</td>' +
      '<td>' + item.username + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' + item.created_at + '</td>' +
      '<td class="action-cell">' +
      '<button class="btn-icon edit" onclick="editUser(' + item.id + ')" title="编辑">✏️</button>' +
      '<button class="btn-icon delete" onclick="deleteUser(' + item.id + ')" title="删除">🗑️</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

/**
 * 显示用户模态框
 * @param {Object} user - 用户数据（编辑时传入）
 */
function showUserModal(user) {
  user = user || null;
  var isEdit = user !== null;

  document.getElementById('modalTitle').textContent = isEdit ? '编辑用户' : '添加用户';

  var statusOptions = '';
  if (isEdit) {
    statusOptions = '<select name="status">' +
      '<option value="active"' + (user.status === 'active' ? ' selected' : '') + '>正常</option>' +
      '<option value="disabled"' + (user.status === 'disabled' ? ' selected' : '') + '>禁用</option>' +
      '</select>';
  }

  var formHtml = '<form id="userForm">' +
    '<input type="hidden" name="id" value="' + (user ? user.id : '') + '">' +
    '<div class="form-group">' +
    '<label>用户名 *</label>' +
    '<input type="text" name="username" value="' + (user ? user.username : '') + '" required ' + (isEdit ? 'readonly' : '') + '>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>密码 ' + (isEdit ? '(留空不修改)' : '*') + '</label>' +
    '<input type="password" name="password" ' + (isEdit ? '' : 'required') + ' placeholder="' + (isEdit ? '留空不修改' : '请输入密码') + '">' +
    '</div>' +
    (isEdit ? '<div class="form-group"><label>状态</label>' + statusOptions + '</div>' : '') +
    '<div class="form-actions">' +
    '<button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>' +
    '<button type="submit" class="btn btn-primary">' + (isEdit ? '保存' : '添加') + '</button>' +
    '</div>' +
    '</form>';

  document.getElementById('modalBody').innerHTML = formHtml;
  openModal();

  document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var formData = new FormData(e.target);
    var data = {};
    formData.forEach(function(value, key) {
      data[key] = value;
    });

    try {
      if (isEdit) {
        await updateUser(user.id, data);
        showToast('用户更新成功');
      } else {
        await addUser(data);
        showToast('用户添加成功');
      }
      closeModal();
      await loadUsers();
    } catch (error) {
      showToast(error.message || '操作失败');
    }
  });
}

/**
 * 编辑用户
 * @param {number} id - 用户ID
 */
async function editUser(id) {
  try {
    var result = await getUsers();
    var user = result.data.find(function(u) { return u.id === id; });
    if (user) {
      showUserModal(user);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    showToast('获取用户信息失败');
  }
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 */
async function deleteUser(id) {
  if (!confirm('确定要删除该用户吗？')) return;

  try {
    await deleteUser(id);
    showToast('用户删除成功');
    await loadUsers();
  } catch (error) {
    showToast(error.message || '删除失败');
  }
}

// 扩展navigateToPage以支持用户管理页面
var originalNavigateToPage = navigateToPage;
navigateToPage = async function(page) {
  await originalNavigateToPage(page);
  
  if (page === 'system') {
    await loadUsers();
  }
};

// ==================== 快递物流查询 ====================

/**
 * 显示物流信息模态框
 * @param {string} trackingNumber - 快递单号
 */
async function showTracking(trackingNumber) {
  document.getElementById('modalTitle').textContent = '物流查询';
  
  var formHtml = '<div class="tracking-modal">' +
    '<div class="tracking-header">' +
    '<div class="tracking-number">单号：<strong>' + trackingNumber + '</strong></div>' +
    '<div id="trackingStatus" class="tracking-status">查询中...</div>' +
    '</div>' +
    '<div id="trackingInfo" class="tracking-info">' +
    '<div class="loading-spinner"></div>' +
    '</div>' +
    '</div>';
  
  document.getElementById('modalBody').innerHTML = formHtml;
  openModal();
  
  // 查询物流信息
  try {
    var result = await getTracking(trackingNumber);
    
    var trackingInfo = document.getElementById('trackingInfo');
    
    if (result.success) {
      var data = result.data;
      var statusClass = getTrackingStatusClass(data.status);
      
      document.getElementById('trackingStatus').innerHTML = 
        '<span class="tracking-carrier">快递公司：' + data.carrier + '</span>' +
        '<span class="' + statusClass + '">' + data.status + '</span>';
      
      if (data.traces && data.traces.length > 0) {
        var tracesHtml = '<div class="tracking-timeline">';
        data.traces.forEach(function(trace) {
          tracesHtml += '<div class="trace-item">' +
            '<div class="trace-time">' + trace.time + '</div>' +
            '<div class="trace-content">' + trace.desc + '</div>' +
            '</div>';
        });
        tracesHtml += '</div>';
        trackingInfo.innerHTML = tracesHtml;
      } else {
        trackingInfo.innerHTML = '<div class="empty-text">暂无物流轨迹信息</div>';
      }
      
      trackingInfo.innerHTML += '<div class="tracking-footer">更新时间：' + data.update_time + '</div>';
    } else {
      document.getElementById('trackingStatus').innerHTML = '<span class="error">查询失败</span>';
      trackingInfo.innerHTML = '<div class="empty-text">' + result.message + '</div>';
    }
  } catch (error) {
    console.error('物流查询错误:', error);
    document.getElementById('trackingStatus').innerHTML = '<span class="error">查询失败</span>';
    document.getElementById('trackingInfo').innerHTML = '<div class="empty-text">查询失败，请稍后重试</div>';
  }
}

/**
 * 获取物流状态样式类
 * @param {string} status - 状态
 */
function getTrackingStatusClass(status) {
  var statusMap = {
    '已签收': 'status-green',
    '派送中': 'status-blue',
    '运输中': 'status-yellow',
    '揽收': 'status-blue',
    '退回': 'status-red',
    '异常': 'status-red'
  };
  return 'tracking-status-badge ' + (statusMap[status] || '');
}

// 暴露物流查询函数到全局
window.showTracking = showTracking;
