const getDefaultApiKey = () => {
    //const storedKey = localStorage.getItem('openai_api_key')
    const storedKey = import.meta.env.VITE_DEEPSEEK_API_KEY
    return storedKey || import.meta.env.VITE_DEEPSEEK_API_KEY || ''
  }

//打印默认的API Key
console.log(getDefaultApiKey())
