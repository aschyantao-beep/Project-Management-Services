<template>
  <div class="ai-chat-test">
    <div class="test-header">
      <h1>🤖 AI聊天功能测试</h1>
      <p>测试AI聊天功能的完整集成</p>
    </div>

    <div class="test-content">
      <!-- 配置状态 -->
      <div class="config-status" v-if="aiChatStore.isAIConfigured">
        <el-alert
          title="AI已配置"
          type="success"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>提供商: {{ aiChatStore.aiConfig?.provider }}</p>
            <p>模型: {{ aiChatStore.aiConfig?.model_name }}</p>
          </template>
        </el-alert>
      </div>

      <div class="config-status" v-else>
        <el-alert
          title="AI未配置"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>请先配置AI服务以开始使用</p>
            <el-button type="primary" @click="aiChatStore.showConfigDialog" size="small">
              立即配置
            </el-button>
          </template>
        </el-alert>
      </div>

      <!-- 聊天面板 -->
      <div class="chat-panel-container">
        <AIChatPanel />
      </div>

      <!-- 测试说明 -->
      <div class="test-instructions">
        <el-card>
          <template #header>
            <span>📋 测试说明</span>
          </template>
          <div class="instructions-content">
            <h4>功能测试步骤：</h4>
            <ol>
              <li>点击"配置AI服务"按钮或右上角的"配置"按钮</li>
              <li>在弹出的对话框中输入您的API密钥</li>
              <li>选择AI提供商（推荐使用OpenRouter）</li>
              <li>选择合适的模型</li>
              <li>可以点击"测试配置"验证API密钥是否有效</li>
              <li>点击"保存配置"完成设置</li>
              <li>在聊天面板中点击"新对话"开始与AI助手交流</li>
            </ol>

            <h4>支持的AI提供商：</h4>
            <ul>
              <li><strong>OpenRouter</strong> - 推荐，支持多种模型</li>
              <li><strong>OpenAI</strong> - GPT系列模型</li>
              <li><strong>Anthropic</strong> - Claude系列模型</li>
            </ul>

            <h4>功能特点：</h4>
            <ul>
              <li>✅ 前端界面配置API密钥</li>
              <li>✅ API密钥安全加密存储</li>
              <li>✅ 支持多种AI提供商</li>
              <li>✅ 对话历史管理</li>
              <li>✅ 项目上下文感知</li>
              <li>✅ 实时聊天界面</li>
            </ul>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 配置对话框 -->
    <AIConfigDialog
      v-model="aiChatStore.configDialogVisible"
      @config-saved="handleConfigSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAIChatStore } from '@/stores/ai_chat'
import AIChatPanel from '@/components/AIChatPanel.vue'

// Store
const aiChatStore = useAIChatStore()

// 配置保存处理
const handleConfigSaved = () => {
  ElMessage.success('AI配置已更新')
}

// 初始化
onMounted(() => {
  aiChatStore.init()
})
</script>

<style scoped>
.ai-chat-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
}

.test-header h1 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 28px;
}

.test-header p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-status {
  margin-bottom: 20px;
}

.chat-panel-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 600px;
}

.test-instructions {
  margin-top: 20px;
}

.instructions-content {
  line-height: 1.6;
}

.instructions-content h4 {
  margin: 20px 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.instructions-content ol,
.instructions-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.instructions-content li {
  margin: 8px 0;
  color: #606266;
}

.instructions-content strong {
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-chat-test {
    padding: 10px;
  }

  .test-header h1 {
    font-size: 24px;
  }

  .chat-panel-container {
    min-height: 500px;
  }
}
</style>
"file_path":"C:\Users\songchunyan\Desktop\项目管理\project-manager\frontend\src\views\AIChatTest.vue"}