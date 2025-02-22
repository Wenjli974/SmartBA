<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElCard, ElInput, ElButton } from 'element-plus'
import { generateUserStories } from '../services/openai'
import AIPreview from '../components/AIPreview.vue'

const projectBackground = ref('')
const generatedContent = ref('')
const loading = ref(false)

const handleGenerate = async () => {
  if (!projectBackground.value.trim()) {
    ElMessage.warning('请输入项目背景')
    return
  }

  loading.value = true
  try {
    const stories = await generateUserStories(projectBackground.value)
    generatedContent.value = JSON.stringify(stories, null, 2)
  } catch (error: any) {
    ElMessage.error(error.message || 'AI生成失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <el-card class="mb-6" header="业务分析专家">
      <el-input
        v-model="projectBackground"
        type="textarea"
        :rows="6"
        placeholder="请输入项目背景描述..."
        class="mb-4"
      />
      <el-button 
        type="primary" 
        :loading="loading"
        @click="handleGenerate"
      >
        AI生成
      </el-button>
    </el-card>

    <el-card v-if="generatedContent" header="生成结果">
      <el-spin :spinning="loading">
        <AIPreview 
          :content="generatedContent"
          @update:content="generatedContent = $event"
        />
      </el-spin>
    </el-card>
  </div>
</template>

<style scoped>
.mb-6 {
  margin-bottom: 24px;
}
.mb-4 {
  margin-bottom: 16px;
}
.p-6 {
  padding: 24px;
}
</style> 