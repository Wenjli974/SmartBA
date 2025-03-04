// import React, { useState } from 'react';
// //import { BusinessAnalysisEditor } from '../components/BusinessAnalysisEditor';
// import { generateUseCaseAnalysis, checkRequirementDetails } from '../services/openai';

// export const BusinessAnalysisPage: React.FC = () => {
//   const [loading, setLoading] = useState(false);
//   const [projectBackground, setProjectBackground] = useState('');
//   const [analysisContent, setAnalysisContent] = useState('');
//   const [questions, setQuestions] = useState<string[]>([]);

//   // 生成分析报告
//   const handleGenerateAnalysis = async () => {
//     if (!projectBackground) {
//       alert('请输入项目背景');
//       return;
//     }

//     setLoading(true);
//     try {
//       // 首先获取需要补充的问题
//       const requiredDetails = await checkRequirementDetails(projectBackground);
//       setQuestions(requiredDetails);

//       if (requiredDetails.length > 0) {
//         // 如果有需要补充的问题，显示在编辑器中
//         const questionsMarkdown = `
// # 需要补充的信息

// 以下是需要进一步明确的问题：

// ${requiredDetails.map(q => `- ${q}`).join('\n')}

// 请在补充以上信息后重新生成分析报告。
// `;
//         setAnalysisContent(questionsMarkdown);
//       } else {
//         // 如果没有需要补充的问题，直接生成分析报告
//         const analysis = await generateUseCaseAnalysis(projectBackground);
//         setAnalysisContent(analysis);
//       }
//     } catch (error) {
//       console.error('生成分析报告失败:', error);
//       alert(error instanceof Error ? error.message : '生成分析报告失败');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="business-analysis-page">
//       <div className="input-section">
//         <h2>项目背景</h2>
//         <textarea
//           value={projectBackground}
//           onChange={(e) => setProjectBackground(e.target.value)}
//           placeholder="请输入项目背景描述..."
//           rows={6}
//         />
//         <button 
//           onClick={handleGenerateAnalysis}
//           disabled={loading}
//         >
//           {loading ? '生成中...' : '生成分析报告'}
//         </button>
//       </div>

//       {analysisContent && (
//         <div className="editor-section">
//           <BusinessAnalysisEditor
//             initialContent={analysisContent}
//             readOnly={loading}
//           />
//         </div>
//       )}

//       <style jsx>{`
//         .business-analysis-page {
//           padding: 20px;
//           max-width: 1200px;
//           margin: 0 auto;
//         }

//         .input-section {
//           margin-bottom: 20px;
//         }

//         .input-section h2 {
//           margin-bottom: 16px;
//         }

//         textarea {
//           width: 100%;
//           padding: 12px;
//           border: 1px solid #d9d9d9;
//           border-radius: 4px;
//           margin-bottom: 16px;
//           font-size: 14px;
//         }

//         button {
//           padding: 8px 16px;
//           background-color: #1890ff;
//           color: white;
//           border: none;
//           border-radius: 4px;
//           cursor: pointer;
//         }

//         button:disabled {
//           background-color: #d9d9d9;
//           cursor: not-allowed;
//         }

//         button:hover:not(:disabled) {
//           background-color: #40a9ff;
//         }

//         .editor-section {
//           margin-top: 20px;
//         }
//       `}</style>
//     </div>
//   );
// }; 