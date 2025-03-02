# 🤖 SmartBA - 智能商业分析助手

> 基于 Vue 3 和 OpenAI 的智能商业分析助手，让需求分析和文档生成变得简单高效。

## 使用Demo:
SmartBA_demo_LD.mp4
https://github.com/user-attachments/assets/39fc98b1-a573-469b-a94b-f2239642d659

## 📋 项目概述

SmartBA 是一个基于 Vue 3 和 OpenAI 的商业分析助手，它能够帮助用户：
- 📝 智能分析和检查项目需求
- 🎯 自动生成用户故事和验收标准
- 📊 在线管理和编辑需求内容
- 📄 生成专业的项目需求文档

## 🎯 主要功能模块

项目包含三个主要功能模块（标签页）：

### 1. 业务分析 (Business Analysis)
- 📊 项目背景分析和需求检查
- 🔍 智能识别需求缺失点
- 💡 交互式需求完善
- 📋 生成业务需求文档

### 2. 功能分析 (Function Analysis)
- 📝 用户故事生成和管理
- ✅ 验收标准及测试用例自动生成
- 📊 表格化展示和编辑
- 📄 需求文档一键生成

### 3. UI/UX 分析
- 🎨 界面原型建议
- 📱 用户体验分析
- 🔄 交互流程设计
- 💻 界面布局建议

## 🛠️ 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件**: Element Plus
- **状态管理**: Vue Refs + LocalStorage
- **AI 集成**: OpenAI API
- **构建工具**: Vite
- **包管理器**: npm

## ✨ 核心功能

### 1️⃣ 商业分析专家
- 🔍 智能分析项目背景
- 🤖 基于 GPT 模型生成用户故事
- 📝 自动生成验收标准
- 💾 支持在线编辑和保存

### 2️⃣ 需求检查和完善
- 🔍 智能识别需求缺失点
- ❓ 自动生成补充问题
- 💡 交互式需求完善
- 📋 需求整合和优化

### 3️⃣ 用户故事管理
- 📊 表格式展示和编辑
- ✏️ 实时编辑功能
- 🗑️ 支持删除操作
- 📥 导出为 Excel 格式

### 4️⃣ 需求文档生成
- 📝 自动生成完整需求文档
- 📘 支持 Markdown 格式
- 🔄 实时预览功能
- 💾 导出文档功能

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 8+

### 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd SmartBA
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
```
编辑 .env 文件，设置您的 OpenAI API Key：
```
VITE_OPENAI_API_KEY=your_api_key_here
```

4. 启动开发服务器
```bash
npm run dev
```

## 📖 使用指南

### 1. 业务分析模块
1. 进入业务分析页面
2. 输入项目背景描述
3. 使用"需求检查"功能完善需求
4. 点击"AI生成"生成业务分析文档
5. 查看和导出生成的文档

### 2. 功能分析模块
1. 进入功能分析页面
2. 输入项目背景描述
3. 使用"AI生成"生成用户故事
4. 在表格中编辑和管理用户故事
5. 点击"生成需求文档"按钮生成详细文档
6. 导出用户故事或需求文档

### 3. UI/UX 分析模块
1. 进入 UI/UX 分析页面
2. 输入界面需求描述
3. 获取界面设计建议和原型参考
4. 查看交互流程建议
5. 导出分析结果

### 数据管理
- 所有模块的数据都会自动保存
- 可以随时导出数据备份
- 支持跨模块数据关联
- 提供多种导出格式（Excel、Markdown等）

## ⚙️ 项目结构

```
src/
├── components/        # 组件目录
├── views/            # 页面视图
├── services/         # 服务层（API 调用等）
├── assets/           # 静态资源
└── App.vue          # 根组件
```

## ⚠️ 注意事项

### API 配置
- 需要配置有效的 OpenAI API Key
- 支持通过环境变量或界面配置
- API Key 会保存在本地存储中

### 数据存储
- 用户故事数据保存在本地存储中
- 建议定期导出重要数据
- 刷新页面不会丢失数据

### 使用建议
- 建议先使用需求检查功能
- 确保项目背景描述完整
- 及时保存或导出重要内容

## 🤝 贡献指南

欢迎为 SmartBA 项目做出贡献！您可以通过以下方式参与：
- 提交 Issue
- 提出新功能建议
- 改进文档
- 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件