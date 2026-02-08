/**
 * 新达快递发货管理系统 - 登录页面脚本
 * 功能：处理用户登录逻辑
 */

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
  // 检查是否已登录
  try {
    const authResult = await checkAuth();
    if (authResult.loggedIn) {
      // 已登录，跳转到主页
      window.location.href = '/';
      return;
    }
  } catch (error) {
    console.log('检查登录状态失败:', error);
  }

  // 绑定登录表单提交事件
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});

/**
 * 处理登录表单提交
 * @param {Event} event - 表单提交事件
 */
async function handleLogin(event) {
  event.preventDefault();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('errorMessage');
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');

  // 获取输入值
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // 验证输入
  if (!username || !password) {
    showError('用户名和密码不能为空');
    return;
  }

  // 显示加载状态
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  errorMessage.style.display = 'none';

  try {
    // 调用登录API
    const result = await login(username, password);

    if (result.success) {
      // 登录成功，跳转到主页
      window.location.href = '/';
    } else {
      // 登录失败，显示错误信息
      showError(result.message);
    }

  } catch (error) {
    // 捕获异常，显示错误信息
    showError(error.message || '登录失败，请稍后重试');
  } finally {
    // 恢复按钮状态
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

/**
 * 显示错误信息
 * @param {string} message - 错误消息
 */
function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
}
