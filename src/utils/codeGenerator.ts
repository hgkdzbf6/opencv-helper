import { Node, Edge } from 'reactflow';
import { useImageStore } from '../store/imageStore';

interface CodeGeneratorOptions {
  language: 'python' | 'cpp';
  nodes: Node[];
  edges: Edge[];
  nodeParams: Record<string, any>;
}

const generatePythonCode = (nodes: Node[], edges: Edge[], nodeParams: Record<string, any>): string => {
  let code = `import cv2
import numpy as np

def process_image(input_image):
    # 读取输入图片
    img = input_image.copy()
`;

  // 创建节点ID到变量名的映射
  const varNames = new Map<string, string>();
  nodes.forEach(node => {
    if (node.type === 'input') {
      varNames.set(node.id, 'img');
    } else {
      varNames.set(node.id, `img_${node.id}`);
    }
  });

  // 按照处理顺序生成代码
  nodes.forEach(node => {
    if (node.type === 'process') {
      const inputNodeId = edges.find(edge => edge.target === node.id)?.source;
      if (!inputNodeId) return;

      const inputVar = varNames.get(inputNodeId);
      const outputVar = varNames.get(node.id);
      const params = nodeParams[node.id];

      switch (node.data.type) {
        case 'binary':
          code += `
    # 二值化处理
    ${outputVar} = cv2.cvtColor(${inputVar}, cv2.COLOR_BGR2GRAY)
    _, ${outputVar} = cv2.threshold(${outputVar}, ${params?.binary?.threshold || 128}, 255, cv2.THRESH_BINARY)`;
          break;
        case 'blur':
          const kernelSize = params?.blur?.kernelSize || 5;
          code += `
    # 高斯模糊
    ${outputVar} = cv2.GaussianBlur(${inputVar}, (${kernelSize}, ${kernelSize}), 0)`;
          break;
      }
    }
  });

  // 找到输出节点
  const outputNode = nodes.find(node => node.type === 'output');
  if (outputNode) {
    const inputNodeId = edges.find(edge => edge.target === outputNode.id)?.source;
    if (inputNodeId) {
      const inputVar = varNames.get(inputNodeId);
      code += `
    
    # 返回处理结果
    return ${inputVar}`;
    }
  }

  return code;
};

const generateCppCode = (nodes: Node[], edges: Edge[], nodeParams: Record<string, any>): string => {
  let code = `#include <opencv2/opencv.hpp>
#include <iostream>

using namespace cv;
using namespace std;

Mat process_image(Mat input_image) {
    // 复制输入图片
    Mat img = input_image.clone();
`;

  // 创建节点ID到变量名的映射
  const varNames = new Map<string, string>();
  nodes.forEach(node => {
    if (node.type === 'input') {
      varNames.set(node.id, 'img');
    } else {
      varNames.set(node.id, `img_${node.id}`);
    }
  });

  // 按照处理顺序生成代码
  nodes.forEach(node => {
    if (node.type === 'process') {
      const inputNodeId = edges.find(edge => edge.target === node.id)?.source;
      if (!inputNodeId) return;

      const inputVar = varNames.get(inputNodeId);
      const outputVar = varNames.get(node.id);
      const params = nodeParams[node.id];

      // 声明输出变量
      code += `\n    Mat ${outputVar};`;

      switch (node.data.type) {
        case 'binary':
          code += `
    // 二值化处理
    cvtColor(${inputVar}, ${outputVar}, COLOR_BGR2GRAY);
    threshold(${outputVar}, ${outputVar}, ${params?.binary?.threshold || 128}, 255, THRESH_BINARY);`;
          break;
        case 'blur':
          const kernelSize = params?.blur?.kernelSize || 5;
          code += `
    // 高斯模糊
    GaussianBlur(${inputVar}, ${outputVar}, Size(${kernelSize}, ${kernelSize}), 0);`;
          break;
      }
    }
  });

  // 找到输出节点
  const outputNode = nodes.find(node => node.type === 'output');
  if (outputNode) {
    const inputNodeId = edges.find(edge => edge.target === outputNode.id)?.source;
    if (inputNodeId) {
      const inputVar = varNames.get(inputNodeId);
      code += `
    
    // 返回处理结果
    return ${inputVar};`;
    }
  }

  code += `
}`;

  return code;
};

export const generateCode = ({ language, nodes, edges, nodeParams }: CodeGeneratorOptions): string => {
  switch (language) {
    case 'python':
      return generatePythonCode(nodes, edges, nodeParams);
    case 'cpp':
      return generateCppCode(nodes, edges, nodeParams);
    default:
      throw new Error('不支持的编程语言');
  }
}; 