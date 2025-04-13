// 分析结果接口
export interface AnalysisResult {
  type: string;
  result: any;
  timestamp?: number;
}

// 项目上下文接口
export interface ProjectContext {
  sessionId: string;
  projectBackground: string;
  analysisResults: AnalysisResult[];
  createdAt: number;
  updatedAt: number;
}

// 上下文管理器类
class ContextManagerClass {
  private contexts: Map<string, ProjectContext> = new Map();
  
  // 创建新的项目上下文
  public createContext(sessionId: string, projectBackground: string): ProjectContext {
    const now = Date.now();
    const newContext: ProjectContext = {
      sessionId,
      projectBackground,
      analysisResults: [],
      createdAt: now,
      updatedAt: now
    };
    
    this.contexts.set(sessionId, newContext);
    this.saveToLocalStorage();
    
    return newContext;
  }
  
  // 获取项目上下文
  public getContext(sessionId: string): ProjectContext | undefined {
    return this.contexts.get(sessionId);
  }
  
  // 添加分析结果
  public addAnalysisResult(sessionId: string, result: AnalysisResult): void {
    const context = this.getContext(sessionId);
    if (!context) {
      throw new Error(`Context with session ID ${sessionId} not found`);
    }
    
    result.timestamp = Date.now();
    context.analysisResults.push(result);
    context.updatedAt = Date.now();
    
    this.contexts.set(sessionId, context);
    this.saveToLocalStorage();
  }
  
  // 获取分析结果
  public getAnalysisResults(sessionId: string, type?: string): AnalysisResult[] {
    const context = this.getContext(sessionId);
    if (!context) {
      return [];
    }
    
    if (type) {
      return context.analysisResults.filter(result => result.type === type);
    }
    
    return context.analysisResults;
  }
  
  // 从本地存储加载上下文
  public loadFromLocalStorage(): void {
    try {
      const storedContexts = localStorage.getItem('smartba-project-contexts');
      if (storedContexts) {
        const parsed = JSON.parse(storedContexts);
        this.contexts = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load contexts from localStorage:', error);
    }
  }
  
  // 保存上下文到本地存储
  private saveToLocalStorage(): void {
    try {
      const contextObject = Object.fromEntries(this.contexts);
      localStorage.setItem('smartba-project-contexts', JSON.stringify(contextObject));
    } catch (error) {
      console.error('Failed to save contexts to localStorage:', error);
    }
  }
  
  // 生成上下文摘要用于AI调用
  public getContextSummary(sessionId: string): string {
    const context = this.getContext(sessionId);
    if (!context) {
      return '';
    }
    
    const summary = [
      `项目背景: ${context.projectBackground}`,
      '已完成的分析:',
      ...context.analysisResults.map(result => 
        `- ${result.type}: ${typeof result.result === 'string' 
          ? result.result.substring(0, 100) + '...' 
          : JSON.stringify(result.result).substring(0, 100) + '...'}`
      )
    ].join('\n');
    
    return summary;
  }
}

// 导出单例实例
export const ContextManager = new ContextManagerClass();

// 初始化
export const initContextManager = () => {
  ContextManager.loadFromLocalStorage();
};
