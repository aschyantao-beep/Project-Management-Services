<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑项目"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
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
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="负责人" prop="manager">
        <el-input
          v-model="formData.manager"
          placeholder="请输入负责人姓名"
          maxlength="200"
        />
      </el-form-item>

      <el-form-item label="参与人员" prop="participants">
        <el-input
          v-model="formData.participants"
          type="textarea"
          :rows="2"
          placeholder="请输入参与人员，多个人员用逗号分隔"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="项目状态" prop="status">
            <el-select v-model="formData.status" placeholder="选择项目状态" style="width: 100%">
              <el-option label="规划中" value="Planning" />
              <el-option label="进行中" value="InProgress" />
              <el-option label="已完成" value="Completed" />
              <el-option label="暂停" value="OnHold" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="formData.priority" placeholder="选择优先级" style="width: 100%">
              <el-option label="高" value="High" />
              <el-option label="中" value="Medium" />
              <el-option label="低" value="Low" />
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

      <!-- 项目回顾（仅当项目已完成时显示） -->
      <template v-if="formData.status === 'Completed'">
        <el-form-item label="项目回顾">
          <div class="retrospective-section">
            <el-form-item label="做得好的地方" prop="retrospective_good" label-width="120px">
              <el-input
                v-model="formData.retrospective_good"
                type="textarea"
                :rows="3"
                placeholder="总结项目中做得好的地方"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="需要改进的地方" prop="retrospective_improve" label-width="120px">
              <el-input
                v-model="formData.retrospective_improve"
                type="textarea"
                :rows="3"
                placeholder="总结项目中需要改进的地方"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </div>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProject" :loading="loading">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import type { FormInstance, FormRules } from 'element-plus'
import type { Project } from '@/types'

// Props
const props = defineProps<{
  modelValue: boolean
  project: Project | null
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'project-updated': [project: Project]
}>()

// Store
const projectStore = useProjectStore()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const loading = ref(false)

// 表单数据
const formData = reactive({
  title: '',
  goal: '',
  manager: '',
  participants: '',
  status: 'Planning',
  priority: 'Medium',
  start_date: '',
  end_date: '',
  retrospective_good: '',
  retrospective_improve: ''
})

// 表单验证规则
const formRules: FormRules = {
  title: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 500, message: '项目名称长度应在2-500个字符之间', trigger: 'blur' }
  ],
  goal: [
    { max: 2000, message: '项目目标长度不能超过2000个字符', trigger: 'blur' }
  ],
  manager: [
    { max: 200, message: '负责人姓名长度不能超过200个字符', trigger: 'blur' }
  ],
  participants: [
    { max: 500, message: '参与人员信息长度不能超过500个字符', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择项目状态', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  start_date: [
    { validator: validateDateRange, trigger: 'change' }
  ],
  end_date: [
    { validator: validateDateRange, trigger: 'change' }
  ],
  retrospective_good: [
    { max: 1000, message: '回顾内容长度不能超过1000个字符', trigger: 'blur' }
  ],
  retrospective_improve: [
    { max: 1000, message: '回顾内容长度不能超过1000个字符', trigger: 'blur' }
  ]
}

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 日期范围验证
function validateDateRange(rule: any, value: any, callback: any) {
  if (!formData.start_date && !formData.end_date) {
    callback()
    return
  }

  if (formData.start_date && formData.end_date) {
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    if (start > end) {
      callback(new Error('开始日期不能晚于结束日期'))
      return
    }
  }

  callback()
}

// 加载项目数据到表单
const loadProjectData = () => {
  if (props.project) {
    formData.title = props.project.title || ''
    formData.goal = props.project.goal || ''
    formData.manager = props.project.manager || ''
    formData.participants = props.project.participants || ''
    formData.status = props.project.status || 'Planning'
    formData.priority = props.project.priority || 'Medium'
    formData.start_date = props.project.start_date || ''
    formData.end_date = props.project.end_date || ''
    formData.retrospective_good = props.project.retrospective_good || ''
    formData.retrospective_improve = props.project.retrospective_improve || ''
  }
}

// 保存项目
const saveProject = async () => {
  if (!formRef.value || !props.project) return

  try {
    await formRef.value.validate()
    loading.value = true

    const updateData = {
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    }

    const result = await projectStore.updateProject(props.project.id, updateData)

    if (result.success && result.data) {
      dialogVisible.value = false
      emit('project-updated', result.data)
      ElMessage.success('项目更新成功')
    } else {
      ElMessage.error(result.error || '更新项目失败')
    }
  } catch (error) {
    console.error('保存项目失败:', error)
    if (error !== false) { // 验证错误会返回 false
      ElMessage.error('保存项目失败')
    }
  } finally {
    loading.value = false
  }
}

// 监听对话框显示状态
watch(dialogVisible, (visible) => {
  if (visible) {
    loadProjectData()
  }
})

// 监听项目数据变化
watch(() => props.project, () => {
  if (dialogVisible.value) {
    loadProjectData()
  }
})
</script>

<style scoped>
.retrospective-section {
  margin-top: 16px;
}

.retrospective-section :deep(.el-form-item) {
  margin-bottom: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-footer {
    flex-direction: column-reverse;
  }
}
</style>