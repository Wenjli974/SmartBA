<template>
  <div class="api-key-input">
    <!-- API Key输入弹窗 -->
    <el-dialog
      v-model="showDialog"
      title="设置OpenAI API密钥"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      width="30%"
    >
      <div class="input-container">
        <el-input
          v-model="tempApiKey"
          type="password"
          placeholder="请输入OpenAI API密钥"
          @keyup.enter="saveApiKey"
          show-password
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="saveApiKey" :disabled="!tempApiKey">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 已设置API Key的状态显示 -->
    <div v-if="hasApiKey" class="key-status">
      <el-tag type="success">API密钥已设置</el-tag>
      <el-button type="danger" size="small" @click="clearApiKey">
        清除密钥
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useApiKeyStore } from '../services/apiKeyStore'
import { ElMessage } from 'element-plus'

const apiKeyStore = useApiKeyStore()
const tempApiKey = ref('')
const showDialog = ref(false)
const hasApiKey = computed(() => !!apiKeyStore.getApiKey())

const saveApiKey = () => {
  if (tempApiKey.value) {
    apiKeyStore.setApiKey(tempApiKey.value)
    tempApiKey.value = ''
    showDialog.value = false
    ElMessage.success('API密钥设置成功')
  }
}

const clearApiKey = () => {
  apiKeyStore.setApiKey('')
  showDialog.value = true
  ElMessage.warning('API密钥已清除')
}

onMounted(() => {
  const storedKey = apiKeyStore.getApiKey()
  if (!storedKey) {
    showDialog.value = true
  }
})
</script>

<style scoped>
.api-key-input {
  margin: 1rem 0;
}

.input-container {
  margin: 20px 0;
}

.key-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: center;
}
</style> 