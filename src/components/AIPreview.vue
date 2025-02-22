<script setup lang="ts">
import { computed } from 'vue'
import { ElInput } from 'element-plus'

const props = defineProps<{
  content: string
}>()

const emit = defineEmits<{
  'update:content': [value: string]
}>()

const modelValue = computed({
  get: () => props.content,
  set: (value) => emit('update:content', value)
})
</script>

<template>
  <el-input
    v-model="modelValue"
    type="textarea"
    :rows="10"
    :autosize="{ minRows: 10, maxRows: 20 }"
  />
</template>

<style scoped>
:deep(.el-textarea__inner) {
  font-family: monospace;
  white-space: pre;
}
</style> 