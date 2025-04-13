import { AnalysisTool } from './ToolRegistry';
import { generateUseCaseAnalysis, generateRequirementsDoc } from '@/services/openai';
import { ContextManager } from '../memory/ContextManager';

interface FunctionalAnalysisParams {
  projectBackground: string;
  sessionId: string;
}

interface FunctionalAnalysisResult {
  useCaseAnalysis: any;
  requirementsDoc: string;
}

// 功能分析工具实现
class FunctionalAnalysisToolClass implements AnalysisTool {
  public name = 'functionalAnalysis';
  public description = '分析项目背景，生成用例分析和需求文档';

  // 执行功能分析
  public async execute(params: FunctionalAnalysisParams): Promise<FunctionalAnalysisResult> {
    const { projectBackground, sessionId } = params;

    try {
      // 获取已有的业务分析结果
      const businessResults = ContextManager.getAnalysisResults(sessionId, 'businessAnalysis');
      const userStories = businessResults.length > 0 ? businessResults[0].result.userStories : [];
      
      // 生成用例分析
      const useCaseAnalysis = await generateUseCaseAnalysis(projectBackground);
      
      // 生成需求文档
      const requirementsDoc = await generateRequirementsDoc(projectBackground, userStories);
      
      // 返回结果
      return {
        useCaseAnalysis,
        requirementsDoc
      };
    } catch (error) {
      console.error('Functional analysis failed:', error);
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
export const functionalAnalysisTool = new FunctionalAnalysisToolClass();
