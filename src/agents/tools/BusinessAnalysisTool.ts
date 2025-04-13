import { AnalysisTool } from './ToolRegistry';
import { generateUserStories, checkRequirementDetails } from '@/services/openai';
import { ContextManager } from '../memory/ContextManager';

interface BusinessAnalysisParams {
  projectBackground: string;
  sessionId: string;
}

interface BusinessAnalysisResult {
  userStories: any[];
  requirementQuestions: string[];
}

// 业务分析工具实现
class BusinessAnalysisToolClass implements AnalysisTool {
  public name = 'businessAnalysis';
  public description = '分析项目背景，生成用户故事和需求细节问题';

  // 执行业务分析
  public async execute(params: BusinessAnalysisParams): Promise<BusinessAnalysisResult> {
    const { projectBackground, sessionId } = params;

    try {
      // 生成用户故事
      const userStories = await generateUserStories(projectBackground);
      
      // 检查需求细节
      const requirementQuestions = await checkRequirementDetails(projectBackground);
      
      // 返回结果
      return {
        userStories,
        requirementQuestions
      };
    } catch (error) {
      console.error('Business analysis failed:', error);
      throw error;
    }
  }

  // 获取OpenAI函数描述
  public getOpenAIFunctionDescription(): any {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        type: 'object',
        properties: {
          projectBackground: {
            type: 'string',
            description: '项目背景描述'
          },
          sessionId: {
            type: 'string',
            description: '会话ID'
          }
        },
        required: ['projectBackground', 'sessionId']
      }
    };
  }
}

// 导出单例实例
export const businessAnalysisTool = new BusinessAnalysisToolClass();
