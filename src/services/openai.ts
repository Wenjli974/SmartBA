import OpenAI from 'openai'

let openai: OpenAI | null = null

// 获取默认的API Key
const getDefaultApiKey = () => {
  return import.meta.env.VITE_OPENAI_API_KEY || ''
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
  if (!openai) throw new Error('OpenAI not initialized')

  const prompt = 
`你是一个经验丰富的商业分析师。请根据以下项目背景生成Epic、User Story和Acceptance Criteria。


你是一个资深的商业分析师，你擅长撰写user story, 针对提出的一个业务场景，你可以定义出所有相关的user story，并从
Happy Path, Negative Path 和Exceptional Path 的角度完善出对应的Acceptance criteria
下面***识别符之内的内容为一个完整示例，后面回答问题请参考这个示例的逻辑和格式：
    
项目背景：
${projectBackground}
 
请针对这个项目按照示例和你的专业知识，拆分一下该项目中会出现的user story （按照作为<role>, 我能够完成<Task>的格式）
完善出该user story对应描述（需求，功能，业务流程），给出该story的Acceptance criteria(AC, 按照: Given-When-Then的结构)
并预估该story的开发人天

返回示例：
[
  {
    "id": "1",
    "epic": "用户认证系统",
    "userStory": "作为普通用户，我想要能够使用邮箱和密码登录系统",
    "ac": "登录功能，构建一个完整的用户认证系统，提供用户注册、登录、密码找回等基本功能，确保系统对不同用户角色（如普通用户、管理员等）的认证需求得到满足。该系统应支持不同的身份验证方式，如邮箱登录、手机号登录等。\\nstory预估开发人天为2\\n1. 用户可以在登录页面输入邮箱和密码\\n2. 系统验证邮箱格式是否正确\\n3. 登录成功后跳转到首页\\n4. 登录失败时显示具体错误信息"
  }
]

返回格式：请严格按照以下JSON格式返回10个用户故事：
[
  {
    "id": "<id>",
    "epic": "<epic>",
    "userStory": "<Story>",
    "ac": "<Description>\\n<Effort>\\n<Acceptance Criteria>"
  }
]

注意事项：
1. 必须是合法的JSON格式
2. 必须是一个数组
3. 每个对象必须包含epic、userStory和ac三个字段
4. ac字段中的换行使用\\n
5. 不要添加任何额外的解释文字，只返回JSON数组

请确保生成的内容严格遵循以上格式要求。`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
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

export const generateRequirementsDoc = async (stories: any[]) => {
  if (!openai) throw new Error('OpenAI not initialized')

  const prompt = `
作为一个经验丰富的商业分析师，请根据以下User Stories生成一个完整的项目需求文档。

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
      model: 'gpt-4o',
      messages: [
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
  if (!openai) throw new Error('OpenAI not initialized')

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
      model: 'gpt-4o',
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
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('[') && !line.endsWith(']'))
        
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