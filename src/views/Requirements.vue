<template>
  <div class="requirements-container">
    <div class="header">
      <el-button :icon="Back" @click="router.back()">返回</el-button>
      <h1>项目需求文档</h1>
    </div>

    <div class="content" v-loading="generating">
      <div v-if="!documentContent" class="empty-state">
        <el-button 
          type="primary" 
          :icon="Document"
          @click="generateDocument"
          :loading="generating"
        >
          生成文档
        </el-button>
      </div>
      
      <div v-else class="document-content">
        <div class="document-actions">
          <el-button 
            type="success" 
            :icon="Download"
            @click="exportDocument"
          >
            导出文档
          </el-button>
        </div>
        <div class="markdown-content" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Back, Document, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { initOpenAI, generateRequirementsDoc } from '../services/openai'

const router = useRouter()
const generating = ref(false)
const documentContent = ref('')
const md = new MarkdownIt()

// 初始化OpenAI
onMounted(() => {
  try {
    const savedApiKey = localStorage.getItem('openaiApiKey')
    if (savedApiKey) {
      initOpenAI(savedApiKey)
    } else {
      initOpenAI() // 使用默认的API Key
    }
  } catch (error) {
    ElMessage.warning('请先设置OpenAI API Key')
    router.push('/')
  }
})

// 渲染Markdown内容
const renderedContent = computed(() => {
  return md.render(documentContent.value)
})

// 生成文档
const generateDocument = async () => {
  const stories = JSON.parse(localStorage.getItem('userStories') || '[]')
  const projectBackground = localStorage.getItem('projectBackground') || ''
  
  if (stories.length === 0) {
    ElMessage.warning('没有可用的用户故事数据')
    return
  }

  generating.value = true
  try {
    documentContent.value = await generateRequirementsDoc(projectBackground, stories)
    ElMessage.success('文档生成成功')
  } catch (error) {
    console.error('Failed to generate document:', error)
    ElMessage.error('文档生成失败，请重试')
  } finally {
    generating.value = false
  }
}

// 导出文档
const exportDocument = () => {
  const blob = new Blob([documentContent.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'requirements.md'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.requirements-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.document-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.markdown-content {
  line-height: 1.8;
  text-align: left;
  font-size: 14px;
  color: #2c3e50;
}

.markdown-content :deep(h1) {
  margin: 24px 0 16px;
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.markdown-content :deep(h2) {
  margin: 20px 0 16px;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.markdown-content :deep(h3) {
  margin: 16px 0 12px;
  font-size: 20px;
  font-weight: 500;
  color: #374151;
}

.markdown-content :deep(p) {
  margin: 12px 0;
  line-height: 1.8;
  text-align: left;
}

.markdown-content :deep(ul), 
.markdown-content :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}

.markdown-content :deep(li) {
  margin: 8px 0;
  line-height: 1.6;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  text-align: left;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.markdown-content :deep(th) {
  background-color: #f9fafb;
  font-weight: 500;
}

.markdown-content :deep(code) {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
}

.markdown-content :deep(blockquote) {
  margin: 16px 0;
  padding: 8px 16px;
  border-left: 4px solid #e5e7eb;
  background-color: #f9fafb;
  color: #4b5563;
}

.markdown-content :deep(hr) {
  margin: 24px 0;
  border: none;
  border-top: 1px solid #e5e7eb;
}
</style> 