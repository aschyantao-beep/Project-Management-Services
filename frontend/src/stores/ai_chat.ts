import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

export interface AIConfig {
  id: number
  provider: 'openai' | 'anthropic' | 'google' | 'openrouter'
  model_name: string
  max_tokens: number
  temperature: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChatConversation {
  id: number
  project_id?: number
  title: string
  message_count: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  conversation_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface AIChatState {
  aiConfig: AIConfig | null
  conversations: ChatConversation[]
  currentConversation: ChatConversation | null
  messages: ChatMessage[]
  loading: boolean
  apiKeyDialogVisible: boolean
  configDialogVisible: boolean
}

export const useAIChatStore = defineStore('ai_chat', () => {
  // 状态
  const aiConfig = ref<AIConfig | null>(null)
  const conversations = ref<ChatConversation[]>([])
  const currentConversation = ref<ChatConversation | null>(null)
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const apiKeyDialogVisible = ref(false)
  const configDialogVisible = ref(false)

  // 计算属性
  const isAIConfigured = computed(() => aiConfig.value !== null)
  const hasActiveConversation = computed(() => currentConversation.value !== null)
  const conversationMessages = computed(() => {
    if (!currentConversation.value) return []
    return messages.value.filter(msg => msg.conversation_id === currentConversation.value!.id)
  })

  // 获取AI配置
  const fetchAIConfig = async () => {
    try {
      const response = await request.get('/ai/config')
      if (response.data?.success) {
        aiConfig.value = response.data.data
      } else {
        aiConfig.value = null
      }
      return response.data
    } catch (error) {
      console.error('获取AI配置失败:', error)
      aiConfig.value = null
      return { success: false, error: '获取AI配置失败' }
    }
  }

  // 更新AI配置
  const updateAIConfig = async (config: Partial<AIConfig>) => {
    try {
      loading.value = true
      const response = await request.post('/ai/config', config)

      if (response.data?.success) {
        aiConfig.value = response.data.data
        ElMessage.success('AI配置更新成功')
        configDialogVisible.value = false
        // 重新获取会话列表
        await fetchConversations()
      } else {
        ElMessage.error(response.data?.error || '更新AI配置失败')
      }

      return response.data
    } catch (error) {
      console.error('更新AI配置失败:', error)
      ElMessage.error('更新AI配置失败')
      return { success: false, error: '更新AI配置失败' }
    } finally {
      loading.value = false
    }
  }

  // 测试AI配置
  const testAIConfig = async (config: Partial<AIConfig>) => {
    try {
      loading.value = true
      const response = await request.post('/ai/test', config)

      if (response.data?.success) {
        ElMessage.success('API密钥验证通过')
      } else {
        ElMessage.error(response.data?.error || 'API密钥验证失败')
      }

      return response.data
    } catch (error) {
      console.error('API测试失败:', error)
      ElMessage.error('API测试失败')
      return { success: false, error: 'API测试失败' }
    } finally {
      loading.value = false
    }
  }

  // 获取会话列表
  const fetchConversations = async (projectId?: number) => {
    try {
      const params = projectId ? { project_id: projectId } : {}
      const response = await request.get('/ai/conversations', { params })

      if (response.data?.success) {
        conversations.value = response.data.data
      }

      return response.data
    } catch (error) {
      console.error('获取会话列表失败:', error)
      return { success: false, error: '获取会话列表失败' }
    }
  }

  // 创建会话
  const createConversation = async (title: string, projectId?: number) => {
    try {
      const response = await request.post('/ai/conversations', {
        title,
        project_id: projectId
      })

      if (response.data?.success && response.data.data) {
        conversations.value.unshift(response.data.data)
        currentConversation.value = response.data.data
        // 清空消息列表
        messages.value = []
        ElMessage.success('会话创建成功')
      } else {
        ElMessage.error(response.data?.error || '创建会话失败')
      }

      return response.data
    } catch (error) {
      console.error('创建会话失败:', error)
      ElMessage.error('创建会话失败')
      return { success: false, error: '创建会话失败' }
    }
  }

  // 设置当前会话
  const setCurrentConversation = (conversation: ChatConversation | null) => {
    currentConversation.value = conversation
    if (conversation) {
      fetchMessages(conversation.id)
    } else {
      messages.value = []
    }
  }

  // 获取会话消息
  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await request.get(`/ai/conversations/${conversationId}/messages`)

      if (response.data?.success) {
        messages.value = response.data.data.messages
      }

      return response.data
    } catch (error) {
      console.error('获取会话消息失败:', error)
      return { success: false, error: '获取会话消息失败' }
    }
  }

  // 发送消息
  const sendMessage = async (content: string) => {
    if (!currentConversation.value) {
      ElMessage.error('请先选择一个会话')
      return { success: false, error: '没有选择会话' }
    }

    try {
      loading.value = true

      // 先添加用户消息到本地（乐观更新）
      const tempUserMessage: ChatMessage = {
        id: Date.now(), // 临时ID
        conversation_id: currentConversation.value.id,
        role: 'user',
        content,
        created_at: new Date().toISOString()
      }
      messages.value.push(tempUserMessage)

      const response = await request.post(`/ai/conversations/${currentConversation.value.id}/messages`, {
        content
      })

      if (response.data?.success && response.data.data) {
        // 移除临时消息，添加真实消息
        messages.value = messages.value.filter(msg => msg.id !== tempUserMessage.id)
        messages.value.push(response.data.data)
        ElMessage.success('消息发送成功')
      } else {
        // 移除临时消息
        messages.value = messages.value.filter(msg => msg.id !== tempUserMessage.id)
        ElMessage.error(response.data?.error || '发送消息失败')
      }

      return response.data
    } catch (error) {
      console.error('发送消息失败:', error)
      // 移除临时消息
      messages.value = messages.value.filter(msg => msg.id !== tempUserMessage.id)
      ElMessage.error('发送消息失败')
      return { success: false, error: '发送消息失败' }
    } finally {
      loading.value = false
    }
  }

  // 获取可用模型
  const fetchAvailableModels = async () => {
    try {
      const response = await request.get('/ai/models')

      if (response.data?.success) {
        return response.data.data
      }

      return []
    } catch (error) {
      console.error('获取模型列表失败:', error)
      return []
    }
  }

  // 显示配置对话框
  const showConfigDialog = () => {
    configDialogVisible.value = true
  }

  // 隐藏配置对话框
  const hideConfigDialog = () => {
    configDialogVisible.value = false
  }

  // 初始化
  const init = async () => {
    await fetchAIConfig()
    if (isAIConfigured.value) {
      await fetchConversations()
    }
  }

  return {
    // 状态
    aiConfig,
    conversations,
    currentConversation,
    messages,
    loading,
    apiKeyDialogVisible,
    configDialogVisible,

    // 计算属性
    isAIConfigured,
    hasActiveConversation,
    conversationMessages,

    // 方法
    fetchAIConfig,
    updateAIConfig,
    testAIConfig,
    fetchConversations,
    createConversation,
    setCurrentConversation,
    fetchMessages,
    sendMessage,
    fetchAvailableModels,
    showConfigDialog,
    hideConfigDialog,
    init
  }
})