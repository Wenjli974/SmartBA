<template>
  <div class="user-story-container">
    <h1>User Story Generator</h1>
    
    <!-- API Key设置 -->
    <el-dialog
      v-model="showApiKeyDialog"
      title="设置OpenAI API Key"
      width="500px"
    >
      <el-input
        v-model="apiKey"
        type="password"
        placeholder="请输入您的OpenAI API Key"
        show-password
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showApiKeyDialog = false">取消</el-button>
          <el-button type="primary" @click="saveApiKey">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 项目背景输入区域 -->
    <div class="input-section">
      <el-input
        v-model="projectBackground"
        type="textarea"
        :rows="6"
        placeholder="请输入项目背景描述..."
      />
      <div class="button-group">
        <el-button 
          type="primary" 
          :icon="Search"
          @click="checkRequirements"
          :loading="checking"
        >
          需求检查
        </el-button>
        <el-button 
          type="success" 
          :icon="Cpu"
          @click="generateStories"
          :loading="generating"
        >
          AI 生成
        </el-button>
      </div>
    </div>

    <!-- 需求检查结果对话框 -->
    <el-dialog
      v-model="showCheckDialog"
      title="需求检查结果"
      width="800px"
    >
      <div class="check-result-container">
        <h3>原始需求</h3>
        <el-input
          v-model="originalRequirement"
          type="textarea"
          :rows="4"
          readonly
        />
        
        <h3>需要补充的问题</h3>
        <div class="check-questions">
          <div v-for="(question, index) in checkQuestions" :key="index" class="question-item">
            <p class="question-text">{{ question }}</p>
            <el-input
              v-model="questionAnswers[index]"
              type="textarea"
              :rows="2"
              :placeholder="'请回答问题 ' + (index + 1)"
            />
          </div>
        </div>

        <h3>其他补充说明</h3>
        <el-input
          v-model="additionalInfo"
          type="textarea"
          :rows="4"
          placeholder="如果还有其他需要补充的信息，请在这里填写..."
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCheckDialog = false">取消</el-button>
          <el-button type="primary" @click="submitRequirements">
            确认并生成用户故事
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 用户故事表格 -->
    <el-table 
      :data="stories" 
      style="width: 100%" 
      border
      :row-style="{ height: 'auto' }"
      :cell-style="{ padding: '12px' }"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="epic" label="Epic" min-width="200">
        <template #default="scope">
          <el-input
            v-model="scope.row.epic"
            type="textarea"
            :rows="2"
            @change="handleDataChange"
          />
        </template>
      </el-table-column>
      <el-table-column prop="userStory" label="User Story" min-width="250">
        <template #default="scope">
          <el-input
            v-model="scope.row.userStory"
            type="textarea"
            :rows="3"
            @change="handleDataChange"
          />
        </template>
      </el-table-column>
      <el-table-column prop="ac" label="Acceptance Criteria" min-width="400">
        <template #default="scope">
          <el-input
            v-model="scope.row.ac"
            type="textarea"
            :rows="6"
            @change="handleDataChange"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="scope">
          <el-button 
            type="danger" 
            :icon="Delete"
            circle
            @click="deleteStory(scope.$index)"
          />
        </template>
      </el-table-column>
    </el-table>

    <!-- 底部按钮区域 -->
    <div class="bottom-actions">
      <el-button 
        type="primary" 
        :icon="Document"
        @click="navigateToRequirements"
      >
        生成需求文档
      </el-button>
      <el-button 
        type="success" 
        :icon="Download"
        @click="exportData"
      >
        导出数据
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Download, Delete, Search, Cpu } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { initOpenAI, generateUserStories, checkRequirementDetails } from '../services/openai'
import * as XLSX from 'xlsx'

const router = useRouter()
const projectBackground = ref('')
const generating = ref(false)
const checking = ref(false)
const stories = ref<any[]>([])
const showApiKeyDialog = ref(false)
const showCheckDialog = ref(false)
const apiKey = ref('')
const originalRequirement = ref('')
const checkQuestions = ref<string[]>([])
const additionalInfo = ref('')
const questionAnswers = ref<string[]>([])

// 从localStorage加载数据
onMounted(() => {
  const savedStories = localStorage.getItem('userStories')
  if (savedStories) {
    stories.value = JSON.parse(savedStories)
  }
  
  // 优先使用localStorage中的API Key，如果没有则使用默认的
  const savedApiKey = localStorage.getItem('openaiApiKey')
  if (savedApiKey) {
    apiKey.value = savedApiKey
    initOpenAI(savedApiKey)
  } else {
    try {
      initOpenAI() // 使用默认的API Key
      apiKey.value = import.meta.env.VITE_OPENAI_API_KEY || ''
    } catch (error) {
      showApiKeyDialog.value = true
    }
  }
})

// 保存API Key
const saveApiKey = () => {
  if (!apiKey.value) {
    ElMessage.warning('请输入API Key')
    return
  }
  localStorage.setItem('openaiApiKey', apiKey.value)
  initOpenAI(apiKey.value)
  showApiKeyDialog.value = false
  ElMessage.success('API Key设置成功')
}

// 保存数据到localStorage
const saveToLocalStorage = () => {
  localStorage.setItem('userStories', JSON.stringify(stories.value))
}

// 处理数据变化
const handleDataChange = () => {
  saveToLocalStorage()
}

// 生成故事
const generateStories = async () => {
  if (!apiKey.value) {
    showApiKeyDialog.value = true
    return
  }

  if (!projectBackground.value.trim()) {
    ElMessage.warning('请先输入项目背景描述')
    return
  }

  generating.value = true
  try {
    const generatedStories = await generateUserStories(projectBackground.value)
    stories.value.push(...generatedStories.map((story: any, index: number) => ({
      id: stories.value.length + index + 1,
      ...story
    })))
    saveToLocalStorage()
    ElMessage.success('生成成功')
  } catch (error) {
    console.error('Failed to generate stories:', error)
    ElMessage.error('生成失败，请重试')
  } finally {
    generating.value = false
  }
}

// 删除故事
const deleteStory = (index: number) => {
  stories.value.splice(index, 1)
  saveToLocalStorage()
  ElMessage.success('删除成功')
}

// 导出数据
const exportData = () => {
  // 准备Excel数据
  const excelData = stories.value.map(story => ({
    'ID': story.id,
    'Epic': story.epic,
    'User Story': story.userStory,
    'Acceptance Criteria': story.ac.replace(/\\n/g, '\n')  // 转换换行符
  }))

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  
  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(excelData, {
    header: ['ID', 'Epic', 'User Story', 'Acceptance Criteria']
  })

  // 设置列宽
  const columnWidths = [
    { wch: 5 },   // ID
    { wch: 30 },  // Epic
    { wch: 40 },  // User Story
    { wch: 60 }   // AC
  ]
  worksheet['!cols'] = columnWidths

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, worksheet, 'User Stories')

  // 导出文件
  XLSX.writeFile(workbook, 'user-stories.xlsx')
  
  ElMessage.success('导出成功')
}

// 跳转到需求文档页面
const navigateToRequirements = () => {
  if (stories.value.length === 0) {
    ElMessage.warning('请先生成用户故事')
    return
  }
  
  // 保存数据到localStorage
  localStorage.setItem('userStories', JSON.stringify(stories.value))
  localStorage.setItem('projectBackground', projectBackground.value)
  
  // 跳转到需求文档页面
  router.push('/function/requirements')
}

// 需求检查
const checkRequirements = async () => {
  if (!apiKey.value) {
    showApiKeyDialog.value = true
    return
  }

  if (!projectBackground.value.trim()) {
    ElMessage.warning('请先输入项目背景描述')
    return
  }

  checking.value = true
  try {
    originalRequirement.value = projectBackground.value
    const result = await checkRequirementDetails(projectBackground.value)
    checkQuestions.value = result
    // 初始化答案数组
    questionAnswers.value = new Array(result.length).fill('')
    showCheckDialog.value = true
  } catch (error) {
    console.error('Failed to check requirements:', error)
    ElMessage.error('需求检查失败，请重试')
  } finally {
    checking.value = false
  }
}

// 提交需求并生成用户故事
const submitRequirements = async () => {
  // 构建补充信息文本
  const answersText = checkQuestions.value
    .map((question, index) => `问题${index + 1}：${question}\n回答：${questionAnswers.value[index] || '未回答'}\n`)
    .join('\n')

  const completeRequirement = `原始需求：\n${originalRequirement.value}\n\n补充问题回答：\n${answersText}\n\n其他补充说明：\n${additionalInfo.value}`
  
  projectBackground.value = completeRequirement
  showCheckDialog.value = false
  generateStories()
}
</script>

<style scoped>
.user-story-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.input-section {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.bottom-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.check-result-container {
  padding: 20px;
}

.check-questions {
  margin: 15px 0;
}

.question-item {
  margin: 15px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.question-text {
  margin-bottom: 10px;
  font-weight: 500;
  color: #303133;
}

h3 {
  margin: 15px 0 10px 0;
  color: #606266;
}

:deep(.el-input__inner) {
  font-size: 14px;
}

:deep(.el-textarea__inner) {
  font-family: inherit;
}

:deep(.el-table) {
  margin: 20px 0;
}

:deep(.el-table .el-table__cell) {
  padding: 12px;
}

:deep(.el-input.el-input--large .el-input__wrapper) {
  padding: 8px;
}

:deep(.el-textarea__inner) {
  font-family: inherit;
  line-height: 1.5;
  padding: 8px 12px;
}

:deep(.el-table__row) {
  height: auto !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style> 