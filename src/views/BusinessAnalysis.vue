<template>
  <div class="business-analysis">
    <!-- API Key设置对话框 -->
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

    <el-form :model="form" label-width="120px">
      <el-form-item label="项目背景">
        <el-input
          v-model="form.projectBackground"
          type="textarea"
          :rows="6"
          placeholder="请输入项目背景描述，项目流程"
        />
      </el-form-item>
      <el-form-item>
        <el-button 
          type="primary" 
          @click="handleCheck"
          :loading="checking"
        >需求检查</el-button>
        <el-button 
          type="success" 
          @click="handleGenerate"
          :loading="generating"
        >AI生成</el-button>
      </el-form-item>
    </el-form>

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
            确认并生成用例分析
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分析报告展示区域 -->
    <transition name="fade">
      <div v-if="!loading && generatedDoc" class="analysis-result">
        <el-card>
          <div class="toolbar">
            <el-switch
              v-model="isEditing"
              active-text="编辑模式"
              inactive-text="预览模式"
            />
            <el-button type="success" @click="exportMarkdown">
              <el-icon><Download /></el-icon>
              导出 Markdown
            </el-button>
          </div>

          <!-- 编辑模式 -->
          <div v-if="isEditing" class="editor-container">
            <el-input
              v-model="generatedDoc.content"
              type="textarea"
              :rows="20"
              @change="handleContentChange"
            />
          </div>

          <!-- 预览模式 -->
          <div v-else class="markdown-preview">
            <div class="markdown-body" v-html="renderedContent"></div>
          </div>
        </el-card>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { checkRequirementDetails, generateUseCaseAnalysis, initOpenAI } from '../services/openai'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'

// 初始化 MarkdownIt
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  quotes: '""',
  langPrefix: 'language-'
})

const form = reactive({
  projectBackground: ''
})

const checkResults = ref<string[]>([])
const generatedDoc = ref<{ content: string } | null>(null)
const checking = ref(false)
const generating = ref(false)
const showApiKeyDialog = ref(false)
const showCheckDialog = ref(false)
const apiKey = ref('')
const originalRequirement = ref('')
const checkQuestions = ref<string[]>([])
const additionalInfo = ref('')
const questionAnswers = ref<string[]>([])
const loading = ref(false)
const isEditing = ref(false)

// 保存数据到localStorage
const saveToLocalStorage = () => {
  localStorage.setItem('businessAnalysisData', JSON.stringify({
    projectBackground: form.projectBackground,
    generatedDoc: generatedDoc.value,
    checkQuestions: checkQuestions.value,
    questionAnswers: questionAnswers.value,
    additionalInfo: additionalInfo.value,
    originalRequirement: originalRequirement.value
  }))
}

// 渲染 Markdown 内容
const renderedContent = computed(() => {
  if (!generatedDoc.value?.content) return ''
  try {
    const rendered = md.render(generatedDoc.value.content)
    console.log('Rendered content:', rendered)
    return rendered
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return ''
  }
})

// 监听表单变化
watch(() => form.projectBackground, () => {
  saveToLocalStorage()
})

// 监听其他数据变化
watch([checkQuestions, questionAnswers, additionalInfo, originalRequirement], () => {
  saveToLocalStorage()
})

// 组件挂载时加载缓存数据
onMounted(() => {
  // 尝试恢复保存的文档
  const savedData = localStorage.getItem('businessAnalysisData')
  if (savedData) {
    try {
      const {
        projectBackground,
        generatedDoc: savedDoc,
        checkQuestions: savedQuestions,
        questionAnswers: savedAnswers,
        additionalInfo: savedInfo,
        originalRequirement: savedRequirement
      } = JSON.parse(savedData)
      
      form.projectBackground = projectBackground || ''
      generatedDoc.value = savedDoc || null
      checkQuestions.value = savedQuestions || []
      questionAnswers.value = savedAnswers || []
      additionalInfo.value = savedInfo || ''
      originalRequirement.value = savedRequirement || ''
    } catch (error) {
      console.error('Error loading cached data:', error)
    }
  }

  // 尝试初始化 OpenAI
  const savedApiKey = localStorage.getItem('openai_api_key')
  if (savedApiKey) {
    apiKey.value = savedApiKey
    try {
      initOpenAI(savedApiKey)
    } catch (error) {
      showApiKeyDialog.value = true
    }
  }
})

// API Key相关功能
const saveApiKey = () => {
  if (!apiKey.value) {
    ElMessage.warning('请输入API Key')
    return
  }
  
  try {
    initOpenAI(apiKey.value)
    localStorage.setItem('openai_api_key', apiKey.value)
    showApiKeyDialog.value = false
    ElMessage.success('API Key设置成功')
  } catch (error: any) {
    ElMessage.error(error.message || 'API Key设置失败')
  }
}

// 处理需求检查
const handleCheck = async () => {
  if (!form.projectBackground.trim()) {
    ElMessage.warning('请输入项目背景')
    return
  }

  checking.value = true
  try {
    originalRequirement.value = form.projectBackground
    const result = await checkRequirementDetails(form.projectBackground)
    checkQuestions.value = result
    questionAnswers.value = new Array(result.length).fill('')
    showCheckDialog.value = true
    saveToLocalStorage() // 保存检查结果
  } catch (error: any) {
    if (error.message.includes('API Key')) {
      showApiKeyDialog.value = true
    } else {
      ElMessage.error(error.message || '检查失败')
    }
  } finally {
    checking.value = false
  }
}

// 提交需求并生成用例分析
const submitRequirements = async () => {
  const answersText = checkQuestions.value
    .map((question, index) => `问题${index + 1}：${question}\n回答：${questionAnswers.value[index] || '未回答'}\n`)
    .join('\n')

  const completeRequirement = `原始需求：\n${originalRequirement.value}\n\n补充问题回答：\n${answersText}\n\n其他补充说明：\n${additionalInfo.value}`
  
  form.projectBackground = completeRequirement
  showCheckDialog.value = false
  saveToLocalStorage() // 保存提交的需求
  handleGenerate()
}

// 处理生成
const handleGenerate = async () => {
  if (!form.projectBackground.trim()) {
    ElMessage.warning('请输入项目背景')
    return
  }

  generating.value = true
  try {
    const result = await generateUseCaseAnalysis(form.projectBackground)
    generatedDoc.value = result
    saveToLocalStorage() // 保存生成的文档
    ElMessage.success('生成成功')
  } catch (error: any) {
    if (error.message.includes('API Key')) {
      showApiKeyDialog.value = true
    } else {
      ElMessage.error(error.message || '生成失败')
    }
  } finally {
    generating.value = false
  }
}

// 处理内容变化
const handleContentChange = () => {
  saveToLocalStorage() // 保存内容变化
}

// 导出 Markdown 文件
const exportMarkdown = () => {
  if (!generatedDoc.value?.content) {
    ElMessage.warning('没有可导出的内容')
    return
  }

  const blob = new Blob([generatedDoc.value.content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `用例分析报告-${new Date().toISOString().split('T')[0]}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style>
/* 重置Element Plus的样式 */
.el-card {
  margin: 0 !important;
  overflow: visible !important;
}

.el-card__body {
  padding: 20px !important;
}

/* 基础布局 */
.business-analysis {
  padding: 20px;
  width: 100%;
  max-width: none;
}

.analysis-result {
  margin-top: 20px;
}

/* Markdown预览容器 */
.markdown-preview {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* Markdown 样式 */
.markdown-body {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 20px;
  text-align: left;
  background-color: white;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
}

.markdown-body > * {
  margin-top: 0 !important;
  margin-bottom: 16px !important;
  text-align: left !important;
}

.markdown-body > *:first-child {
  margin-top: 0 !important;
}

.markdown-body > *:last-child {
  margin-bottom: 0 !important;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 编辑器容器 */
.editor-container {
  margin-top: 20px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 