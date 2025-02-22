<script setup lang="ts">
import { Document, List, Monitor, QuestionFilled } from '@element-plus/icons-vue'
import { ref, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
import 'highlight.js/styles/github.css'
import hljs from 'highlight.js'

const showHelp = ref(false)
const helpContent = ref('')
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return '' // 使用普通的代码块
  }
})

// 获取README内容
const fetchReadme = async () => {
  try {
    const response = await fetch('/README.md')
    const content = await response.text()
    helpContent.value = md.render(content)
  } catch (error) {
    console.error('Failed to load README:', error)
  }
}

onMounted(() => {
  fetchReadme()
})
</script>

<template>
  <div class="app-container">
    <el-container>
      <el-header>
        <div class="header-content container">
          <h1>SmartBA</h1>
          <el-menu
            mode="horizontal"
            :router="true"
            :default-active="$route.path"
            class="flex-grow"
          >
            <el-menu-item index="/business-analysis" role="menuitem" aria-label="业务分析">
              <el-icon><Document /></el-icon>
              业务分析
            </el-menu-item>
            <el-menu-item index="/function-analysis" role="menuitem" aria-label="功能分析">
              <el-icon><List /></el-icon>
              功能分析
            </el-menu-item>
            <el-menu-item index="/uiux-expert" role="menuitem" aria-label="UI/UX 专家分析">
              <el-icon><Monitor /></el-icon>
              UI/UX 专家分析
            </el-menu-item>
          </el-menu>
          <el-button
            type="text"
            class="help-button"
            @click="showHelp = true"
            aria-label="帮助文档"
          >
            <el-icon><QuestionFilled /></el-icon>
          </el-button>
        </div>
      </el-header>
      <el-main>
        <div class="container">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>

    <el-drawer
      v-model="showHelp"
      title="使用帮助"
      direction="rtl"
      size="50%"
      :with-header="true"
      class="help-drawer"
    >
      <div class="help-content markdown-body" v-html="helpContent"></div>
    </el-drawer>
  </div>
</template>

<style>
body {
  margin: 0;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.app-container {
  height: 100vh;
  width: 100vw;
}

.el-container {
  height: 100%;
}

.el-header {
  padding: 0;
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
}

.header-content h1 {
  margin: 0 20px 0 0;
  font-size: 24px;
  color: #409EFF;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
}

.el-menu {
  border-bottom: none;
}

.el-menu-item [class^="el-icon-"] {
  margin-right: 5px;
}

.flex-grow {
  flex-grow: 1;
}

.help-button {
  font-size: 20px;
  color: var(--primary-color);
  padding: 0 12px;
  height: 100%;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.help-button:hover {
  transform: scale(1.1);
}

.help-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.help-drawer .el-drawer__body {
  padding: 0;
  overflow-y: auto;
}

.help-content.markdown-body {
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #24292e;
}

.help-content.markdown-body h1,
.help-content.markdown-body h2,
.help-content.markdown-body h3,
.help-content.markdown-body h4,
.help-content.markdown-body h5,
.help-content.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.help-content.markdown-body h1 {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

.help-content.markdown-body h2 {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

.help-content.markdown-body p {
  margin-top: 0;
  margin-bottom: 16px;
}

.help-content.markdown-body code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27,31,35,0.05);
  border-radius: 3px;
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
}

.help-content.markdown-body pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
}

.help-content.markdown-body pre code {
  padding: 0;
  margin: 0;
  font-size: 100%;
  word-break: normal;
  white-space: pre;
  background: transparent;
  border: 0;
}

.help-content.markdown-body ul,
.help-content.markdown-body ol {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.help-content.markdown-body li {
  margin-bottom: 8px;
}

.help-content.markdown-body table {
  display: block;
  width: 100%;
  overflow: auto;
  margin-top: 0;
  margin-bottom: 16px;
  border-spacing: 0;
  border-collapse: collapse;
}

.help-content.markdown-body table th,
.help-content.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.help-content.markdown-body table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.help-content.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.help-content.markdown-body blockquote {
  margin: 0;
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header-content h1 {
    font-size: 20px;
  }
  
  .el-menu--horizontal {
    padding: 0 10px;
  }
  
  .el-menu-item {
    padding: 0 10px;
  }

  .help-drawer .el-drawer {
    width: 90% !important;
  }
  
  .help-content.markdown-body {
    padding: 15px;
    font-size: 14px;
  }
}

/* 加载动画 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* ARIA支持 */
[role="menuitem"]:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: -2px;
}
</style>
