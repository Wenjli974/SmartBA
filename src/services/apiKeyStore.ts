import { ref } from 'vue'

const apiKey = ref<string>('')

export const useApiKeyStore = () => {
  const setApiKey = (key: string) => {
    apiKey.value = key
    // 可选：将密钥保存到localStorage
    localStorage.setItem('openai_api_key', key)
  }

  const getApiKey = () => {
    // 如果内存中没有密钥，尝试从localStorage获取
    if (!apiKey.value) {
      const storedKey = localStorage.getItem('openai_api_key')
      if (storedKey) {
        apiKey.value = storedKey
      }
    }
    return apiKey.value
  }

  return {
    setApiKey,
    getApiKey
  }
} 