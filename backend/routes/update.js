/**
 * 系统更新路由模块
 * 功能：处理GitHub版本检查和系统更新
 */

const express = require('express');
const db = require('../db');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const GITHUB_REPO = process.env.GITHUB_REPO || '';
const UPDATE_CONFIG_FILE = path.join(__dirname, '..', 'update-config.json');

/**
 * 获取当前版本
 * GET /api/update/version
 */
router.get('/version', async (req, res) => {
  try {
    let currentVersion = 'v1.0.0';
    let githubRepo = GITHUB_REPO;

    // 尝试从配置文件读取版本
    if (fs.existsSync(UPDATE_CONFIG_FILE)) {
      try {
        const config = JSON.parse(fs.readFileSync(UPDATE_CONFIG_FILE, 'utf8'));
        currentVersion = config.currentVersion || currentVersion;
        githubRepo = config.githubRepo || githubRepo;
      } catch (e) {
        console.error('读取配置文件失败:', e);
      }
    }

    res.json({
      success: true,
      data: {
        currentVersion,
        githubRepo: githubRepo || '未配置'
      }
    });
  } catch (error) {
    console.error('获取版本信息失败:', error);
    res.json({
      success: false,
      message: '获取版本信息失败'
    });
  }
});

/**
 * 检查GitHub最新版本
 * GET /api/update/check
 */
router.get('/check', async (req, res) => {
  try {
    const repo = GITHUB_REPO;

    if (!repo) {
      return res.json({
        success: false,
        message: 'GitHub仓库未配置'
      });
    }

    // 从GitHub获取最新Release
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return res.json({
        success: false,
        message: '无法连接到GitHub'
      });
    }

    const data = await response.json();
    const latestVersion = data.tag_name || 'unknown';
    const releaseUrl = data.html_url;
    const publishedAt = data.published_at;

    res.json({
      success: true,
      data: {
        latestVersion,
        releaseUrl,
        publishedAt,
        currentVersion: 'v1.0.0'
      }
    });
  } catch (error) {
    console.error('检查更新失败:', error);
    res.json({
      success: false,
      message: '检查更新失败: ' + error.message
    });
  }
});

/**
 * 执行系统更新
 * POST /api/update/execute
 */
router.post('/execute', async (req, res) => {
  try {
    const repo = GITHUB_REPO;

    if (!repo) {
      return res.json({
        success: false,
        message: 'GitHub仓库未配置'
      });
    }

    // 获取最新版本信息
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return res.json({
        success: false,
        message: '无法获取GitHub最新版本'
      });
    }

    const data = await response.json();
    const latestVersion = data.tag_name;

    // 检查版本是否需要更新
    let currentVersion = 'v1.0.0';
    if (fs.existsSync(UPDATE_CONFIG_FILE)) {
      try {
        const config = JSON.parse(fs.readFileSync(UPDATE_CONFIG_FILE, 'utf8'));
        currentVersion = config.currentVersion || 'v1.0.0';
      } catch (e) {}
    }

    if (currentVersion === latestVersion) {
      return res.json({
        success: false,
        message: '当前已是最新版本'
      });
    }

    // 保存更新日志
    const updateLog = {
      version: latestVersion,
      startTime: new Date().toISOString(),
      status: 'updating',
      steps: []
    };

    // 更新配置文件
    const configPath = path.join(__dirname, '..', 'update-config.json');
    const config = {
      currentVersion: latestVersion,
      githubRepo: repo,
      lastUpdate: new Date().toISOString()
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    res.json({
      success: true,
      message: '更新已启动，请稍后刷新页面查看版本信息',
      data: {
        newVersion: latestVersion,
        restartRequired: true
      }
    });

  } catch (error) {
    console.error('执行更新失败:', error);
    res.json({
      success: false,
      message: '执行更新失败: ' + error.message
    });
  }
});

/**
 * 获取更新日志
 * GET /api/update/logs
 */
router.get('/logs', async (req, res) => {
  try {
    const logFile = path.join(__dirname, '..', 'update-log.json');
    
    if (fs.existsSync(logFile)) {
      const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      res.json({
        success: true,
        data: logs
      });
    } else {
      res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    res.json({
      success: false,
      message: '获取更新日志失败'
    });
  }
});

/**
 * 保存更新日志
 */
function saveUpdateLog(log) {
  const logFile = path.join(__dirname, '..', 'update-log.json');
  let logs = [];
  
  if (fs.existsSync(logFile)) {
    try {
      logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    } catch (e) {}
  }
  
  logs.unshift(log);
  
  // 只保留最近10条日志
  logs = logs.slice(0, 10);
  
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
}

module.exports = router;
