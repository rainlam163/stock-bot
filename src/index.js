require('dotenv').config();
const cron = require('node-cron');
const { sendToWechat } = require('./pusher');
const { WATCH_LIST } = require('./config');
const { getMarketContext, analyzeStock } = require('./analyzer');

/**
 * 核心工作流
 */
async function runWorkflow() {
    console.log(`[${new Date().toLocaleString()}] 启动分析引擎...`);

    // 1. 抓取大盘数据作为时间基准
    const indexHistory = await getMarketContext();
    if (!indexHistory || indexHistory.length === 0) {
        console.error('无法获取大盘数据，任务中止');
        return;
    }

    // 获取数据中的最新交易日期
    const lastDataPoint = indexHistory[indexHistory.length - 1];
    const tradingDate = lastDataPoint.date; 
    const now = new Date();

    // 判断当前运行场景
    let sceneNote = "";
    if (now.getHours() < 9) {
        sceneNote = "【盘前预警】当前为开盘前，以下建议基于上一交易日收盘数据，适用于今日操作。";
    } else if (now.getHours() >= 15) {
        sceneNote = "【盘后复盘】今日交易已结束，以下建议适用于下一交易日。";
    } else {
        sceneNote = "【盘中参考】当前市场正在交易，数据可能存在波动。";
    }

    let finalReport = `**数据基准日:** ${tradingDate}\n\n`;
    finalReport += `**报告生成时间:** ${now.toLocaleString()}\n\n`;
    finalReport += `**当前场景:** ${sceneNote}\n\n`;
    finalReport += `---\n\n`;

    // 2. 循环分析每一只自选标的
    for (const code of WATCH_LIST) {
        console.log(`正在处理: ${code}...`);
        
        const result = await analyzeStock(code, indexHistory);
        
        if (result.error) {
            console.error(`${code} 分析异常:`, result.error);
            finalReport += `### 标的: ${code}\n\n> ${result.error}\n\n`;
        } else {
            finalReport += `${result.advice}\n\n`;
        }
        
        finalReport += `---\n\n`;
        // 适当延迟，保护 API 频率
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    finalReport += `\n\n*风险提示：AI 建议仅供参考，不构成投资依据。入市有风险，决策需谨慎。*`;

    // 3. 发送至微信
    const reportTitle = `${tradingDate} AI 量化决策建议`;
    await sendToWechat(reportTitle, finalReport);
    
    console.log(`>>> 报告已推送，基准日期为: ${tradingDate}`);
}

/**
 * 定时任务配置
 * A 股收盘时间是 15:00
 * 设定在周一至周五的 15:15 运行，确保交易所数据已完全入库
 */
cron.schedule('15 15 * * 1-5', () => {
    runWorkflow();
});

/**
 * 立即执行测试
 * 如果你现在运行 node index.js，它会立即执行一次。
 * 在凌晨运行，它会抓取上一个交易日的数据并标注为“盘前预警”。
 */
runWorkflow();

console.log('--------------------------------------------');
console.log('  Node.js A股全天候 AI 助手已启动');
console.log('  定时任务：周一至周五 15:15 执行');
console.log('--------------------------------------------');