<template>
  <div class="user-story-container">
    <h1 class="page-title">User Story Generator</h1>
    
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
          <el-button type="primary" @click="saveApiKey">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 项目背景输入区域 -->
    <div class="input-section">
      <el-input
        v-model="projectBackground"
        type="textarea"
        :rows="4"
        placeholder="请输入项目背景描述..."
        class="background-input"
      />
      <el-button 
        type="primary" 
        :icon="Cpu"
        @click="generateStories"
        :loading="generating"
        class="generate-button"
      >
        AI 生成
      </el-button>
    </div>

    <!-- 用户故事表格 -->
    <div class="table-section">
      <el-table 
        :data="stories" 
        style="width: 100%" 
        border
        height="calc(100vh - 300px)"
        class="story-table"
      >
        <el-table-column prop="id" label="ID" width="60" fixed />
        <el-table-column prop="epic" label="Epic" min-width="200" fixed>
          <template #default="scope">
            <el-input
              v-model="scope.row.epic"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              @change="handleDataChange"
            />
          </template>
        </el-table-column>
        <el-table-column prop="userStory" label="User Story" min-width="300">
          <template #default="scope">
            <el-input
              v-model="scope.row.userStory"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              @change="handleDataChange"
            />
          </template>
        </el-table-column>
        <el-table-column prop="ac" label="Acceptance Criteria" min-width="400">
          <template #default="scope">
            <el-input
              v-model="scope.row.ac"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
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
    </div>

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
import { Document, Download, Delete, Cpu } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { initOpenAI, generateUserStories } from '../services/openai'

const router = useRouter()
const projectBackground = ref('')
const generating = ref(false)
const stories = ref<any[]>([])
const showApiKeyDialog = ref(false)
const apiKey = ref('')

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
  const dataStr = JSON.stringify(stories.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'user-stories.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 跳转到需求文档页面
const navigateToRequirements = () => {
  if (stories.value.length === 0) {
    ElMessage.warning('请先生成用户故事')
    return
  }
  router.push('/requirements')
}
</script>

<style scoped>
.user-story-container {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.input-section {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.background-input {
  flex: 1;
}

.generate-button {
  flex-shrink: 0;
  height: 100px;
}

.table-section {
  flex: 1;
  min-height: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.story-table {
  --el-table-header-bg-color: #f5f7fa;
}

.story-table :deep(.el-table__header) {
  position: sticky;
  top: 0;
  z-index: 1;
}

.story-table :deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 0;
}

.story-table :deep(.el-textarea__inner) {
  border: none;
  padding: 4px 8px;
}

.story-table :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style> 