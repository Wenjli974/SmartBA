# SmartBA - 智能商业分析助手

SmartBA 是一个基于 OpenAI API 的智能商业分析工具，能够帮助产品经理和业务分析师快速生成高质量的用户故事（User Story）和项目需求文档。

## 🌟 主要功能

### 1. 用户故事生成
- 🤖 基于项目背景自动生成 Epic、User Story 和验收标准
- 📝 支持在线编辑和实时保存
- 📊 表格化展示，方便管理和查看
- 💾 支持导出为 JSON 格式

### 2. 需求文档生成
- 📄 基于用户故事自动生成完整的项目需求文档
- 🎯 包含项目概述、功能需求、非功能需求等完整章节
- 📥 支持导出为 Markdown 格式

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- npm >= 7

### 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd SmartBA/frontend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
```
编辑 `.env` 文件，设置您的 OpenAI API Key：
```
VITE_OPENAI_API_KEY=your-api-key-here
```

4. 启动开发服务器
```bash
npm run dev
```

## 💡 使用说明

1. 生成用户故事
   - 在输入框中输入项目背景描述
   - 点击"AI生成"按钮
   - 在表格中查看和编辑生成的内容

2. 生成需求文档
   - 确保已有用户故事数据
   - 点击"生成需求文档"按钮
   - 在新页面中查看生成的文档
   - 可以导出为 Markdown 格式

## 🛠️ 技术栈

- 前端框架：Vue 3
- UI 组件库：Element Plus
- 构建工具：Vite
- AI 集成：OpenAI API
- 状态管理：Vue Refs + LocalStorage
- 路由管理：Vue Router

## 📝 注意事项

- 需要有效的 OpenAI API Key
- 建议使用较新版本的现代浏览器
- 所有数据都存储在浏览器本地，刷新不会丢失
- API Key 保存在本地，不会上传到服务器

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License
