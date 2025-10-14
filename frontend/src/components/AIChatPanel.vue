<template>
  <div class="ai-chat-panel">
    <!-- 未配置AI服务的提示 -->
    <div v-if="!aiChatStore.isAIConfigured" class="ai-not-configured">
      <el-empty description="AI服务未配置">
        <template #description>
          <p>请先配置AI服务以开始使用AI助手</p>
        </template>
        <template #default>
          <el-button type="primary" @click="aiChatStore.showConfigDialog">
            <el-icon><Setting /></el-icon>
            配置AI服务
          </el-button>
        </template>
      </el-empty>
    </div>

    <!-- 聊天界面 -->
    <div v-else class="chat-container">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <div class="header-left">
          <h3>🤖 AI 项目助手</h3>
          <span v-if="currentProject" class="project-name">
            当前项目: {{ (currentProject as any).title }}
          </span>
        </div>
        <div class="header-right">
          <el-button
            type="primary"
            text
            size="small"
            @click="aiChatStore.showConfigDialog"
          >
            <el-icon><Setting /></el-icon>
            配置
          </el-button>
          <el-button
            type="primary"
            text
            size="small"
            @click="showNewConversationDialog"
          >
            <el-icon><Plus /></el-icon>
            新对话
          </el-button>
        </div>
      </div>

      <!-- 会话列表 -->
      <div class="conversations-sidebar" v-if="showConversations">
        <div class="sidebar-header">
          <h4>对话历史</h4>
        </div>
        <div class="conversations-list">
          <div
            v-for="conv in aiChatStore.conversations"
            :key="conv.id"
            :class="['conversation-item', { active: conv.id === aiChatStore.currentConversation?.id }]"
            @click="selectConversation(conv)"
          >
            <div class="conversation-title">{{ conv.title }}</div>
            <div class="conversation-meta">
              <span>{{ conv.message_count }} 条消息</span>
              <span>{{ formatDate(conv.updated_at) }}</span>
            </div>
          </div>
          <div v-if="aiChatStore.conversations.length === 0" class="no-conversations">
            暂无对话历史
          </div>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="chat-main">
        <!-- 当前对话消息 -->
        <div v-if="aiChatStore.hasActiveConversation" class="messages-container" ref="messagesContainer">
          <div
            v-for="message in aiChatStore.conversationMessages"
            :key="message.id"
            :class="['message', message.role]"
          >
            <div class="message-avatar">
              <div v-if="message.role === 'user'" class="avatar user-avatar">👤</div>
              <div v-else class="avatar ai-avatar">🤖</div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">{{ message.role === 'user' ? '您' : 'AI助手' }}</span>
                <span class="message-time">{{ formatTime(message.created_at) }}</span>
              </div>
              <div class="message-body">{{ message.content }}</div>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="aiChatStore.loading" class="message ai">
            <div class="message-avatar">
              <div class="avatar ai-avatar">🤖</div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-role">AI助手</span>
                <span class="message-time">正在输入...</span>
              </div>
              <div class="message-body">
                <el-icon class="loading-icon"><Loading /></el-icon>
                正在思考中...
              </div>
            </div>
          </div>
        </div>

        <!-- 无对话状态 -->
        <div v-else class="no-conversation">
          <el-empty description="开始新的对话">
            <template #description>
              <p>点击"新对话"按钮开始与AI助手交流</p>
              <p v-if="currentProject" class="tips">
                💡 AI助手已了解您的项目信息，可以提供更精准的建议
              </p>
            </template>
            <template #default>
              <el-button type="primary" @click="showNewConversationDialog">
                <el-icon><ChatDotRound /></el-icon>
                开始对话
              </el-button>
            </template>
          </el-empty>
        </div>

        <!-- 输入区域 -->
        <div v-if="aiChatStore.hasActiveConversation" class="input-area">
          <el-input
            v-model="newMessage"
            type="textarea"
            :rows="3"
            placeholder="向AI助手提问关于项目的问题..."
            resize="none"
            :disabled="aiChatStore.loading"
            @keyup.enter.prevent="handleSendMessage"
          />
          <div class="input-actions">
            <div class="input-tips">
              <el-icon><InfoFilled /></el-icon>
              按 Enter 发送消息，按 Ctrl+Enter 换行
            </div>
            <el-button
              type="primary"
              @click="handleSendMessage"
              :loading="aiChatStore.loading"
              :disabled="!newMessage.trim()"
            >
              <el-icon><Position /></el-icon>
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置对话框 -->
    <AIConfigDialog
      v-model="aiChatStore.configDialogVisible"
      @config-saved="handleConfigSaved"
    />

    <!-- 新对话对话框 -->
    <el-dialog
      v-model="newConversationDialogVisible"
      title="新建对话"
      width="400px"
    >
      <el-form @submit.prevent="createNewConversation">
        <el-form-item label="对话标题">
          <el-input
            v-model="newConversationTitle"
            placeholder="请输入对话标题"
            @keyup.enter="createNewConversation"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="newConversationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createNewConversation" :disabled="!newConversationTitle.trim()">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAIChatStore } from '@/stores/ai_chat'
import AIConfigDialog from './AIConfigDialog.vue'
import type { ChatConversation } from '@/stores/ai_chat'

// Props
const props = defineProps<{
  projectId?: number
}>()

// Store
const aiChatStore = useAIChatStore()

// 状态
const newMessage = ref('')
const newConversationDialogVisible = ref(false)
const newConversationTitle = ref('')
const showConversations = ref(true)
const messagesContainer = ref<HTMLElement>()

// 计算属性
const currentProject = computed(() => {
  // 这里可以根据 projectId 从项目 store 获取当前项目信息
  // 暂时返回 null，后续集成时再完善
  return null
})

// 选择会话
const selectConversation = (conversation: ChatConversation) => {
  aiChatStore.setCurrentConversation(conversation)
}

// 显示新对话对话框
const showNewConversationDialog = () => {
  newConversationTitle.value = currentProject.value
    ? `关于「${(currentProject.value as any).title}」的对话`
    : '新对话'
  newConversationDialogVisible.value = true
}

// 创建新对话
const createNewConversation = async () => {
  if (!newConversationTitle.value.trim()) {
    ElMessage.warning('请输入对话标题')
    return
  }

  const result = await aiChatStore.createConversation(
    newConversationTitle.value.trim(),
    props.projectId
  )

  if (result.success) {
    newConversationDialogVisible.value = false
    newConversationTitle.value = ''
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  }
}

// 发送消息
const handleSendMessage = async () => {
  if (!newMessage.value.trim() || aiChatStore.loading) {
    return
  }

  const message = newMessage.value.trim()
  newMessage.value = ''

  const result = await aiChatStore.sendMessage(message)

  if (result.success) {
    // 滚动到底部显示新消息
    await nextTick()
    scrollToBottom()
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 配置保存处理
const handleConfigSaved = () => {
  // 重新加载会话列表
  aiChatStore.fetchConversations()
  ElMessage.success('AI配置已更新')
}

// 监听当前会话变化
watch(
  () => aiChatStore.currentConversation,
  async () => {
    if (aiChatStore.currentConversation) {
      await nextTick()
      scrollToBottom()
    }
  }
)

// 初始化
onMounted(async () => {
  await aiChatStore.init()
})
</script>

<style scoped>
.ai-chat-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.ai-not-configured {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #303133;
}

.project-name {
  font-size: 12px;
  color: #909399;
}

.header-right {
  display: flex;
  gap: 8px;
}

.conversations-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background-color: #f5f7fa;
}

.conversation-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.conversation-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.no-conversations {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.user-avatar {
  background: #409eff;
  color: white;
}

.ai-avatar {
  background: #67c23a;
  color: white;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message.user .message-content {
  text-align: right;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  color: #909399;
}

.message.user .message-header {
  flex-direction: row-reverse;
}

.message-role {
  font-weight: 500;
}

.message-time {
  font-size: 11px;
}

.message-body {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message.user .message-body {
  background: #409eff;
  color: white;
}

.no-conversation {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.tips {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.input-area {
  background: white;
  border-top: 1px solid #e4e7ed;
  padding: 16px 20px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.input-tips {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar,
.conversations-list::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track,
.conversations-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.messages-container::-webkit-scrollbar-thumb,
.conversations-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.conversations-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .conversations-sidebar {
    width: 240px;
  }

  .message-content {
    max-width: 85%;
  }
}

@media (max-width: 480px) {
  .conversations-sidebar {
    display: none;
  }

  .message-content {
    max-width: 90%;
  }
}
</style>