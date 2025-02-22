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
          placeholder="请输入项目背景描述..."
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

    <!-- 添加loading遮罩 -->
    <div v-if="loading" class="loading-overlay" role="alert" aria-busy="true">
      <el-icon class="loading-spinner" :size="32">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z"/>
        </svg>
      </el-icon>
    </div>

    <!-- 现有内容添加过渡效果 -->
    <transition name="fade">
      <div v-if="!loading">
        <!-- 生成的文档 -->
        <div v-if="generatedDoc" class="generated-doc">
          <div class="doc-header">
            <h3>业务需求文档</h3>
            <el-button type="primary" @click="handleExport">导出Word</el-button>
          </div>
          
          <el-tabs v-model="activeTab" class="doc-content">
            <el-tab-pane label="文档编辑" name="edit">
              <div class="doc-sections">
                <div v-for="(section, key) in generatedDoc" :key="key" class="doc-section">
                  <h4>{{ getSectionTitle(key) }}</h4>
                  <el-input
                    v-if="key !== 'businessProcess'"
                    v-model="generatedDoc[key]"
                    type="textarea"
                    :rows="getRowsForSection(key)"
                    @input="handleDocChange"
                  />
                  <template v-else>
                    <el-input
                      v-model="generatedDoc.businessProcess.text"
                      type="textarea"
                      :rows="4"
                      @input="handleDocChange"
                    />
                    <el-input
                      v-model="generatedDoc.businessProcess.mermaid"
                      type="textarea"
                      :rows="6"
                      @input="handleDocChange"
                    />
                    <div class="mermaid-preview" ref="mermaidContainer"></div>
                  </template>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="预览" name="preview">
              <div class="preview-content">
                <!-- 预览内容将在这里动态生成 -->
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { checkRequirementDetails, generateUseCaseAnalysis, initOpenAI } from '../services/openai'
import mermaid from 'mermaid'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { ElMessage } from 'element-plus'

// 初始化 mermaid
mermaid.initialize({ startOnLoad: true })

const form = reactive({
  projectBackground: ''
})

const checkResults = ref<string[]>([])
const activeTab = ref('edit')
const generatedDoc = ref<any>(null)
const mermaidContainer = ref<HTMLElement | null>(null)
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

// 文档节点标题映射
const sectionTitles = {
  projectName: '项目名称',
  projectGoal: '项目目标',
  projectBackground: '项目背景',
  projectScope: '项目范围',
  roles: '角色定义',
  businessProcess: '业务流程',
  businessRules: '业务规则',
  performanceRequirements: '性能要求',
  dataRequirements: '数据要求'
}

// 获取节点标题
const getSectionTitle = (key: string) => {
  return sectionTitles[key as keyof typeof sectionTitles] || key
}

// 获取文本框行数
const getRowsForSection = (key: string) => {
  const rowsMap: Record<string, number> = {
    projectName: 1,
    projectGoal: 3,
    projectBackground: 6,
    projectScope: 4,
    roles: 4,
    businessRules: 6,
    performanceRequirements: 4,
    dataRequirements: 4
  }
  return rowsMap[key] || 4
}

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
    // 初始化答案数组
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
  // 构建补充信息文本
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

// 处理文档变化
const handleDocChange = () => {
  localStorage.setItem('businessAnalysisDoc', JSON.stringify(generatedDoc.value))
  if (generatedDoc.value?.businessProcess?.mermaid) {
    renderMermaid()
  }
}

// 渲染 Mermaid 图表
const renderMermaid = async () => {
  if (!mermaidContainer.value) return
  
  try {
    mermaidContainer.value.innerHTML = ''
    await mermaid.render(
      'mermaid-graph',
      generatedDoc.value.businessProcess.mermaid,
      (svgCode) => {
        if (mermaidContainer.value) {
          mermaidContainer.value.innerHTML = svgCode
        }
      }
    )
  } catch (error) {
    console.error('Mermaid rendering error:', error)
  }
}

// 导出 Word 文档
const handleExport = async () => {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: '业务需求文档', bold: true, size: 32 })],
            spacing: { after: 400 }
          }),
          ...Object.entries(generatedDoc.value).map(([key, value]) => {
            if (key === 'businessProcess') {
              return [
                new Paragraph({
                  children: [new TextRun({ text: getSectionTitle(key), bold: true, size: 24 })],
                  spacing: { before: 400, after: 200 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: '流程描述：', bold: true })],
                  spacing: { before: 200 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: (value as any).text })],
                  spacing: { after: 200 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: '流程图：', bold: true })],
                  spacing: { before: 200 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: (value as any).mermaid })],
                  spacing: { after: 400 }
                })
              ]
            } else {
              return [
                new Paragraph({
                  children: [new TextRun({ text: getSectionTitle(key), bold: true, size: 24 })],
                  spacing: { before: 400, after: 200 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: value as string })],
                  spacing: { after: 400 }
                })
              ]
            }
          }).flat()
        ]
      }]
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, '业务需求文档.docx')
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败')
  }
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

// 监听文档变化
watch(
  () => generatedDoc.value?.businessProcess?.mermaid,
  () => {
    if (generatedDoc.value?.businessProcess?.mermaid) {
      renderMermaid()
    }
  }
)

// 修改现有的方法，添加loading状态
const handleAnalyze = async () => {
  try {
    loading.value = true
    // ... existing analysis logic ...
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.business-analysis {
  padding: 20px;
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

.generated-doc {
  margin-top: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.doc-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.doc-section {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.doc-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.mermaid-preview {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
}

h3 {
  margin: 15px 0 10px 0;
  color: #606266;
}

:deep(.el-textarea__inner) {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  color: var(--primary-color);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 内容过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .business-analysis {
    padding: 15px;
  }
}
</style> 