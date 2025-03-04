// import React, { useEffect, useState } from 'react';
// import MDEditor from '@uiw/react-md-editor';
// //import { useDebounce } from '../hooks/useDebounce';

// interface BusinessAnalysisEditorProps {
//   initialContent?: string;
//   onSave?: (content: string) => void;
//   readOnly?: boolean;
// }

// const LOCAL_STORAGE_KEY = 'business_analysis_content';

// export const BusinessAnalysisEditor: React.FC<BusinessAnalysisEditorProps> = ({
//   initialContent = '',
//   onSave,
//   readOnly = false
// }) => {
//   const [content, setContent] = useState<string>(
//     localStorage.getItem(LOCAL_STORAGE_KEY) || initialContent
//   );
  
//   const debouncedContent = useDebounce(content, 1000);

//   // 当initialContent改变时更新内容
//   useEffect(() => {
//     if (initialContent) {
//       setContent(initialContent);
//     }
//   }, [initialContent]);

//   // 自动保存到localStorage
//   useEffect(() => {
//     if (!readOnly) {
//       localStorage.setItem(LOCAL_STORAGE_KEY, debouncedContent);
//       onSave?.(debouncedContent);
//     }
//   }, [debouncedContent, onSave, readOnly]);

//   // 导出为Word文档
//   const exportToWord = async () => {
//     try {
//       // 创建一个临时的a标签用于下载
//       const element = document.createElement('a');
//       const file = new Blob([content], {type: 'text/markdown'});
//       element.href = URL.createObjectURL(file);
//       element.download = '业务分析报告.md';
//       document.body.appendChild(element);
//       element.click();
//       document.body.removeChild(element);
//     } catch (error) {
//       console.error('导出文档失败:', error);
//     }
//   };

//   return (
//     <div className="business-analysis-editor">
//       {!readOnly && (
//         <div className="editor-toolbar">
//           <button 
//             onClick={exportToWord}
//             className="export-button"
//           >
//             导出文档
//           </button>
//         </div>
//       )}
//       <MDEditor
//         value={content}
//         onChange={(value) => !readOnly && setContent(value || '')}
//         preview={readOnly ? "preview" : "edit"}
//         height={600}
//         hideToolbar={readOnly}
//         previewOptions={{
//           components: {
//             code: ({ inline, children = [], className }) => {
//               if (inline) return <code>{children}</code>;
              
//               return (
//                 <code className={className}>
//                   {children}
//                 </code>
//               );
//             },
//           },
//         }}
//       />
//       <style>
//         {`
//           .business-analysis-editor {
//             padding: 20px;
//           }
          
//           .editor-toolbar {
//             margin-bottom: 16px;
//           }
          
//           .export-button {
//             padding: 8px 16px;
//             background-color: #1890ff;
//             color: white;
//             border: none;
//             border-radius: 4px;
//             cursor: pointer;
//           }
          
//           .export-button:hover {
//             background-color: #40a9ff;
//           }

//           .w-md-editor-text-pre > code,
//           .w-md-editor-text-input {
//             font-size: 16px !important;
//             line-height: 1.6 !important;
//           }

//           .wmde-markdown {
//             font-size: 16px !important;
//             line-height: 1.6 !important;
//           }
//         `}
//       </style>
//     </div>
//   );
// }; 