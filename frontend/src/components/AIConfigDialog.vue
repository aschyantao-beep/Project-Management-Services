<template>
  <el-dialog
    v-model="dialogVisible"
    title="AI 配置"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="configForm"
      :rules="formRules"
      label-width="120px"
      v-loading="loading"
    >
      <el-form-item label="AI提供商" prop="provider">
        <el-select
          v-model="configForm.provider"
          placeholder="选择AI提供商"
          style="width: 100%"
          @change="onProviderChange"
        >
          <el-option label="OpenRouter (推荐)" value="openrouter" />
          <el-option label="OpenAI" value="openai" />
          <el-option label="Anthropic" value="anthropic" />
        </el-select>
      </el-form-item>

      <el-form-item label="API密钥" prop="api_key">
        <el-input
          v-model="configForm.api_key"
          type="password"
          placeholder="输入您的API密钥"
          show-password
          clearable
        />
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>
            您的API密钥将被安全加密存储，不会暴露给前端代码。
            <a :href="getProviderUrl()" target="_blank" style="color: #409eff">
              获取API密钥
            </a>
          </span>
        </div>
      </el-form-item>

      <el-form-item label="模型" prop="model_name">
        <el-select
          v-model="configForm.model_name"
          placeholder="选择模型"
          style="width: 100%"
          :loading="modelsLoading"
        >
          <el-option
            v-for="model in availableModels"
            :key="model"
            :label="model"
            :value="model"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="最大令牌数" prop="max_tokens">
        <el-slider
          v-model="configForm.max_tokens"
          :min="100"
          :max="4000"
          :step="100"
          show-input
          :show-input-controls="false"
        />
        <div class="form-tip">
          控制AI回复的最大长度，建议设置为1000-2000
        </div>
      </el-form-item>

      <el-form-item label="温度" prop="temperature">
        <el-slider
          v-model="configForm.temperature"
          :min="0"
          :max="1"
          :step="0.1"
          show-input
          :show-input-controls="false"
        />
        <div class="form-tip">
          控制AI回复的创造性，0为保守，1为创造性更强
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="testConfig" :loading="testing" type="warning">
          测试配置
        </el-button>
        <el-button @click="saveConfig" :loading="loading" type="primary">
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAIChatStore } from '@/stores/ai_chat'
import type { FormInstance, FormRules } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'config-saved': []
}>()

const aiChatStore = useAIChatStore()

// 表单引用
const formRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)
const testing = ref(false)
const modelsLoading = ref(false)

// 可用模型
const availableModels = ref<string[]>([])

// 配置表单
const configForm = reactive({
  provider: 'openrouter',
  api_key: '',
  model_name: 'openai/gpt-3.5-turbo',
  max_tokens: 1000,
  temperature: 0.7
})

// 表单验证规则
const formRules: FormRules = {
  provider: [
    { required: true, message: '请选择AI提供商', trigger: 'change' }
  ],
  api_key: [
    { required: true, message: '请输入API密钥', trigger: 'blur' },
    { min: 10, message: 'API密钥长度太短', trigger: 'blur' }
  ],
  model_name: [
    { required: true, message: '请选择模型', trigger: 'change' }
  ],
  max_tokens: [
    { required: true, message: '请设置最大令牌数', trigger: 'blur' },
    { type: 'number', min: 100, max: 4000, message: '令牌数必须在100-4000之间', trigger: 'blur' }
  ],
  temperature: [
    { required: true, message: '请设置温度', trigger: 'blur' },
    { type: 'number', min: 0, max: 1, message: '温度必须在0-1之间', trigger: 'blur' }
  ]
}

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 获取提供商URL
const getProviderUrl = () => {
  switch (configForm.provider) {
    case 'openrouter':
      return 'https://openrouter.ai/keys'
    case 'openai':
      return 'https://platform.openai.com/api-keys'
    case 'anthropic':
      return 'https://console.anthropic.com/'
    default:
      return '#'
  }
}

// 提供商变更处理
const onProviderChange = async () => {
  // 设置默认模型
  switch (configForm.provider) {
    case 'openrouter':
      configForm.model_name = 'openai/gpt-3.5-turbo'
      break
    case 'openai':
      configForm.model_name = 'gpt-3.5-turbo'
      break
    case 'anthropic':
      configForm.model_name = 'claude-3-haiku-20240307'
      break
  }

  // 获取可用模型
  await fetchAvailableModels()
}

// 获取可用模型
const fetchAvailableModels = async () => {
  modelsLoading.value = true
  try {
    // 临时设置当前提供商以获取模型列表
    const tempConfig = {
      provider: configForm.provider,
      api_key: configForm.api_key || 'temp-key'
    }

    const models = await aiChatStore.fetchAvailableModels()
    if (models && models.length > 0) {
      availableModels.value = models
      // 如果当前选择的模型不在列表中，选择第一个
      if (!models.includes(configForm.model_name)) {
        configForm.model_name = models[0]
      }
    } else {
      // 如果没有获取到模型，使用默认模型列表
      setDefaultModels()
    }
  } catch (error) {
    console.error('获取模型列表失败:', error)
    setDefaultModels()
  } finally {
    modelsLoading.value = false
  }
}

// 设置默认模型
const setDefaultModels = () => {
  switch (configForm.provider) {
    case 'openrouter':
      availableModels.value = [
        'openai/gpt-3.5-turbo',
        'openai/gpt-4',
        'anthropic/claude-3-haiku',
        'anthropic/claude-3-sonnet'
      ]
      break
    case 'openai':
      availableModels.value = [
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo'
      ]
      break
    case 'anthropic':
      availableModels.value = [
        'claude-3-haiku-20240307',
        'claude-3-sonnet-20240229',
        'claude-3-opus-20240229'
      ]
      break
    default:
      availableModels.value = []
  }
}

// 测试配置
const testConfig = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    testing.value = true

    const result = await aiChatStore.testAIConfig(configForm as any)

    if (result.success) {
      ElMessage.success('API密钥验证通过！可以保存配置。')
    } else {
      ElMessage.error(result.error || 'API密钥验证失败')
    }
  } catch (error) {
    console.error('测试配置失败:', error)
    ElMessage.error('测试配置失败')
  } finally {
    testing.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const result = await aiChatStore.updateAIConfig(configForm as any)

    if (result.success) {
      dialogVisible.value = false
      emit('config-saved')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败')
  } finally {
    loading.value = false
  }
}

// 加载当前配置
const loadCurrentConfig = () => {
  if (aiChatStore.aiConfig) {
    const config = aiChatStore.aiConfig
    configForm.provider = config.provider
    configForm.model_name = config.model_name
    configForm.max_tokens = config.max_tokens
    configForm.temperature = config.temperature
    // API密钥不加载，需要用户重新输入
    configForm.api_key = ''
  } else {
    // 使用默认值
    configForm.provider = 'openrouter'
    configForm.model_name = 'openai/gpt-3.5-turbo'
    configForm.max_tokens = 1000
    configForm.temperature = 0.7
    configForm.api_key = ''
  }
}

// 监听对话框显示
watch(dialogVisible, (visible) => {
  if (visible) {
    loadCurrentConfig()
    fetchAvailableModels()
  }
})

// 监听AI配置变化
watch(() => aiChatStore.aiConfig, () => {
  if (dialogVisible.value) {
    loadCurrentConfig()
  }
})
</script>

<style scoped>
.form-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.form-tip a {
  text-decoration: none;
}

.form-tip a:hover {
  text-decoration: underline;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>