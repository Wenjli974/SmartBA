import { AnalysisTool } from './ToolRegistry';
import { generateUIUXAnalysis } from '@/services/openai';
import { ContextManager } from '../memory/ContextManager';

interface UIUXAnalysisParams {
  projectBackground: string;
  sessionId: string;
}

interface UIUXAnalysisResult {
  content: string;
}

// UI/UX分析工具实现
class UIUXAnalysisToolClass implements AnalysisTool {
  public name = 'uiuxAnalysis';
  public description = '分析项目背景，生成UI/UX设计建议和原型';

  // 执行UI/UX分析
  public async execute(params: UIUXAnalysisParams): Promise<UIUXAnalysisResult> {
    const { projectBackground, sessionId } = params;

    try {
      // 获取已有的业务分析和功能分析结果
      const businessResults = ContextManager.getAnalysisResults(sessionId, 'businessAnalysis');
      const functionalResults = ContextManager.getAnalysisResults(sessionId, 'functionalAnalysis');
      
      // 构建上下文信息
      let contextInfo = projectBackground;
      
      if (businessResults.length > 0) {
        const userStories = businessResults[0].result.userStories;
        contextInfo += `\n\n用户故事:\n${JSON.stringify(userStories, null, 2)}`;
      }
      
      if (functionalResults.length > 0) {
        const useCaseAnalysis = functionalResults[0].result.useCaseAnalysis;
        contextInfo += `\n\n用例分析:\n${JSON.stringify(useCaseAnalysis, null, 2)}`;
      }
      
      // 生成UI/UX分析
      const result = await generateUIUXAnalysis(contextInfo);
      
      // 返回结果
      return result;
    } catch (error) {
      console.error('UI/UX analysis failed:', error);
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
export const uiuxAnalysisTool = new UIUXAnalysisToolClass();
