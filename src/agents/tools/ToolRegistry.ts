import { businessAnalysisTool } from './BusinessAnalysisTool';
import { functionalAnalysisTool } from './FunctionalAnalysisTool';
import { uiuxAnalysisTool } from './UIUXAnalysisTool';

// 工具接口定义
export interface AnalysisTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
  getOpenAIFunctionDescription: () => any;
}

// 工具注册表类
class ToolRegistryClass {
  private tools: Map<string, AnalysisTool> = new Map();

  // 注册工具
  public register(tool: AnalysisTool): void {
    this.tools.set(tool.name, tool);
  }

  // 获取工具
  public getTool(name: string): AnalysisTool | undefined {
    return this.tools.get(name);
  }

  // 获取所有工具
  public getAllTools(): AnalysisTool[] {
    return Array.from(this.tools.values());
  }

  // 获取所有工具的OpenAI函数描述
  public getOpenAIFunctionDescriptions(): any[] {
    return this.getAllTools().map(tool => tool.getOpenAIFunctionDescription());
  }

  // 执行工具
  public async executeTool(name: string, params: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.execute(params);
  }
}

// 单例实例
export const ToolRegistry = new ToolRegistryClass();

// 注册所有工具
export const registerAllTools = () => {
  ToolRegistry.register(businessAnalysisTool);
  ToolRegistry.register(functionalAnalysisTool);
  ToolRegistry.register(uiuxAnalysisTool);
};
