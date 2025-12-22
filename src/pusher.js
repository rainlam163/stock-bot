const axios = require('axios');

async function sendToWechat(title, content) {
    const url = 'http://www.pushplus.plus/send';
    try {
        await axios.post(url, {
            token: process.env.PUSHPLUS_TOKEN,
            topic: 'AiStock',
            title: title,
            content: content,
            template: 'markdown' // 支持换行显示
        });
        console.log('推送成功！');
    } catch (err) {
        console.error('推送失败:', err.message);
    }
}

module.exports = { sendToWechat };