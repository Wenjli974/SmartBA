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

  const prompt = `你是一个经验丰富的商业分析师。请根据以下项目背景生成Epic、User Story和Acceptance Criteria。

项目背景：
${projectBackground}

请严格按照以下JSON格式返回3-5个用户故事：
[
  {
    "id": "1",
    "epic": "用户认证系统",
    "userStory": "作为普通用户，我想要能够使用邮箱和密码登录系统",
    "ac": "1. 用户可以在登录页面输入邮箱和密码\\n2. 系统验证邮箱格式是否正确\\n3. 登录成功后跳转到首页\\n4. 登录失败时显示具体错误信息"
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
      model: 'gpt-3.5-turbo',
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
      model: 'gpt-3.5-turbo',
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