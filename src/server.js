require('dotenv').config();
const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { serve } = require('@hono/node-server');
const { getMarketContext, analyzeStock } = require('./analyzer');

const app = new Hono();

// 允许跨域
app.use('/*', cors());

// 健康检查
app.get('/', (c) => c.text('Stock-Bot API is running!'));

// 批量分析接口
app.post('/analyze', async (c) => {
    const body = await c.req.json();
    const codes = body.codes;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return c.json({ error: '请提供有效的股票代码数组 (codes)' }, 400);
    }

    console.log(`收到 API 分析请求，股票列表: ${codes.join(', ')}`);

    // 1. 获取大盘基准
    const indexHistory = await getMarketContext();
    if (!indexHistory || indexHistory.length === 0) {
        return c.json({ error: '无法获取大盘数据，服务暂时不可用' }, 503);
    }

    // 2. 批量分析
    const results = [];
    for (const code of codes) {
        const result = await analyzeStock(code, indexHistory);
        results.push(result);
        // 简单限流
        await new Promise(r => setTimeout(r, 1000));
    }

    return c.json({
        success: true,
        timestamp: new Date().toISOString(),
        benchmark_date: indexHistory[indexHistory.length - 1].date,
        results: results
    });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});