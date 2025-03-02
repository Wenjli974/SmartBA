import OpenAI from 'openai'
import axios from 'axios'

let openai: OpenAI | null = null

// 获取默认的API Key
const getDefaultApiKey = () => {
  const storedKey = localStorage.getItem('openai_api_key')
  return storedKey || import.meta.env.VITE_OPENAI_API_KEY || ''
}

export const initOpenAI = (apiKey?: string) => {
  const key = apiKey || getDefaultApiKey()
  if (!key) {
    throw new Error('未设置OpenAI API Key')
  }
  
  openai = new OpenAI({
    apiKey: key,
    dangerouslyAllowBrowser: true
  })
}

export const generateUserStories = async (projectBackground: string) => {
  if (!openai) {
    // 如果openai实例不存在，尝试初始化
    try {
      initOpenAI()
    } catch (error) {
      throw new Error('请先设置OpenAI API Key')
    }
  }

  if (!openai) throw new Error('OpenAI初始化失败')

  const prompt = `你是一个经验丰富的商业分析师。请根据以下项目背景生成Epic、User Story和Acceptance Criteria。

你是一个资深的商业分析师，你擅长撰写user story, 针对提出的一个业务场景，你可以定义出所有相关的user story，并从
Happy Path, Negative Path 和Exceptional Path 的角度完善出对应的Acceptance criteria

项目背景：
${projectBackground}
 
请针对这个项目按照示例和你的专业知识，拆分一下该项目中会出现的user story （按照作为<role>, 我能够完成<Task>的格式）
完善出该user story对应描述（需求，功能，业务流程），给出该story的Acceptance criteria(AC, 按照: Given-When-Then的结构)
并预估该story的开发人天

返回格式：请严格按照以下JSON格式返回10个用户故事：
[
  {
    "id": "<id>",
    "epic": "<epic>",
    "userStory": "<Story>",
    "ac": "<Description><Effort><Acceptance Criteria>"
  }
]

注意事项：
1. 必须是合法的JSON格式
2. 必须是一个数组
3. 每个对象必须包含epic、userStory和ac三个字段
4. ac字段中的换行使用\\n
5. 不要添加任何额外的解释文字，只返回JSON数组`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // gpt-4o 是gpt-4的升级版 模型名称不用修正
      messages: [
        {
          role: 'system',
          content: '你是一个精通JSON格式的商业分析师，你的回答必须是严格的JSON格式，不包含任何其他文字。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No content generated')

    // 清理可能的多余内容
    const jsonContent = content.trim().replace(/```json\n?|\n?```/g, '').trim()

    try {
      const parsedContent = JSON.parse(jsonContent)
      
      // 验证返回的数据格式
      if (!Array.isArray(parsedContent)) {
        console.error('返回内容不是数组:', jsonContent)
        throw new Error('Response is not an array')
      }

      // 验证每个项目的格式
      const validItems = parsedContent.every(item => {
        const hasRequiredFields = item.epic && item.userStory && item.ac
        const fieldsAreStrings = 
          typeof item.epic === 'string' && 
          typeof item.userStory === 'string' && 
          typeof item.ac === 'string'
        return hasRequiredFields && fieldsAreStrings
      })

      if (!validItems) {
        console.error('返回内容格式不正确:', jsonContent)
        throw new Error('Response items format is invalid')
      }

      return parsedContent
    } catch (parseError) {
      console.error('API返回的原始内容:', content)
      console.error('清理后的内容:', jsonContent)
      console.error('解析错误:', parseError)
      throw new Error('API返回的格式不正确，请重试')
    }
  } catch (apiError: any) {
    console.error('API调用错误:', apiError)
    if (apiError.status === 401) {
      throw new Error('API Key无效或已过期，请检查您的API Key')
    } else if (apiError.status === 429) {
      throw new Error('API调用次数超限，请稍后重试')
    } else {
      throw new Error(`API调用失败: ${apiError.message || '未知错误'}`)
    }
  }
}

export const generateRequirementsDoc = async (projectBackground: string, stories: any[]) => {
  if (!openai) {
    // 如果openai实例不存在，尝试初始化
    try {
      initOpenAI()
    } catch (error) {
      throw new Error('请先设置OpenAI API Key')
    }
  }

  if (!openai) throw new Error('OpenAI初始化失败')

  const prompt = `
作为一个经验丰富的商业分析师，请根据以下User Stories生成一个完整的项目需求文档。

项目背景：
${projectBackground}

User Stories:
${JSON.stringify(stories, null, 2)}

请生成一个包含以下部分的Markdown格式文档：
1. 项目概述
2. 功能需求（基于提供的User Stories）
3. 非功能需求
4. 技术架构
5. 时间规划

请确保文档结构清晰，内容专业完整。
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // gpt-4o 是gpt-4的升级版 模型名称不用修正
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No content generated')

    return content
  } catch (apiError: any) {
    console.error('API调用错误:', apiError)
    if (apiError.status === 401) {
      throw new Error('API Key无效或已过期，请检查您的API Key')
    } else if (apiError.status === 429) {
      throw new Error('API调用次数超限，请稍后重试')
    } else {
      throw new Error(`API调用失败: ${apiError.message || '未知错误'}`)
    }
  }
}

export const checkRequirementDetails = async (projectBackground: string) => {
  if (!openai) {
    // 如果openai实例不存在，尝试初始化
    try {
      initOpenAI()
    } catch (error) {
      throw new Error('请先设置OpenAI API Key')
    }
  }

  if (!openai) throw new Error('OpenAI初始化失败')

  const prompt = `
作为一个经验丰富的商业分析师，请审查以下项目背景描述，并指出需要进一步澄清或补充的问题。
你觉得你还需要什么信息能够帮助你后续撰写可以供开发进行开发的story和AC
请你尽可能的询问项目背景中没有提及的细节部分

项目背景：
${projectBackground}

请列出需要补充或澄清的问题，每个问题都应该具体且有针对性。
返回格式要求：
1. 返回一个字符串数组
2. 每个问题独占一个数组项
3. 问题描述要简洁明了
4. 不要包含任何额外的解释或标题
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // gpt-4o 是gpt-4的升级版 模型名称不用修正
      messages: [
        {
          role: 'system',
          content: '你是一个专业的需求分析师，擅长发现需求中的问题和遗漏点。请直接返回问题列表，不要添加任何其他内容。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No content generated')

    try {
      // 将返回的内容按行分割，并过滤掉空行
      const questions = content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line && !line.startsWith('[') && !line.endsWith(']'))
        
      return questions
    } catch (parseError) {
      console.error('API返回的原始内容:', content)
      console.error('解析错误:', parseError)
      throw new Error('API返回的格式不正确，请重试')
    }
  } catch (apiError: any) {
    console.error('API调用错误:', apiError)
    if (apiError.status === 401) {
      throw new Error('API Key无效或已过期，请检查您的API Key')
    } else if (apiError.status === 429) {
      throw new Error('API调用次数超限，请稍后重试')
    } else {
      throw new Error(`API调用失败: ${apiError.message || '未知错误'}`)
    }
  }
}

export const generateUseCaseAnalysis = async (projectBackground: string) => {
  if (!openai) {
    // 如果openai实例不存在，尝试初始化
    try {
      initOpenAI()
    } catch (error) {
      throw new Error('请先设置OpenAI API Key')
    }
  }

  if (!openai) throw new Error('OpenAI初始化失败')

  const prompt = `
作为一个专业的业务分析师，请根据以下项目背景展开分析，并生成一个完整详细的用例分析文档。

项目背景：
${projectBackground}

请生成一个包含以下部分的结构化文档（JSON格式）：
{
  "projectName": "项目名称",
  "projectGoal": "项目目标",
  "projectBackground": "项目背景",
  "projectScope": "项目范围",
  "roles": "角色定义",
  "businessProcess": {
    "text": "业务流程描述",
    "mermaid": "流程图（使用Mermaid语法）"
  },
  "businessRules": "业务规则",
  "performanceRequirements": "性能要求",
  "dataRequirements": "数据要求"
}

注意事项：
1. 返回必须是合法的JSON格式
2. businessProcess.mermaid 字段必须是有效的Mermaid流程图语法
3. 所有文本字段中的换行使用\\n
4. 不要添加任何额外的解释文字，只返回JSON对象`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // gpt-4o 是gpt-4的升级版 模型名称不用修正
      messages: [
        {
          role: 'system',
          content: '你是一个专业的业务分析师，擅长生成结构化的业务分析文档。请确保返回的是合法的JSON格式。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No content generated')

    try {
      // 清理可能的多余内容
      const jsonContent = content.trim().replace(/```json\n?|\n?```/g, '').trim()
      const parsedContent = JSON.parse(jsonContent)

      // 验证返回的数据格式
      const requiredFields = [
        'projectName',
        'projectGoal',
        'projectBackground',
        'projectScope',
        'roles',
        'businessProcess',
        'businessRules',
        'performanceRequirements',
        'dataRequirements'
      ]

      const missingFields = requiredFields.filter(field => !(field in parsedContent))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // 验证 businessProcess 结构
      if (typeof parsedContent.businessProcess !== 'object' ||
          !('text' in parsedContent.businessProcess) ||
          !('mermaid' in parsedContent.businessProcess)) {
        throw new Error('Invalid businessProcess structure')
      }

      return parsedContent
    } catch (parseError) {
      console.error('API返回的原始内容:', content)
      console.error('解析错误:', parseError)
      throw new Error('API返回的格式不正确，请重试')
    }
  } catch (apiError: any) {
    console.error('API调用错误:', apiError)
    if (apiError.status === 401) {
      throw new Error('API Key无效或已过期，请检查您的API Key')
    } else if (apiError.status === 429) {
      throw new Error('API调用次数超限，请稍后重试')
    } else {
      throw new Error(`API调用失败: ${apiError.message || '未知错误'}`)
    }
  }
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

interface UIUXAnalysisResult {
  content: string  // Markdown 格式的内容
}

export async function generateUIUXAnalysis(projectBackground: string): Promise<UIUXAnalysisResult> {
  const prompt = `作为一名专业的UI/UX设计专家，请基于以下项目背景进行详细的界面和用户体验分析。请使用Markdown格式返回分析报告：

项目背景：
${projectBackground}

请按照以下Markdown格式返回分析结果：

# UI/UX 设计分析报告

## 1. 界面原型建议

### 1.1 页面布局和结构
[详细描述页面的整体布局结构]

### 1.2 颜色方案和主题
[详细的配色方案建议，包括主色调、辅助色等]

### 1.3 关键组件设计
[描述主要界面组件的设计建议]

### 1.4 响应式设计考虑
[不同设备和屏幕尺寸的适配建议]

### 1.5 字体和图标选择
[字体系统和图标设计建议]

## 2. 用户体验分析

### 2.1 用户旅程地图
[详细的用户旅程分析]

### 2.2 关键交互点
[重要交互节点的设计建议]

### 2.3 可用性考虑
[可用性设计建议和最佳实践]

### 2.4 无障碍设计
[无障碍设计的具体建议]

### 2.5 性能优化
[性能优化的建议和措施]

## 3. 交互流程设计

### 3.1 用户操作流程
[主要用户操作流程的详细描述]

### 3.2 状态转换
[界面状态转换的设计]

### 3.3 反馈机制
[用户操作反馈的设计建议]

### 3.4 错误处理
[错误状态的处理方案]

### 3.5 帮助和提示
[帮助系统和提示信息的设计]

## 4. 原型图

\`\`\`
[使用ASCII艺术创建关键页面的线框图]
\`\`\`

注意事项：
1. 所有内容应该详细且专业
2. 使用Markdown语法确保格式清晰
3. 确保建议足够具体，可以直接提供给UI设计师制作高保真原型`

  try {
    const response = await axios.post(
      API_ENDPOINT,
      {
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: '你是一名专业的UI/UX设计专家，请提供详细的分析报告，使用Markdown格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const content = response.data.choices[0].message.content
    return { content }
  } catch (error) {
    console.error('OpenAI API 调用失败:', error)
    throw new Error('生成分析失败，请重试')
  }
}

export const generateTestCases = async (userStory: string, ac: string) => {
  if (!openai) {
    // 如果openai实例不存在，尝试初始化
    try {
      initOpenAI()
    } catch (error) {
      throw new Error('请先设置OpenAI API Key')
    }
  }

  if (!openai) throw new Error('OpenAI初始化失败')

  const prompt = `作为一个专业的测试工程师，请根据以下用户故事和验收标准生成详细的测试用例。

用户故事：
${userStory}

验收标准：
${ac}

请生成测试用例，包括以下方面：
1. 正向测试场景（Happy Path）
2. 负向测试场景（Negative Path）
3. 边界条件测试
4. 异常场景测试

每个测试用例应包含：
- 测试场景描述
- 前置条件
- 测试步骤
- 预期结果

请使用以下格式：
场景1：[场景描述]
前置条件：
- [条件1]
- [条件2]
测试步骤：
1. [步骤1]
2. [步骤2]
预期结果：
- [结果1]
- [结果2]

注意：
1. 测试用例要具体且可执行
2. 覆盖所有关键功能点
3. 包含数据验证
4. 考虑异常处理
5. 回复中不要包含任何额外的解释文字，只返回测试用例`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // gpt-4o 是gpt-4的升级版 模型名称不用修正
      messages: [
        {
          role: 'system',
          content: '你是一个专业的测试工程师，擅长编写全面且详细的测试用例。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    const content = response.choices[0].message.content
    if (!content) throw new Error('No content generated')

    return content
  } catch (apiError: any) {
    console.error('API调用错误:', apiError)
    if (apiError.status === 401) {
      throw new Error('API Key无效或已过期，请检查您的API Key')
    } else if (apiError.status === 429) {
      throw new Error('API调用次数超限，请稍后重试')
    } else {
      throw new Error(`API调用失败: ${apiError.message || '未知错误'}`)
    }
  }
} 