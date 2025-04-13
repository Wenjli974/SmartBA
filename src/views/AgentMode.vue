<template>
  <div class="agent-mode">
    <el-card class="agent-card">
      <template #header>
        <div class="card-header">
          <h2>Agent 模式</h2>
        </div>
      </template>
      <div class="agent-content">
        <div class="input-section">
          <h3>项目背景描述</h3>
          <el-form>
            <el-form-item>
              <el-input
                v-model="projectBackground"
                type="textarea"
                :rows="6"
                placeholder="请输入项目背景描述..."
                :disabled="analyzing"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="startAnalysis"
                :loading="analyzing"
                :disabled="!projectBackground.trim()"
              >
                开始分析
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 补充信息部分 -->
        <div v-if="needMoreInfo" class="additional-info-section">
          <el-alert
            title="需要更多信息"
            type="info"
            description="AI分析发现以下问题需要澄清，请提供补充信息以获得更准确的分析结果"
            show-icon
            :closable="false"
          />
          
          <div class="questions-list">
            <div 
              v-for="(question, index) in additionalQuestions" 
              :key="index"
              class="question-item"
            >
              <div class="question-content">{{ index + 1 }}. {{ question }}</div>
            </div>
          </div>
          
          <el-form class="additional-info-form">
            <el-form-item>
              <el-input
                v-model="additionalInfo"
                type="textarea"
                :rows="4"
                placeholder="请针对上述问题提供补充信息..."
                :disabled="analyzing"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="submitAdditionalInfo"
                :loading="analyzing"
                :disabled="!additionalInfo.trim()"
              >
                提交补充信息
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- Agent思考过程和操作记录 -->
        <div v-if="thoughts.length > 0" class="agent-thoughts-section">
          <h3>Agent 思考过程</h3>
          <div class="agent-thoughts">
            <div 
              v-for="(thought, index) in thoughts" 
              :key="index" 
              class="thought-item"
              :class="{
                'thought-thinking': thought.type === 'thinking',
                'thought-action': thought.type === 'action',
                'thought-result': thought.type === 'result'
              }"
            >
              <div class="thought-header">
                <span class="thought-type">{{ getThoughtTypeLabel(thought.type) }}</span>
                <span class="thought-time">{{ formatTime(thought.timestamp) }}</span>
                <el-button 
                  v-if="thought.details" 
                  size="small" 
                  type="text" 
                  @click="toggleThoughtDetails(index)"
                >
                  {{ expandedThoughts.includes(index) ? '收起详情' : '查看详情' }}
                </el-button>
              </div>
              <div class="thought-content">{{ thought.content }}</div>
              <!-- 思考详情 -->
              <div 
                v-if="thought.details && expandedThoughts.includes(index)" 
                class="thought-details"
              >
                <div class="details-content">{{ thought.details }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="hasAnalyzed" class="results-section">
          <h3>分析进度</h3>
          <div class="progress-indicators">
            <el-steps :active="getActiveStep()" finish-status="success">
              <el-step
                v-for="(status, toolName) in progressStatus"
                :key="toolName"
                :title="getToolTitle(toolName)"
                :status="getStepStatus(status)"
              />
            </el-steps>
          </div>
          
          <div v-if="finalResponse" class="final-summary">
            <h3>分析总结</h3>
            <div class="markdown-content" v-html="renderMarkdown(finalResponse)"></div>
          </div>
          
          <el-tabs v-model="activeTab" class="results-tabs" v-if="hasResults">
            <el-tab-pane label="业务分析" name="businessAnalysis" v-if="results.businessAnalysis">
              <div class="result-content">
                <div class="markdown-content" v-html="renderMarkdown(formatBusinessAnalysisResult())"></div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="功能分析" name="functionalAnalysis" v-if="results.functionalAnalysis">
              <div class="result-content">
                <h4>用户故事</h4>
                <el-table 
                  :data="results.functionalAnalysis.userStories || []" 
                  border 
                  style="width: 100%"
                  v-if="results.functionalAnalysis.userStories"
                >
                  <el-table-column prop="id" label="ID" width="60" />
                  <el-table-column prop="epic" label="Epic" width="180" />
                  <el-table-column prop="userStory" label="User Story" />
                  <el-table-column prop="ac" label="Acceptance Criteria" />
                </el-table>
                
                <h4>测试用例</h4>
                <div 
                  class="markdown-content" 
                  v-if="results.functionalAnalysis.testCases"
                  v-html="renderMarkdown(JSON.stringify(results.functionalAnalysis.testCases, null, 2))"
                ></div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="UI/UX 分析" name="uiuxAnalysis" v-if="results.uiuxAnalysis">
              <div class="result-content">
                <div class="markdown-content" v-html="renderMarkdown(results.uiuxAnalysis.content)"></div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-card>
    
    <el-dialog
      v-model="errorDialogVisible"
      title="错误"
      width="30%"
    >
      <span>{{ errorMessage }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="errorDialogVisible = false">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { masterAgent, AnalysisProgress, AgentThought } from '@/agents/MasterAgent';
import MarkdownIt from 'markdown-it';
import 'highlight.js/styles/github.css';
import hljs from 'highlight.js';

// 项目背景
const projectBackground = ref('');
const analyzing = ref(false);
const hasAnalyzed = ref(false);
const errorDialogVisible = ref(false);
const errorMessage = ref('');
const activeTab = ref('businessAnalysis');
const results = ref<Record<string, any>>({});
const progressStatus = ref<Record<string, string>>({});
const finalResponse = ref('');
const thoughts = ref<AgentThought[]>([]);
const expandedThoughts = ref<number[]>([]); // 存储展开的思考索引

// 补充信息相关
const needMoreInfo = ref(false);
const additionalQuestions = ref<string[]>([]);
const additionalInfo = ref('');

// 创建markdown渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return ''; // 使用普通的代码块
  }
});

// 计算属性：是否有分析结果
const hasResults = computed(() => {
  return Object.keys(results.value).length > 0;
});

// 格式化业务分析结果
const formatBusinessAnalysisResult = () => {
  if (!results.value.businessAnalysis) return '';
  
  // 根据返回的数据格式进行适当的格式化
  const businessResult = results.value.businessAnalysis;
  if (typeof businessResult === 'string') {
    return businessResult;
  } else if (typeof businessResult === 'object') {
    return JSON.stringify(businessResult, null, 2);
  }
  
  return '';
};

// 初始化
onMounted(async () => {
  try {
    await masterAgent.initialize();
    
    // 设置回调函数
    masterAgent.setCallbacks({
      onProgress: (progress: Map<string, AnalysisProgress>) => {
        // 更新进度状态
        const statusMap: Record<string, string> = {};
        progress.forEach((item, toolName) => {
          statusMap[toolName] = item.status;
        });
        progressStatus.value = statusMap;
      },
      onComplete: (analysisResults: any) => {
        // 更新结果
        results.value = analysisResults;
        analyzing.value = false;
        
        // 合成最终响应
        generateFinalResponse();
      },
      onError: (error: Error) => {
        analyzing.value = false;
        errorMessage.value = error.message;
        errorDialogVisible.value = true;
      },
      onThought: (thought: AgentThought) => {
        // 添加思考记录
        thoughts.value.push(thought);
        
        // 自动展开第一个思考的详情
        if (thoughts.value.length === 1 && thought.details) {
          expandedThoughts.value.push(0);
        }
        
        // 滚动到底部
        setTimeout(() => {
          const thoughtsContainer = document.querySelector('.agent-thoughts');
          if (thoughtsContainer) {
            thoughtsContainer.scrollTop = thoughtsContainer.scrollHeight;
          }
        }, 100);
      },
      onNeedMoreInfo: (questions: string[]) => {
        // 显示需要补充信息的界面
        additionalQuestions.value = questions;
        needMoreInfo.value = true;
        analyzing.value = false;
      }
    });
  } catch (error: any) {
    errorMessage.value = error.message;
    errorDialogVisible.value = true;
  }
});

// 提交补充信息
const submitAdditionalInfo = async () => {
  if (!additionalInfo.value.trim()) {
    return;
  }
  
  try {
    analyzing.value = true;
    needMoreInfo.value = false;
    
    // 使用补充信息继续分析
    await masterAgent.analyzeProjectBackground(projectBackground.value, additionalInfo.value);
    
    // 清空补充信息
    additionalInfo.value = '';
  } catch (error: any) {
    analyzing.value = false;
    errorMessage.value = error.message;
    errorDialogVisible.value = true;
  }
};

// 切换思考详情的显示状态
const toggleThoughtDetails = (index: number) => {
  const currentIndex = expandedThoughts.value.indexOf(index);
  if (currentIndex > -1) {
    // 如果已展开，则移除
    expandedThoughts.value.splice(currentIndex, 1);
  } else {
    // 如果未展开，则添加
    expandedThoughts.value.push(index);
  }
};

// 开始分析
const startAnalysis = async () => {
  if (!projectBackground.value.trim()) {
    return;
  }
  
  try {
    analyzing.value = true;
    hasAnalyzed.value = true;
    results.value = {};
    progressStatus.value = {};
    finalResponse.value = '';
    thoughts.value = [];
    expandedThoughts.value = [];
    needMoreInfo.value = false;
    additionalQuestions.value = [];
    additionalInfo.value = '';
    
    // 开始分析
    await masterAgent.analyzeProjectBackground(projectBackground.value);
  } catch (error: any) {
    analyzing.value = false;
    errorMessage.value = error.message;
    errorDialogVisible.value = true;
  }
};

// 获取工具标题
const getToolTitle = (toolName: string) => {
  const titles: Record<string, string> = {
    'businessAnalysis': '业务分析',
    'functionalAnalysis': '功能分析',
    'uiuxAnalysis': 'UI/UX 分析'
  };
  
  return titles[toolName] || toolName;
};

// 获取步骤状态
const getStepStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'waiting': 'wait',
    'running': 'process',
    'completed': 'success',
    'error': 'error'
  };
  
  return statusMap[status] || 'wait';
};

// 获取当前激活的步骤
const getActiveStep = () => {
  // 计算当前活跃的步骤
  const statuses = Object.values(progressStatus.value);
  const completedCount = statuses.filter(status => status === 'completed').length;
  const runningCount = statuses.filter(status => status === 'running').length;
  
  return completedCount + (runningCount > 0 ? 1 : 0);
};

// 生成最终响应
const generateFinalResponse = () => {
  // 根据实际结果生成总结
  let summary = '# 项目分析总结\n\n';
  
  if (results.value.businessAnalysis) {
    summary += '## 业务分析\n';
    summary += '- 已完成商业分析报告\n\n';
  }
  
  if (results.value.functionalAnalysis) {
    summary += '## 功能分析\n';
    if (results.value.functionalAnalysis.userStories) {
      const userStoriesCount = Array.isArray(results.value.functionalAnalysis.userStories) 
        ? results.value.functionalAnalysis.userStories.length
        : '多个';
      summary += `- 已生成 ${userStoriesCount} 个用户故事\n`;
    }
    if (results.value.functionalAnalysis.testCases) {
      summary += '- 已生成测试用例\n';
    }
    summary += '\n';
  }
  
  if (results.value.uiuxAnalysis) {
    summary += '## UI/UX 分析\n';
    summary += '- 已生成界面设计建议\n';
    summary += '- 已提供用户体验优化方案\n\n';
  }
  
  summary += '请点击下方标签页查看详细分析结果。';
  
  finalResponse.value = summary;
};

// 获取思考类型标签
const getThoughtTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'thinking': '🤔 思考',
    'action': '🚀 行动',
    'result': '📊 结果'
  };
  
  return labels[type] || type;
};

// 格式化时间戳
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
};

// 渲染Markdown
const renderMarkdown = (content: string) => {
  return md.render(content);
};
</script>

<style scoped>
.agent-mode {
  width: 100%;
}

.agent-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-content {
  padding: 20px;
  min-height: 400px;
}

.input-section {
  margin-bottom: 30px;
}

/* 补充信息部分样式 */
.additional-info-section {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fb;
  border-radius: 4px;
  border: 1px solid #e6ebf5;
}

.questions-list {
  margin: 15px 0;
}

.question-item {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.question-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
}

.additional-info-form {
  margin-top: 15px;
}

/* Agent思考过程样式 */
.agent-thoughts-section {
  margin: 20px 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  background-color: #f9fafc;
}

.agent-thoughts {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.thought-item {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 4px;
  border-left: 4px solid #dcdfe6;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.thought-thinking {
  background-color: #f0f9eb;
  border-left-color: #67c23a;
}

.thought-action {
  background-color: #ecf5ff;
  border-left-color: #409eff;
}

.thought-result {
  background-color: #f5f7fa;
  border-left-color: #909399;
}

.thought-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
  align-items: center;
}

.thought-type {
  font-weight: bold;
}

.thought-content {
  font-size: 14px;
  color: #303133;
  white-space: pre-wrap;
  line-height: 1.5;
}

/* 思考详情样式 */
.thought-details {
  margin-top: 10px;
  padding: 10px;
  background-color: #fafafa;
  border-radius: 4px;
  border-left: 2px solid #dcdfe6;
}

.details-content {
  font-size: 13px;
  color: #5a5a5a;
  white-space: pre-wrap;
  line-height: 1.6;
}

.results-section {
  margin-top: 30px;
}

.progress-indicators {
  margin: 20px 0 30px;
}

.results-tabs {
  margin-top: 30px;
}

.result-content {
  padding: 10px;
}

.requirement-questions {
  margin-top: 10px;
}

.requirement-questions ul {
  padding-left: 20px;
  margin: 0;
}

.final-summary {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border-left: 4px solid #409EFF;
}

.markdown-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin-top: 20px;
  margin-bottom: 10px;
}

.markdown-content :deep(p) {
  margin: 10px 0;
}

.markdown-content :deep(pre) {
  background-color: #f1f1f1;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content :deep(code) {
  font-family: 'Courier New', Courier, monospace;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 20px;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 8px;
  text-align: left;
  border: 1px solid #ddd;
}

.markdown-content :deep(th) {
  background-color: #f2f2f2;
}
</style>
