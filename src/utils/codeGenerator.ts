import { Node, Edge } from 'reactflow';
import { useDataStore } from '../store/imageStore';

interface CodeGeneratorOptions {
  language: 'python' | 'cpp';
  nodes: Node[];
  edges: Edge[];
  nodeParams: Record<string, any>;
}

const generatePythonCode = (nodes: Node[], edges: Edge[], nodeParams: Record<string, any>): string => {
  let code = `import cv2
import numpy as np

def process_image(input_path: str, output_path: str):
    # 读取输入图像
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError("无法读取输入图像")
    
    # 创建节点输出的中间结果字典
    results = {}\n\n`;

  // 按照边的连接顺序处理节点
  const processedNodes = new Set<string>();
  const inputNodes = nodes.filter(node => node.type === 'input');
  
  // 首先处理输入节点
  inputNodes.forEach(node => {
    code += `    # 输入节点 ${node.id}\n`;
    code += `    results['${node.id}'] = img.copy()\n\n`;
    processedNodes.add(node.id);
  });

  // 然后按照边的连接顺序处理其他节点
  let remainingNodes = true;
  while (remainingNodes) {
    remainingNodes = false;
    nodes.forEach(node => {
      if (processedNodes.has(node.id) || node.type === 'input') return;

      // 检查该节点的所有输入是否都已处理
      const nodeEdges = edges.filter(edge => edge.target === node.id);
      const allInputsProcessed = nodeEdges.every(edge => processedNodes.has(edge.source));

      if (allInputsProcessed) {
        remainingNodes = true;
        const params = nodeParams[node.id]?.[node.data?.processType] || {};
        
        code += `    # 处理节点 ${node.id} (${node.data?.processType})\n`;
        
        switch (node.data?.processType) {
          case 'binary':
            code += `    gray = cv2.cvtColor(results['${nodeEdges[0].source}'], cv2.COLOR_BGR2GRAY)
    _, results['${node.id}'] = cv2.threshold(
        gray,
        ${params.threshold || 128},
        ${params.maxValue || 255},
        cv2.${params.method || 'THRESH_BINARY'}${params.useOtsu ? ' | cv2.THRESH_OTSU' : ''}
    )\n\n`;
            break;

          case 'blur':
            code += `    results['${node.id}'] = cv2.GaussianBlur(
        results['${nodeEdges[0].source}'],
        (${params.kernelSize || 5}, ${params.kernelSize || 5}),
        ${params.sigmaX || 0},
        ${params.sigmaY || 0},
        borderType=cv2.${params.borderType || 'BORDER_DEFAULT'}
    )\n\n`;
            break;

          case 'erode':
            code += `    kernel = cv2.getStructuringElement(
        cv2.${params.kernelShape || 'MORPH_RECT'},
        (${params.kernelSize || 3}, ${params.kernelSize || 3})
    )
    results['${node.id}'] = cv2.erode(
        results['${nodeEdges[0].source}'],
        kernel,
        iterations=${params.iterations || 1}
    )\n\n`;
            break;

          case 'dilate':
            code += `    kernel = cv2.getStructuringElement(
        cv2.${params.kernelShape || 'MORPH_RECT'},
        (${params.kernelSize || 3}, ${params.kernelSize || 3})
    )
    results['${node.id}'] = cv2.dilate(
        results['${nodeEdges[0].source}'],
        kernel,
        iterations=${params.iterations || 1}
    )\n\n`;
            break;

          case 'edge':
            code += `    gray = cv2.cvtColor(results['${nodeEdges[0].source}'], cv2.COLOR_BGR2GRAY)
    results['${node.id}'] = cv2.Canny(
        gray,
        ${params.threshold1 || 100},
        ${params.threshold2 || 200},
        apertureSize=${params.apertureSize || 3},
        L2gradient=${params.l2gradient ? 'True' : 'False'}
    )\n\n`;
            break;

          case 'grayscale':
            code += `    results['${node.id}'] = cv2.cvtColor(results['${nodeEdges[0].source}'], cv2.COLOR_BGR2GRAY)\n\n`;
            break;

          case 'blank':
            code += `    color = ${JSON.stringify(params.color || [255, 255, 255])}
    if ${params.isGrayscale ? 'True' : 'False'}:
        results['${node.id}'] = np.full((${params.height || 512}, ${params.width || 512}), ${(params.color || [255, 255, 255])[0]}, dtype=np.uint8)
    else:
        results['${node.id}'] = np.full((${params.height || 512}, ${params.width || 512}, 3), color, dtype=np.uint8)\n\n`;
            break;

          case 'draw-rect':
            code += `    results['${node.id}'] = results['${nodeEdges[0].source}'].copy()
    cv2.rectangle(
        results['${node.id}'],
        (${params.x || 0}, ${params.y || 0}),
        (${(params.x || 0) + (params.width || 100)}, ${(params.y || 0) + (params.height || 100)}),
        ${JSON.stringify(params.color || [255, 0, 0])},
        ${params.filled ? -1 : params.thickness || 2},
        cv2.${params.lineType || 'LINE_8'}
    )\n\n`;
            break;

          case 'draw-circle':
            code += `    results['${node.id}'] = results['${nodeEdges[0].source}'].copy()
    cv2.circle(
        results['${node.id}'],
        (${params.x || 50}, ${params.y || 50}),
        ${params.radius || 25},
        ${JSON.stringify(params.color || [0, 255, 0])},
        ${params.filled ? -1 : params.thickness || 2},
        cv2.${params.lineType || 'LINE_8'}
    )\n\n`;
            break;

          case 'draw-line':
            code += `    results['${node.id}'] = results['${nodeEdges[0].source}'].copy()
    cv2.line(
        results['${node.id}'],
        (${params.x1 || 0}, ${params.y1 || 0}),
        (${params.x2 || 100}, ${params.y2 || 100}),
        ${JSON.stringify(params.color || [0, 0, 255])},
        ${params.thickness || 2},
        cv2.${params.lineType || 'LINE_8'}
    )\n\n`;
            break;

          case 'multiply':
            code += `    img1 = results['${nodeEdges[0].source}'].astype(float) / 255.0
    img2 = results['${nodeEdges[1].source}'].astype(float) / 255.0
    result = cv2.multiply(img1, img2)
    result = cv2.addWeighted(img1, ${1 - (params.opacity || 1.0)}, result, ${params.opacity || 1.0}, 0)
    results['${node.id}'] = (result * 255).astype(np.uint8)\n\n`;
            break;

          case 'screen':
            code += `    img1 = results['${nodeEdges[0].source}'].astype(float) / 255.0
    img2 = results['${nodeEdges[1].source}'].astype(float) / 255.0
    result = 1 - cv2.multiply(1 - img1, 1 - img2)
    result = cv2.addWeighted(img1, ${1 - (params.opacity || 1.0)}, result, ${params.opacity || 1.0}, 0)
    results['${node.id}'] = (result * 255).astype(np.uint8)\n\n`;
            break;

          case 'overlay':
            code += `    img1 = results['${nodeEdges[0].source}'].astype(float) / 255.0
    img2 = results['${nodeEdges[1].source}'].astype(float) / 255.0
    mask = img1 <= 0.5
    result = np.zeros_like(img1)
    result[mask] = 2 * img1[mask] * img2[mask]
    result[~mask] = 1 - 2 * (1 - img1[~mask]) * (1 - img2[~mask])
    result = cv2.addWeighted(img1, ${1 - (params.opacity || 1.0)}, result, ${params.opacity || 1.0}, 0)
    results['${node.id}'] = (result * 255).astype(np.uint8)\n\n`;
            break;

          case 'blend':
            code += `    img1 = results['${nodeEdges[0].source}'].astype(float)
    img2 = results['${nodeEdges[1].source}'].astype(float)
    results['${node.id}'] = cv2.addWeighted(
        img1, ${1 - (params.ratio || 0.5)},
        img2, ${params.ratio || 0.5},
        0
    ).astype(np.uint8)\n\n`;
            break;
        }
        
        processedNodes.add(node.id);
      }
    });
  }

  // 最后处理输出节点
  const outputNode = nodes.find(node => node.type === 'output');
  if (outputNode) {
    const inputEdge = edges.find(edge => edge.target === outputNode.id);
    if (inputEdge) {
      code += `    # 保存结果\n`;
      code += `    cv2.imwrite(output_path, results['${inputEdge.source}'])\n\n`;
    }
  }

  code += `if __name__ == '__main__':
    import sys
    if len(sys.argv) != 3:
        print("Usage: python script.py input_image output_image")
        sys.exit(1)
    process_image(sys.argv[1], sys.argv[2])\n`;

  return code;
};

const generateCppCode = (nodes: Node[], edges: Edge[], nodeParams: Record<string, any>): string => {
  let code = `#include <opencv2/opencv.hpp>
#include <iostream>

using namespace cv;
using namespace std;

void processImage(const string& inputPath, const string& outputPath) {
    // 读取输入图像
    Mat img = imread(inputPath);
    if (img.empty()) {
        cerr << "无法读取输入图像" << endl;
        return;
    }
    
    // 创建节点输出的中间结果字典
    map<string, Mat> results;\n\n`;

  // 按照边的连接顺序处理节点
  const processedNodes = new Set<string>();
  const inputNodes = nodes.filter(node => node.type === 'input');
  
  // 首先处理输入节点
  inputNodes.forEach(node => {
    code += `    // 输入节点 ${node.id}\n`;
    code += `    results["${node.id}"] = img.clone();\n\n`;
    processedNodes.add(node.id);
  });

  // 然后按照边的连接顺序处理其他节点
  let remainingNodes = true;
  while (remainingNodes) {
    remainingNodes = false;
    nodes.forEach(node => {
      if (processedNodes.has(node.id) || node.type === 'input') return;

      // 检查该节点的所有输入是否都已处理
      const nodeEdges = edges.filter(edge => edge.target === node.id);
      const allInputsProcessed = nodeEdges.every(edge => processedNodes.has(edge.source));

      if (allInputsProcessed) {
        remainingNodes = true;
        const params = nodeParams[node.id]?.[node.data?.processType] || {};
        
        code += `    // 处理节点 ${node.id} (${node.data?.processType})\n`;
        
        switch (node.data?.processType) {
          case 'binary':
            code += `    Mat gray;
    cvtColor(results["${nodeEdges[0].source}"], gray, COLOR_BGR2GRAY);
    threshold(
        gray,
        results["${node.id}"],
        ${params.threshold || 128},
        ${params.maxValue || 255},
        ${params.method || 'THRESH_BINARY'}${params.useOtsu ? ' | THRESH_OTSU' : ''}
    );\n\n`;
            break;

          case 'blur':
            code += `    GaussianBlur(
        results["${nodeEdges[0].source}"],
        results["${node.id}"],
        Size(${params.kernelSize || 5}, ${params.kernelSize || 5}),
        ${params.sigmaX || 0},
        ${params.sigmaY || 0},
        ${params.borderType || 'BORDER_DEFAULT'}
    );\n\n`;
            break;

          case 'erode':
            code += `    Mat kernel = getStructuringElement(
        ${params.kernelShape || 'MORPH_RECT'},
        Size(${params.kernelSize || 3}, ${params.kernelSize || 3})
    );
    erode(
        results["${nodeEdges[0].source}"],
        results["${node.id}"],
        kernel,
        Point(-1, -1),
        ${params.iterations || 1}
    );\n\n`;
            break;

          case 'dilate':
            code += `    Mat kernel = getStructuringElement(
        ${params.kernelShape || 'MORPH_RECT'},
        Size(${params.kernelSize || 3}, ${params.kernelSize || 3})
    );
    dilate(
        results["${nodeEdges[0].source}"],
        results["${node.id}"],
        kernel,
        Point(-1, -1),
        ${params.iterations || 1}
    );\n\n`;
            break;

          case 'edge':
            code += `    Mat gray;
    cvtColor(results["${nodeEdges[0].source}"], gray, COLOR_BGR2GRAY);
    Canny(
        gray,
        results["${node.id}"],
        ${params.threshold1 || 100},
        ${params.threshold2 || 200},
        ${params.apertureSize || 3},
        ${params.l2gradient ? 'true' : 'false'}
    );\n\n`;
            break;

          case 'grayscale':
            code += `    cvtColor(results["${nodeEdges[0].source}"], results["${node.id}"], COLOR_BGR2GRAY);\n\n`;
            break;

          case 'blank':
            code += `    if (${params.isGrayscale ? 'true' : 'false'}) {
        results["${node.id}"] = Mat(${params.height || 512}, ${params.width || 512}, CV_8UC1, Scalar(${(params.color || [255, 255, 255])[0]}));
    } else {
        results["${node.id}"] = Mat(${params.height || 512}, ${params.width || 512}, CV_8UC3, Scalar(${(params.color || [255, 255, 255]).join(', ')}));
    }\n\n`;
            break;

          case 'draw-rect':
            code += `    results["${node.id}"] = results["${nodeEdges[0].source}"].clone();
    rectangle(
        results["${node.id}"],
        Point(${params.x || 0}, ${params.y || 0}),
        Point(${(params.x || 0) + (params.width || 100)}, ${(params.y || 0) + (params.height || 100)}),
        Scalar(${(params.color || [255, 0, 0]).join(', ')}),
        ${params.filled ? -1 : params.thickness || 2},
        ${params.lineType || 'LINE_8'}
    );\n\n`;
            break;

          case 'draw-circle':
            code += `    results["${node.id}"] = results["${nodeEdges[0].source}"].clone();
    circle(
        results["${node.id}"],
        Point(${params.x || 50}, ${params.y || 50}),
        ${params.radius || 25},
        Scalar(${(params.color || [0, 255, 0]).join(', ')}),
        ${params.filled ? -1 : params.thickness || 2},
        ${params.lineType || 'LINE_8'}
    );\n\n`;
            break;

          case 'draw-line':
            code += `    results["${node.id}"] = results["${nodeEdges[0].source}"].clone();
    line(
        results["${node.id}"],
        Point(${params.x1 || 0}, ${params.y1 || 0}),
        Point(${params.x2 || 100}, ${params.y2 || 100}),
        Scalar(${(params.color || [0, 0, 255]).join(', ')}),
        ${params.thickness || 2},
        ${params.lineType || 'LINE_8'}
    );\n\n`;
            break;

          case 'multiply':
            code += `    Mat img1, img2;
    results["${nodeEdges[0].source}"].convertTo(img1, CV_32F, 1.0/255.0);
    results["${nodeEdges[1].source}"].convertTo(img2, CV_32F, 1.0/255.0);
    Mat result;
    multiply(img1, img2, result);
    addWeighted(img1, ${1 - (params.opacity || 1.0)}, result, ${params.opacity || 1.0}, 0, result);
    result.convertTo(results["${node.id}"], CV_8U, 255.0);\n\n`;
            break;

          case 'screen':
            code += `    Mat img1, img2;
    results["${nodeEdges[0].source}"].convertTo(img1, CV_32F, 1.0/255.0);
    results["${nodeEdges[1].source}"].convertTo(img2, CV_32F, 1.0/255.0);
    Mat result = 1.0 - (1.0 - img1).mul(1.0 - img2);
    addWeighted(img1, ${1 - (params.opacity || 1.0)}, result, ${params.opacity || 1.0}, 0, result);
    result.convertTo(results["${node.id}"], CV_8U, 255.0);\n\n`;
            break;

          case 'overlay':
            code += `    Mat img1, img2;
    results["${nodeEdges[0].source}"].convertTo(img1, CV_32F, 1.0/255.0);
    results["${nodeEdges[1].source}"].convertTo(img2, CV_32F, 1.0/255.0);
    Mat result(img1.size(), CV_32FC3);
    for(int i = 0; i < img1.rows; i++) {
        for(int j = 0; j < img1.cols; j++) {
            for(int c = 0; c < 3; c++) {
                float v1 = img1.at<Vec3f>(i,j)[c];
                float v2 = img2.at<Vec3f>(i,j)[c];
                if(v1 <= 0.5)
                    result.at<Vec3f>(i,j)[c] = 2 * v1 * v2;
                else
                    result.at<Vec3f>(i,j)[c] = 1 - 2 * (1 - v1) * (1 - v2);
            }
        }
    }
    addWeighted(img1, ${1 - (params.opacity || 1.0)}, result, ${params.opacity || 1.0}, 0, result);
    result.convertTo(results["${node.id}"], CV_8U, 255.0);\n\n`;
            break;

          case 'blend':
            code += `    addWeighted(
        results["${nodeEdges[0].source}"],
        ${1 - (params.ratio || 0.5)},
        results["${nodeEdges[1].source}"],
        ${params.ratio || 0.5},
        0,
        results["${node.id}"]
    );\n\n`;
            break;
        }
        
        processedNodes.add(node.id);
      }
    });
  }

  // 最后处理输出节点
  const outputNode = nodes.find(node => node.type === 'output');
  if (outputNode) {
    const inputEdge = edges.find(edge => edge.target === outputNode.id);
    if (inputEdge) {
      code += `    // 保存结果\n`;
      code += `    imwrite(outputPath, results["${inputEdge.source}"]);\n\n`;
    }
  }

  code += `}

int main(int argc, char** argv) {
    if (argc != 3) {
        cerr << "Usage: " << argv[0] << " input_image output_image" << endl;
        return 1;
    }
    processImage(argv[1], argv[2]);
    return 0;
}\n`;

  return code;
};

export const generateCode = ({ language, nodes, edges, nodeParams }: CodeGeneratorOptions): string => {
  if (language === 'python') {
    return generatePythonCode(nodes, edges, nodeParams);
  } else {
    return generateCppCode(nodes, edges, nodeParams);
  }
}; 