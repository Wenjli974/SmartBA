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
      <div v-if="!loading && generatedDoc">
        <el-card class="analysis-result">
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
          <div v-else class="preview-wrapper">
            <div class="preview-container">
              <div class="markdown-body" v-html="renderedContent"></div>
            </div>
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
  breaks: true
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

// 渲染 Markdown 内容
const renderedContent = computed(() => {
  if (!generatedDoc.value?.content) return ''
  return md.render(generatedDoc.value.content)
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
  localStorage.setItem('businessAnalysisDoc', JSON.stringify(generatedDoc.value))
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

// 组件挂载时
onMounted(() => {
  // 尝试恢复保存的文档
  const savedDoc = localStorage.getItem('businessAnalysisDoc')
  if (savedDoc) {
    try {
      generatedDoc.value = JSON.parse(savedDoc)
    } catch (error) {
      console.error('Error restoring saved document:', error)
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
</script>

<style>
/* 重置Element Plus的样式 */
:deep(.el-card) {
  overflow: visible;
}

:deep(.el-card__body) {
  padding: 0 !important;
}

/* 基础布局 */
.business-analysis {
  padding: 20px;
  width: 100%;
  max-width: none;
}

.analysis-result {
  margin-top: 20px;
  width: 100% !important;
  max-width: none !important;
}

/* 预览容器 */
.preview-wrapper {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.preview-container {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Markdown 样式重置 */
:deep(.markdown-body) {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 20px !important;
  text-align: left !important;
  box-sizing: border-box !important;
}

:deep(.markdown-body > *) {
  text-align: left !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  max-width: none !important;
}

/* 标题样式 */
:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4),
:deep(.markdown-body h5),
:deep(.markdown-body h6) {
  width: 100% !important;
  margin: 24px 0 16px 0 !important;
  font-weight: 600;
  line-height: 1.25;
  text-align: left !important;
}

:deep(.markdown-body h1) {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

:deep(.markdown-body h2) {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

:deep(.markdown-body h3) {
  font-size: 1.25em;
}

:deep(.markdown-body h4) {
  font-size: 1em;
}

/* 段落样式 */
:deep(.markdown-body p) {
  width: 100% !important;
  margin: 0 0 16px 0 !important;
  text-align: left !important;
}

/* 列表样式 */
:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  width: 100% !important;
  margin: 0 0 16px 0 !important;
  padding-left: 2em !important;
  text-align: left !important;
}

:deep(.markdown-body li) {
  text-align: left !important;
  margin: 0.25em 0 !important;
}

/* 代码块样式 */
:deep(.markdown-body pre) {
  width: 100% !important;
  margin: 0 0 16px 0 !important;
  padding: 16px !important;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
  text-align: left !important;
}

:deep(.markdown-body code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27,31,35,0.05);
  border-radius: 3px;
  text-align: left !important;
}

/* 引用块样式 */
:deep(.markdown-body blockquote) {
  width: 100% !important;
  margin: 0 0 16px 0 !important;
  padding: 0 1em !important;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  text-align: left !important;
}

/* 表格样式 */
:deep(.markdown-body table) {
  width: 100% !important;
  margin: 0 0 16px 0 !important;
  border-spacing: 0;
  border-collapse: collapse;
  text-align: left !important;
}

:deep(.markdown-body table th),
:deep(.markdown-body table td) {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
  text-align: left !important;
}

:deep(.markdown-body table th) {
  font-weight: 600;
  background-color: #f6f8fa;
}

:deep(.markdown-body table tr) {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

:deep(.markdown-body table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .business-analysis {
    padding: 15px;
  }
  
  :deep(.markdown-body) {
    padding: 15px !important;
    font-size: 14px;
  }
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
  width: 100%;
}

/* 编辑器容器 */
.editor-container {
  margin-top: 20px;
  width: 100%;
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