<template>
  <el-dialog
    v-model="visible"
    title="新建项目"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      v-loading="loading"
    >
      <el-form-item label="项目名称" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入项目名称"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="项目目标" prop="goal">
        <el-input
          v-model="formData.goal"
          type="textarea"
          :rows="3"
          placeholder="请输入项目目标"
        />
      </el-form-item>

      <el-form-item label="负责人" prop="manager">
        <el-input
          v-model="formData.manager"
          placeholder="请输入负责人姓名"
        />
      </el-form-item>

      <el-form-item label="参与人" prop="participants">
        <el-input
          v-model="formData.participants"
          placeholder="请输入参与人（用逗号分隔）"
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="formData.priority" placeholder="选择优先级">
              <el-option label="高" value="High" />
              <el-option label="中" value="Medium" />
              <el-option label="低" value="Low" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="选择状态">
              <el-option label="规划中" value="Planning" />
              <el-option label="进行中" value="InProgress" />
              <el-option label="已完成" value="Completed" />
              <el-option label="已搁置" value="OnHold" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始日期" prop="start_date">
            <el-date-picker
              v-model="formData.start_date"
              type="date"
              placeholder="选择开始日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束日期" prop="end_date">
            <el-date-picker
              v-model="formData.end_date"
              type="date"
              placeholder="选择结束日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="使用模板">
        <el-select
          v-model="selectedTemplate"
          placeholder="选择项目模板（可选）"
          clearable
          @change="applyTemplate"
        >
          <el-option
            v-for="template in templates"
            :key="template.id"
            :label="template.name"
            :value="template.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="保存为模板">
        <el-checkbox v-model="saveAsTemplate">
          将该项目保存为模板
        </el-checkbox>
      </el-form-item>

      <el-form-item v-if="saveAsTemplate" label="模板名称" prop="template_name">
        <el-input
          v-model="templateName"
          placeholder="请输入模板名称"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        创建
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import type { Project, ProjectTemplate, ProjectStatus, Priority } from '@/types'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'created'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const projectStore = useProjectStore()

// 响应式数据
const formRef = ref<FormInstance>()
const loading = ref(false)
const selectedTemplate = ref()
const saveAsTemplate = ref(false)
const templateName = ref('')

// 表单数据
const formData = reactive({
  title: '',
  goal: '',
  manager: '',
  participants: '',
  status: 'Planning',
  priority: 'Medium',
  start_date: '',
  end_date: ''
})

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const templates = computed(() => projectStore.templates)

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入项目名称', trigger: 'blur' }
  ],
  start_date: [
    {
      validator: (rule, value, callback) => {
        if (value && formData.end_date && new Date(value) > new Date(formData.end_date)) {
          callback(new Error('开始日期不能晚于结束日期'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  end_date: [
    {
      validator: (rule, value, callback) => {
        if (value && formData.start_date && new Date(value) < new Date(formData.start_date)) {
          callback(new Error('结束日期不能早于开始日期'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  template_name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' }
  ]
}

// 方法
const applyTemplate = (templateId: number) => {
  const template = templates.value.find(t => t.id === templateId)
  if (template) {
    formData.title = template.title_template || ''
    formData.goal = template.goal_template || ''
    
    // 如果有默认任务，可以在创建项目后添加
    if (template.default_tasks) {
      try {
        const tasks = JSON.parse(template.default_tasks)
        // 存储任务列表，稍后创建
        sessionStorage.setItem('pendingTasks', JSON.stringify(tasks))
      } catch (e) {
        console.error('解析模板任务失败:', e)
      }
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 创建项目
    const projectData = {
      ...formData,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      status: formData.status as ProjectStatus,
      priority: formData.priority as Priority
    }

    const response = await projectStore.createProject(projectData)
    
    if ('data' in response && response.data?.success && response.data?.data) {
      // 如果有待创建的任务
      const pendingTasks = sessionStorage.getItem('pendingTasks')
      if (pendingTasks) {
        try {
          const tasks = JSON.parse(pendingTasks)
          for (const taskContent of tasks) {
            await projectStore.createTask(response.data.data.id, taskContent)
          }
          sessionStorage.removeItem('pendingTasks')
        } catch (e) {
          console.error('创建模板任务失败:', e)
        }
      }

      // 如果选择了保存为模板
      if (saveAsTemplate.value && templateName.value) {
        await projectStore.createTemplate({
          name: templateName.value,
          title_template: formData.title,
          goal_template: formData.goal,
          default_tasks: JSON.stringify([])
        })
      }

      handleClose()
      emit('created')
    }
  } catch (error) {
    console.error('创建项目失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  // 重置表单
  formRef.value?.resetFields()
  selectedTemplate.value = undefined
  saveAsTemplate.value = false
  templateName.value = ''
  sessionStorage.removeItem('pendingTasks')
}

// 生命周期
onMounted(() => {
  projectStore.fetchTemplates()
})
</script>

<style scoped>
.el-dialog {
  border-radius: 8px;
}

.el-form-item {
  margin-bottom: 18px;
}
</style>