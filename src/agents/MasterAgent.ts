import { v4 as uuidv4 } from 'uuid';
import { ContextManager } from './memory/ContextManager';
import { ToolRegistry, registerAllTools } from './tools/ToolRegistry';
import { initOpenAI, analyzeProjectWithTools, executeWithTools, Tool, checkRequirementDetails } from '@/services/openai';
import { generateUIUXAnalysis, generateUseCaseAnalysis, generateUserStories, generateTestCases } from '@/services/openai';

// 分析类型
export enum AnalysisType {
  BUSINESS_ANALYSIS = 'businessAnalysis',
  FUNCTIONAL_ANALYSIS = 'functionalAnalysis',
  UIUX_ANALYSIS = 'uiuxAnalysis'
}

// 分析进度状态
export enum AnalysisStatus {
  WAITING = 'waiting',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// 分析进度接口
export interface AnalysisProgress {
  status: AnalysisStatus;
  description: string;
  result?: any;
}

// 工具描述
export interface ToolDescription {
  name: string;
  description: string;
  executionFunction: (...args: any[]) => Promise<any>;
}

// Agent思考类型
export type ThoughtType = 'thinking' | 'planning' | 'action' | 'result' | 'evaluation';

// Agent思考接口
export interface AgentThought {
  type: ThoughtType;
  content: string;
  timestamp: number;
  details?: string;
}

// Agent行动接口
export interface AgentAction {
  toolType: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

// Agent规划接口
export interface AgentPlan {
  goal: string;
  actions: Array<{
    toolType: string;
    reasoning: string;
    priority: number;
    requiredBefore?: string[];
  }>;
}

// 回调函数接口
export interface AgentCallbacks {
  onProgress?: (progress: Map<string, AnalysisProgress>) => void;
  onComplete?: (results: any) => void;
  onError?: (error: Error) => void;
  onThought?: (thought: AgentThought) => void;
  onNeedMoreInfo?: (questions: string[]) => void;
}

// MasterAgent类
export class MasterAgent {
  private sessionId: string;
  private isInitialized: boolean = false;
  private progress: Map<string, AnalysisProgress> = new Map();
  private thoughts: AgentThought[] = [];
  private actions: AgentAction[] = [];
  private plan: AgentPlan | null = null;
  private callbacks: AgentCallbacks = {};
  private tools: Map<string, ToolDescription> = new Map();
  private context: Record<string, any> = {}; // 保存环境上下文和中间结果

  constructor() {
    this.sessionId = uuidv4();
  }

  // 初始化Agent
  public async initialize(apiKey?: string): Promise<void> {
    try {
      // 初始化OpenAI
      await initOpenAI(apiKey);
      
      // 注册所有工具
      registerAllTools();
      
      // 初始化上下文管理器
      ContextManager.loadFromLocalStorage();
      
      // 定义分析工具
      this.tools.set(AnalysisType.BUSINESS_ANALYSIS, {
        name: 'Business Analysis Tools',
        description: '用于分析项目的业务需求和用例场景，识别关键业务流程。',
        executionFunction: generateUseCaseAnalysis
      });
      
      this.tools.set(AnalysisType.FUNCTIONAL_ANALYSIS, {
        name: 'Function Analysis Tools',
        description: '用于拆解功能需求，生成用户故事和测试用例。',
        executionFunction: async (projectBackground: string) => {
          // 首先生成用户故事
          const userStories = await generateUserStories(projectBackground);
          
          // 针对每个用户故事生成测试用例
          let testCases = null;
          if (userStories && userStories.length > 0) {
            // 使用第一个用户故事来生成测试用例示例
            const story = userStories[0];
            testCases = await generateTestCases(story.userStory, story.ac);
          }
          
          return {
            userStories,
            testCases
          };
        }
      });
      
      this.tools.set(AnalysisType.UIUX_ANALYSIS, {
        name: 'UIUX Analysis Tools',
        description: '用于分析用户界面和交互设计需求，提供UI/UX设计建议。',
        executionFunction: generateUIUXAnalysis
      });
      
      // 初始化分析进度
      for (const type of Object.values(AnalysisType)) {
        this.progress.set(type, {
          status: AnalysisStatus.WAITING,
          description: `等待${this.tools.get(type)?.name}执行`
        });
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MasterAgent:', error);
      throw error;
    }
  }

  // 设置回调函数
  public setCallbacks(callbacks: AgentCallbacks): void {
    this.callbacks = callbacks;
  }

  // 重置进度
  private resetProgress(): void {
    // 初始化分析进度
    for (const type of Object.values(AnalysisType)) {
      if (typeof type === 'string') {
        this.progress.set(type, {
          status: AnalysisStatus.WAITING,
          description: `等待${this.tools.get(type)?.name}执行`
        });
      }
    }
    
    // 触发进度回调
    if (this.callbacks.onProgress) {
      this.callbacks.onProgress(new Map(this.progress));
    }
  }

  // 更新进度
  private updateProgress(type: AnalysisType, status: AnalysisStatus, description: string, result?: any): void {
    const progress: AnalysisProgress = {
      status,
      description,
      result
    };
    
    this.progress.set(type, progress);
    
    // 触发进度回调
    if (this.callbacks.onProgress) {
      this.callbacks.onProgress(new Map(this.progress));
    }
  }

  // 记录思考过程
  private addThought(type: ThoughtType, content: string, details?: string): void {
    const thought: AgentThought = {
      type,
      content,
      timestamp: Date.now(),
      details
    };
    
    this.thoughts.push(thought);
    
    // 触发思考回调
    if (this.callbacks.onThought) {
      this.callbacks.onThought(thought);
    }
  }

  // 需求评估：评估是否需要进行需求检查
  private async evaluateNeedForRequirementCheck(projectBackground: string): Promise<boolean> {
    try {
      this.addThought(
        'thinking',
        '评估是否需要进行需求检查',
        '分析当前需求描述的完整性、清晰度和一致性，判断是否需要向用户请求更多信息'
      );
      
      // 使用OpenAI接口判断是否需要进行需求检查
      const prompt = `
作为一个智能需求分析Agent，请评估以下项目背景描述的完整性、清晰度和一致性。
我需要判断是否有必要向用户请求更多信息来完善需求。

项目背景：
${projectBackground}

请仔细分析后，只回答"true"或"false"：
true = 需要向用户请求更多信息
false = 当前信息已足够进行分析
`;
      
      const response = await executeWithTools(
        prompt,
        [],
        {}
      );
      
      const needMoreInfo = response.finalResponse.toLowerCase().includes('true');
      
      this.addThought(
        'evaluation',
        needMoreInfo ? '需求信息不足，需要进行需求检查' : '需求信息充分，不需要额外检查',
        needMoreInfo ? '当前需求描述存在不明确或缺失的关键信息，需要向用户请求补充' : '当前需求描述已包含足够信息，可直接进行分析'
      );
      
      return needMoreInfo;
    } catch (error) {
      console.error('评估需求检查需求失败:', error);
      // 默认进行需求检查，以确保安全
      return true;
    }
  }

  // 规划工具使用
  private async createAnalysisPlan(projectBackground: string): Promise<AgentPlan> {
    try {
      this.addThought(
        'planning',
        '制定分析计划',
        '根据项目背景和需求分析，确定需要执行的分析工具和顺序'
      );
      
      // 收集所有可用工具的信息
      const availableTools = Array.from(this.tools.entries()).map(([type, tool]) => ({
        type,
        name: tool.name,
        description: tool.description
      }));
      
      // 使用OpenAI接口判断需要执行的工具
      const prompt = `
作为一个智能项目分析Agent，请根据以下项目背景描述，规划需要执行的分析工具。

项目背景：
${projectBackground}

可用的分析工具：
${availableTools.map(tool => `- ${tool.name} (${tool.type}): ${tool.description}`).join('\n')}

请分析项目背景，确定哪些分析工具是必要的，并为它们设置优先级。你需要提供一个JSON格式的执行计划，包含以下内容：
1. 总体目标
2. 需要执行的工具列表，每个工具包含：
   - 工具类型（使用上面列出的type标识符）
   - 使用该工具的理由
   - 优先级（1-10，10为最高）
   - 可选的依赖关系（在执行此工具前需要先执行哪些工具）

返回格式示例：
{
  "goal": "全面分析项目需求",
  "actions": [
    {
      "toolType": "businessAnalysis",
      "reasoning": "了解业务需求和用例场景",
      "priority": 10
    },
    {
      "toolType": "functionalAnalysis",
      "reasoning": "拆解功能需求，生成用户故事和测试用例",
      "priority": 8,
      "requiredBefore": ["businessAnalysis"]
    },
    {
      "toolType": "uiuxAnalysis",
      "reasoning": "分析用户界面和交互设计需求",
      "priority": 6,
      "requiredBefore": ["businessAnalysis"]
    }
  ]
}

重要提示:
1. 严格按照示例格式返回，键名必须完全一致
2. 只返回JSON格式的计划，不要有任何其他文字、解释或markdown标记
3. toolType必须使用上面列出的type标识符之一
4. 确保JSON格式有效且可解析
`;
      
      const response = await executeWithTools(
        prompt,
        [],
        {}
      );
      
      let plan: AgentPlan;
      try {
        // 预处理响应，尝试提取JSON部分
        const jsonText = this.extractJsonFromText(response.finalResponse);
        plan = JSON.parse(jsonText);
        
        // 验证计划格式
        if (!plan.goal || !Array.isArray(plan.actions)) {
          throw new Error('计划格式不正确，缺少必要字段');
        }
        
        // 确保actions非空
        if (plan.actions.length === 0) {
          throw new Error('计划不包含任何动作');
        }
        
        // 验证每个action的格式
        for (const action of plan.actions) {
          if (!action.toolType || !action.reasoning || !action.priority) {
            throw new Error('行动项缺少必要字段');
          }
          
          // 确保toolType有效
          if (!this.tools.has(action.toolType)) {
            throw new Error(`未知的工具类型: ${action.toolType}`);
          }
        }
      } catch (error) {
        console.error('解析规划JSON失败:', error);
        console.error('原始响应:', response.finalResponse);
        
        // 如果JSON解析失败，使用默认计划
        plan = {
          goal: '全面分析项目需求',
          actions: [
            {
              toolType: AnalysisType.BUSINESS_ANALYSIS,
              reasoning: '了解业务需求和用例场景',
              priority: 10
            },
            {
              toolType: AnalysisType.FUNCTIONAL_ANALYSIS,
              reasoning: '拆解功能需求，生成用户故事和测试用例',
              priority: 8,
              requiredBefore: [AnalysisType.BUSINESS_ANALYSIS]
            },
            {
              toolType: AnalysisType.UIUX_ANALYSIS,
              reasoning: '分析用户界面和交互设计需求',
              priority: 6,
              requiredBefore: [AnalysisType.BUSINESS_ANALYSIS]
            }
          ]
        };
      }
      
      // 对计划中的actions按优先级排序
      plan.actions.sort((a, b) => b.priority - a.priority);
      
      this.addThought(
        'planning',
        `已制定分析计划：${plan.goal}`,
        `计划包含以下工具执行：
${plan.actions.map((action, index) => 
  `${index+1}. ${this.tools.get(action.toolType)?.name || action.toolType} (优先级: ${action.priority})
   原因: ${action.reasoning}
   ${action.requiredBefore ? `依赖工具: ${action.requiredBefore.join(', ')}` : '无依赖工具'}`
).join('\n\n')}`
      );
      
      return plan;
    } catch (error) {
      console.error('创建分析计划失败:', error);
      
      // 如果创建计划失败，使用默认计划
      const defaultPlan: AgentPlan = {
        goal: '分析项目需求',
        actions: [
          {
            toolType: AnalysisType.BUSINESS_ANALYSIS,
            reasoning: '默认执行业务分析',
            priority: 10
          },
          {
            toolType: AnalysisType.FUNCTIONAL_ANALYSIS,
            reasoning: '默认执行功能分析',
            priority: 8
          },
          {
            toolType: AnalysisType.UIUX_ANALYSIS,
            reasoning: '默认执行UI/UX分析',
            priority: 6
          }
        ]
      };
      
      this.addThought(
        'planning',
        '创建自定义分析计划失败，使用默认计划',
        `错误信息: ${error instanceof Error ? error.message : String(error)}`
      );
      
      return defaultPlan;
    }
  }

  // 从文本中提取JSON
  private extractJsonFromText(text: string): string {
    try {
      // 尝试查找JSON开始和结束的位置
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}') + 1;
      
      if (jsonStartIndex === -1 || jsonEndIndex === 0 || jsonEndIndex <= jsonStartIndex) {
        // 没有找到有效的JSON标记
        throw new Error('无法在文本中找到JSON');
      }
      
      // 提取JSON部分
      const jsonText = text.substring(jsonStartIndex, jsonEndIndex);
      
      // 简单验证，确保是可能的JSON
      if (!jsonText.includes('"goal"') || !jsonText.includes('"actions"')) {
        throw new Error('提取的文本似乎不是预期的计划JSON');
      }
      
      return jsonText;
    } catch (error) {
      console.error('JSON提取失败:', error);
      throw error;
    }
  }

  // 执行单个工具
  private async executeAnalysisTool(
    toolType: string, 
    projectBackground: string, 
    dependencyResults?: Record<string, any>
  ): Promise<any> {
    const tool = this.tools.get(toolType);
    if (!tool) {
      throw new Error(`未找到工具: ${toolType}`);
    }
    
    // 记录行动
    const action: AgentAction = {
      toolType,
      input: projectBackground,
      status: 'pending'
    };
    this.actions.push(action);
    
    // 添加思考
    this.addThought(
      'action',
      `开始执行${tool.name}`,
      `使用${tool.name}分析项目背景，${dependencyResults ? '并利用之前的分析结果作为参考' : '这是首次分析'}`
    );
    
    // 更新进度
    this.updateProgress(toolType as AnalysisType, AnalysisStatus.RUNNING, `${tool.name}执行中...`);
    
    // 更新行动状态
    action.status = 'running';
    
    try {
      // 合并上下文
      let enhancedBackground = projectBackground;
      if (dependencyResults && Object.keys(dependencyResults).length > 0) {
        enhancedBackground += `\n\n之前的分析结果:\n${JSON.stringify(dependencyResults, null, 2)}`;
      }
      
      // 执行工具
      const result = await tool.executionFunction(enhancedBackground);
      
      // 更新进度
      this.updateProgress(
        toolType as AnalysisType,
        AnalysisStatus.COMPLETED,
        `${tool.name}分析完成`,
        result
      );
      
      // 更新行动
      action.output = result;
      action.status = 'completed';
      
      // 记录结果
      this.addThought(
        'result',
        `${tool.name}分析完成`,
        `分析结果: ${JSON.stringify(result, null, 2).substring(0, 500)}...`
      );
      
      return result;
    } catch (error) {
      // 更新进度
      this.updateProgress(
        toolType as AnalysisType,
        AnalysisStatus.ERROR,
        `${tool.name}分析失败: ${error instanceof Error ? error.message : String(error)}`
      );
      
      // 更新行动
      action.status = 'error';
      action.error = error instanceof Error ? error.message : String(error);
      
      // 记录错误
      this.addThought(
        'result',
        `${tool.name}分析失败`,
        error instanceof Error ? error.message : String(error)
      );
      
      throw error;
    }
  }

  // 评估执行结果并决定下一步行动
  private async evaluateResults(results: Record<string, any>, projectBackground: string): Promise<void> {
    this.addThought(
      'evaluation',
      '评估分析结果',
      '评估已完成的分析是否满足项目需求，是否需要进一步的分析'
    );
    
    try {
      // 收集已完成的分析工具信息
      const completedTools = Object.entries(results).map(([type, result]) => ({
        type,
        name: this.tools.get(type)?.name || type,
        hasResult: !!result
      }));
      
      // 获取未执行的工具
      const allToolTypes = Array.from(this.tools.keys());
      const completedToolTypes = completedTools.map(tool => tool.type);
      const pendingToolTypes = allToolTypes.filter(type => !completedToolTypes.includes(type));
      
      // 如果所有工具都已执行，或者没有未执行的工具，则无需评估
      if (pendingToolTypes.length === 0) {
        this.addThought(
          'evaluation',
          '所有计划的分析工具已执行完毕',
          '已完成全部必要分析，无需进一步分析'
        );
        return;
      }
      
      // 使用OpenAI接口评估是否需要执行更多工具
      const prompt = `
作为一个智能项目分析Agent，请评估已完成的分析结果，并判断是否需要执行更多分析工具。

项目背景：
${projectBackground}

已执行的分析工具：
${completedTools.map(tool => `- ${tool.name} (${tool.type}): ${tool.hasResult ? '执行成功' : '执行失败'}`).join('\n')}

未执行的分析工具：
${pendingToolTypes.map(type => `- ${this.tools.get(type)?.name || type} (${type}): ${this.tools.get(type)?.description || ''}`).join('\n')}

请判断是否需要执行未执行的工具，并给出理由。返回一个JSON对象，包含以下内容：
{
  "needMoreAnalysis": true/false,
  "toolsToExecute": [
    {
      "type": "工具类型",
      "reason": "执行该工具的原因"
    }
  ]
}

只返回JSON格式的结果，不要有其他文字。
`;
      
      const response = await executeWithTools(
        prompt,
        [],
        {}
      );
      
      let evaluation;
      try {
        evaluation = JSON.parse(response.finalResponse);
      } catch (error) {
        console.error('解析评估JSON失败:', error);
        // 默认不执行其他工具
        evaluation = {
          needMoreAnalysis: false,
          toolsToExecute: []
        };
      }
      
      if (evaluation.needMoreAnalysis && evaluation.toolsToExecute && evaluation.toolsToExecute.length > 0) {
        // 记录评估结果
        this.addThought(
          'evaluation',
          '需要进行额外的分析',
          `评估认为需要执行以下额外工具：
${evaluation.toolsToExecute.map((tool: any, index: number) => 
  `${index+1}. ${this.tools.get(tool.type)?.name || tool.type}
   原因: ${tool.reason}`
).join('\n\n')}`
        );
        
        // 添加额外的工具到计划中
        if (this.plan) {
          const existingToolTypes = this.plan.actions.map(action => action.toolType);
          
          for (const tool of evaluation.toolsToExecute) {
            if (!existingToolTypes.includes(tool.type)) {
              this.plan.actions.push({
                toolType: tool.type,
                reasoning: tool.reason,
                priority: 5  // 较低的优先级
              });
            }
          }
        }
      } else {
        this.addThought(
          'evaluation',
          '当前分析已足够，无需额外分析',
          '评估认为已完成的分析已能满足项目需求，无需执行更多工具'
        );
      }
    } catch (error) {
      console.error('评估分析结果失败:', error);
      this.addThought(
        'evaluation',
        '评估分析结果时出错',
        `错误信息: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // 分析项目背景 - 主入口方法
  public async analyzeProjectBackground(projectBackground: string, additionalInfo?: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 重置状态
      this.resetProgress();
      this.thoughts = [];
      this.actions = [];
      this.plan = null;
      this.context = {
        projectBackground,
        additionalInfo
      };

      // 构建完整的项目背景
      let fullBackground = projectBackground;
      if (additionalInfo) {
        fullBackground += `\n\n补充信息:\n${additionalInfo}`;
        this.addThought(
          'thinking',
          '收到补充信息，开始分析',
          `分析以下项目背景：\n${fullBackground}`
        );
      } else {
        this.addThought(
          'thinking',
          '开始分析项目背景',
          `分析以下项目背景：\n${fullBackground}`
        );
        
        // 评估是否需要进行需求检查
        const needRequirementCheck = await this.evaluateNeedForRequirementCheck(projectBackground);
        
        if (needRequirementCheck) {
          this.addThought('action', '开始执行需求检查', '检查项目背景是否需要补充更多信息');
          
          // 调用checkRequirementDetails检查是否需要更多信息
          const questions = await checkRequirementDetails(projectBackground);
          
          if (questions && questions.length > 0) {
            this.addThought(
              'result', 
              '需要更多信息来完善需求分析',
              `已生成以下问题需要用户补充：\n${questions.map((q, i) => `${i+1}. ${q}`).join('\n')}`
            );
            
            // 通知UI需要更多信息
            if (this.callbacks.onNeedMoreInfo) {
              this.callbacks.onNeedMoreInfo(questions);
            }
            
            return;
          } else {
            this.addThought('result', '需求检查完成，当前信息已足够', '无需额外信息，可以继续分析');
          }
        } else {
          this.addThought('thinking', '跳过需求检查，当前信息已足够', '直接进行分析');
        }
      }
      
      // 创建分析计划
      this.plan = await this.createAnalysisPlan(fullBackground);
      
      // 执行分析计划
      const results: Record<string, any> = {};
      const completedTools: string[] = [];
      
      // 按优先级顺序执行工具
      for (const action of this.plan.actions) {
        // 检查依赖关系
        if (action.requiredBefore && action.requiredBefore.length > 0) {
          const missingDependencies = action.requiredBefore.filter(dep => !completedTools.includes(dep));
          
          if (missingDependencies.length > 0) {
            this.addThought(
              'thinking',
              `跳过${this.tools.get(action.toolType)?.name || action.toolType}`,
              `依赖工具尚未完成: ${missingDependencies.join(', ')}`
            );
            continue;
          }
        }
        
        try {
          // 收集依赖结果
          const dependencyResults: Record<string, any> = {};
          if (action.requiredBefore) {
            for (const dep of action.requiredBefore) {
              if (results[dep]) {
                dependencyResults[dep] = results[dep];
              }
            }
          }
          
          // 执行工具
          const result = await this.executeAnalysisTool(action.toolType, fullBackground, dependencyResults);
          
          // 保存结果
          results[action.toolType] = result;
          completedTools.push(action.toolType);
          
          // 评估当前结果并可能调整计划
          await this.evaluateResults(results, fullBackground);
        } catch (error) {
          console.error(`执行工具 ${action.toolType} 失败:`, error);
          // 继续执行下一个工具
        }
      }
      
      // 添加最终总结思考
      const completedCount = completedTools.length;
      const totalCount = this.plan.actions.length;
      
      this.addThought(
        'evaluation',
        '分析完成',
        `计划执行完成度: ${completedCount}/${totalCount} 工具
成功执行的工具: ${completedTools.map(type => this.tools.get(type)?.name || type).join(', ')}
${completedCount < totalCount ? `未执行的工具: ${this.plan.actions
  .filter(action => !completedTools.includes(action.toolType))
  .map(action => this.tools.get(action.toolType)?.name || action.toolType)
  .join(', ')}` : '所有计划工具均已成功执行'}`
      );
      
      // 构建结果对象
      const finalResults: Record<string, any> = {};
      this.progress.forEach((progressItem, type) => {
        if (progressItem.result) {
          finalResults[type] = progressItem.result;
        }
      });
      
      // 执行完成回调
      if (this.callbacks.onComplete) {
        this.callbacks.onComplete(finalResults);
      }
      
      return finalResults;
    } catch (error: any) {
      console.error('Failed to analyze project background:', error);
      
      this.addThought(
        'thinking', 
        `分析过程中发生错误: ${error.message}`,
        `在执行分析过程中遇到了以下错误：

错误信息：${error.message}
错误类型：${error.name}
错误堆栈：${error.stack || '无堆栈信息'}

可能的原因：
1. API调用失败（如API密钥问题、网络连接问题）
2. 工具执行时出现异常
3. 参数格式不正确

我将终止当前的分析流程，并向用户报告这个错误。用户可能需要检查API设置或修改输入内容后重试。`
      );
      
      // 触发错误回调
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      
      throw error;
    }
  }

  // 获取所有分析结果
  public getResults(): any {
    const context = ContextManager.getContext(this.sessionId);
    if (!context) {
      return null;
    }
    
    const results: Record<string, any> = {};
    context.analysisResults.forEach(result => {
      results[result.type] = result.result;
    });
    
    return results;
  }

  // 获取分析进度
  public getProgress(): Map<string, AnalysisProgress> {
    return new Map(this.progress);
  }

  // 获取Agent思考记录
  public getThoughts(): AgentThought[] {
    return [...this.thoughts];
  }

  // 获取Agent行动记录
  public getActions(): AgentAction[] {
    return [...this.actions];
  }

  // 获取Agent当前计划
  public getPlan(): AgentPlan | null {
    return this.plan;
  }

  // 获取会话ID
  public getSessionId(): string {
    return this.sessionId;
  }
}

// 导出单例实例
export const masterAgent = new MasterAgent();
