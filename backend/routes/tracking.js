/**
 * 快递物流查询路由模块
 * 功能：查询快递物流轨迹信息
 */

const express = require('express');
const router = express.Router();

/**
 * 查询快递物流信息
 * GET /api/tracking/:trackingNumber
 */
router.get('/:trackingNumber', async (req, res) => {
  try {
    const trackingNumber = req.params.trackingNumber;

    if (!trackingNumber) {
      return res.json({
        success: false,
        message: '请提供快递单号'
      });
    }

    // UAPI快递查询API
    const apiUrl = `https://api.uapis.cn/express/${trackingNumber}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (data.tracks && data.tracks.length > 0) {
      res.json({
        success: true,
        data: {
          tracking_number: trackingNumber,
          carrier: data.carrier_name || '未知',
          status: getStatusFromTracks(data.tracks),
          traces: data.tracks.map(function(track) {
            return {
              time: track.time,
              desc: track.context
            };
          }),
          update_time: new Date().toLocaleString('zh-CN')
        }
      });
    } else if (data.error || data.message) {
      res.json({
        success: false,
        message: data.message || data.error || '暂无物流信息'
      });
    } else {
      res.json({
        success: false,
        message: '暂无物流信息'
      });
    }

  } catch (error) {
    console.error('快递查询错误:', error);
    res.json({
      success: false,
      message: '查询失败，请稍后重试'
    });
  }
});

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

module.exports = router;
