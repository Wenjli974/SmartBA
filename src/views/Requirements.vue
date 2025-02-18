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
  if (stories.length === 0) {
    ElMessage.warning('没有可用的用户故事数据')
    return
  }

  generating.value = true
  try {
    documentContent.value = await generateRequirementsDoc(stories)
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
  line-height: 1.6;
}

.markdown-content :deep(h1) {
  margin-top: 0;
}

.markdown-content :deep(h2) {
  margin-top: 30px;
}

.markdown-content :deep(h3) {
  margin-top: 20px;
}

.markdown-content :deep(ul) {
  padding-left: 20px;
}
</style> 