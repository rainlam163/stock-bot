<script setup>
import { ref } from 'vue';
import { marked } from 'marked';

const stockInput = ref('600519, 000858');
const results = ref([]);
const loading = ref(false);
const error = ref('');

const API_URL = '/api/analyze';

const startAnalysis = async () => {
  // Reset state
  results.value = [];
  error.value = '';
  loading.value = true;

  // Process input: split by comma, space, newline, filter empty
  const codes = stockInput.value
    .split(/[,，\s\n]+/)
    .map(c => c.trim())
    .filter(c => c.length > 0);

  if (codes.length === 0) {
    error.value = '请输入至少一个股票代码';
    loading.value = false;
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ codes }),
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    results.value = data.results || [];
  } catch (err) {
    error.value = err.message || '发生未知错误';
  } finally {
    loading.value = false;
  }
};

const renderMarkdown = (text) => {
  return marked.parse(text);
};
</script>

<template>
  <div class="container">
    <h2 class="title">AI 股票分析助手</h2>
    
    <div class="input-group">
      <textarea 
        v-model="stockInput" 
        :disabled="loading"
        placeholder="请输入股票代码，多个代码用逗号或空格分隔\n例如: 600519, 000858"
        rows="4"
        class="stock-input"
      ></textarea>
    </div>

    <div class="action-bar">
      <button @click="startAnalysis" :disabled="loading" class="analyze-btn">
        {{ loading ? '正在分析中...' : '开始智能分析' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-msg">
      {{ error }}
    </div>

    <!-- Results List -->
    <div v-if="results.length > 0" class="results-container">
      <div v-for="item in results" :key="item.code" class="result-card">
        <div class="card-header">
          <span class="stock-name">{{ item.name }}</span>
          <span class="stock-code">({{ item.code }})</span>
        </div>
        <div class="card-body">
          <div v-if="item.error" class="item-error">{{ item.error }}</div>
          <div v-else class="advice-content" v-html="renderMarkdown(item.advice)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.title {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

/* Dark mode adjustment if parent style implies it */
@media (prefers-color-scheme: dark) {
  .title { color: #eee; }
}

.input-group {
  margin-bottom: 20px;
}

.stock-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  box-sizing: border-box; /* Important for padding */
}

.stock-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.action-bar {
  text-align: center;
  margin-bottom: 30px;
}

.analyze-btn {
  background-color: #42b983; /* Vue Green */
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 18px;
  border-radius: 25px;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  max-width: 300px;
}

.analyze-btn:disabled {
  background-color: #a0cfa0;
  cursor: not-allowed;
}

.analyze-btn:hover:not(:disabled) {
  background-color: #3aa876;
}

.error-msg {
  color: #ff4444;
  text-align: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #ffe6e6;
  border-radius: 8px;
}

.result-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

@media (prefers-color-scheme: dark) {
  .result-card {
    background: #2a2a2a;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
}

.card-header {
  background-color: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

@media (prefers-color-scheme: dark) {
  .card-header {
    background-color: #333;
    border-bottom: 1px solid #444;
  }
}

.stock-name {
  font-size: 1.2em;
  font-weight: bold;
  color: #2c3e50;
}

@media (prefers-color-scheme: dark) {
  .stock-name { color: #e0e0e0; }
}

.stock-code {
  color: #666;
  font-size: 0.9em;
}

.card-body {
  padding: 20px;
}

.advice-content {
  font-size: 15px;
  line-height: 1.6;
  color: #2c3e50;
  font-family: inherit;
}

/* Markdown Styles */
.advice-content :deep(h1),
.advice-content :deep(h2),
.advice-content :deep(h3),
.advice-content :deep(h4) {
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  color: #2c3e50;
}

.advice-content :deep(p) {
  margin-bottom: 1em;
}

.advice-content :deep(ul), 
.advice-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 1em;
}

.advice-content :deep(li) {
  margin-bottom: 0.5em;
}

.advice-content :deep(strong) {
  color: #d32f2f; /* Highlight important text */
}

@media (prefers-color-scheme: dark) {
  .advice-content { color: #d0d0d0; }
  
  .advice-content :deep(h1),
  .advice-content :deep(h2),
  .advice-content :deep(h3),
  .advice-content :deep(h4) {
    color: #e0e0e0;
  }
  
  .advice-content :deep(strong) {
    color: #ff8a80;
  }
}

.item-error {
  color: #ff6b6b;
}
</style>
