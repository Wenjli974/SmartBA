<template>
  <div class="uiux-expert">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <h2>UI/UX 专家分析</h2>
        </div>
      </template>

      <!-- 项目背景输入区域 -->
      <div class="input-section">
        <h3>项目背景描述</h3>
        <el-input
          v-model="projectBackground"
          type="textarea"
          :rows="4"
          placeholder="请输入项目背景描述，包括项目目标、用户群体、核心功能等信息..."
        />
        <el-button type="primary" @click="generateAnalysis" :loading="isGenerating">
          生成分析报告
        </el-button>
      </div>

      <!-- 分析结果展示区域 -->
      <div v-if="analysisResult" class="analysis-result">
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
            v-model="analysisResult.content"
            type="textarea"
            :rows="20"
            @change="handleContentChange"
          />
        </div>

        <!-- 预览模式 -->
        <div v-else class="preview-container markdown-body" v-html="renderedContent"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { generateUIUXAnalysis } from '@/services/openai'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const projectBackground = ref('')
const isGenerating = ref(false)
const isEditing = ref(false)
const analysisResult = ref<{ content: string } | null>(null)

// 生成分析报告
const generateAnalysis = async () => {
  if (!projectBackground.value.trim()) {
    ElMessage.warning('请先输入项目背景描述')
    return
  }

  isGenerating.value = true
  try {
    const result = await generateUIUXAnalysis(projectBackground.value)
    analysisResult.value = result
    ElMessage.success('分析报告生成成功')
  } catch (error) {
    ElMessage.error('生成分析报告失败，请重试')
  } finally {
    isGenerating.value = false
  }
}

// 渲染 Markdown 内容
const renderedContent = computed(() => {
  if (!analysisResult.value?.content) return ''
  return md.render(analysisResult.value.content)
})

// 处理内容变化
const handleContentChange = () => {
  // 这里可以添加自动保存逻辑
}

// 导出 Markdown 文件
const exportMarkdown = () => {
  if (!analysisResult.value?.content) {
    ElMessage.warning('没有可导出的内容')
    return
  }

  const blob = new Blob([analysisResult.value.content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `UI-UX-分析报告-${new Date().toISOString().split('T')[0]}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style>
.uiux-expert {
  padding: 20px;
}

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-section {
  margin-bottom: 20px;
}

.input-section h3 {
  margin-bottom: 10px;
}

.input-section .el-button {
  margin-top: 15px;
}

.analysis-result {
  margin-top: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-container {
  margin-top: 20px;
}

.preview-container {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

/* Markdown 样式调整 */
.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 100%;
  margin: 0;
  text-align: left;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6,
.markdown-body p,
.markdown-body ul,
.markdown-body ol {
  text-align: left;
}

.markdown-body pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  text-align: left;
}

.markdown-body code {
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  padding: 0.2em 0.4em;
}

/* 编辑器样式调整 */
.editor-container .el-textarea__inner {
  text-align: left;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
</style> 