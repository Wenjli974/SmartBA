import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'

interface ExportContent {
  title: string
  content: {
    uiPrototype: string
    uxAnalysis: string
    interactionFlow: string
    prototype: string
  }
}

export async function exportWordDocument(data: ExportContent): Promise<void> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: data.title,
                bold: true,
                size: 32
              })
            ]
          }),
          new Paragraph({
            children: [new TextRun({ text: '', size: 24 })]
          }),
          // 界面原型建议
          new Paragraph({
            children: [
              new TextRun({
                text: '界面原型建议',
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.content.uiPrototype,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [new TextRun({ text: '', size: 24 })]
          }),
          // 用户体验分析
          new Paragraph({
            children: [
              new TextRun({
                text: '用户体验分析',
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.content.uxAnalysis,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [new TextRun({ text: '', size: 24 })]
          }),
          // 交互流程设计
          new Paragraph({
            children: [
              new TextRun({
                text: '交互流程设计',
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.content.interactionFlow,
                size: 24
              })
            ]
          }),
          new Paragraph({
            children: [new TextRun({ text: '', size: 24 })]
          }),
          // 原型图
          new Paragraph({
            children: [
              new TextRun({
                text: '原型图',
                bold: true,
                size: 28
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: data.content.prototype,
                size: 24,
                font: 'Courier New'
              })
            ]
          })
        ]
      }
    ]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${data.title}-${new Date().toISOString().split('T')[0]}.docx`)
} 