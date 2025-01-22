import { DragEvent } from 'react';
import { Collapse } from 'antd';

const { Panel } = Collapse;

interface BaseNode {
  type: string;
  label: string;
  description: string;
}

interface InputNode extends BaseNode {
  type: 'input';
  inputType?: 'matrix';
}

interface ProcessNode extends BaseNode {
  type: 'process';
  processType: string;
}

interface OutputNode extends BaseNode {
  type: 'output';
}

type NodeType = InputNode | ProcessNode | OutputNode;

interface NodeCategory {
  title: string;
  nodes: NodeType[];
}

const nodeCategories: Record<string, NodeCategory> = {
  input: {
    title: '输入节点',
    nodes: [
      {
        type: 'input',
        label: '📥 图像输入',
        description: '用于输入图片'
      },
      {
        type: 'input',
        inputType: 'matrix',
        label: '🔢 矩阵输入',
        description: '用于输入数值矩阵'
      }
    ]
  },
  process: {
    title: '图像处理',
    nodes: [
      {
        type: 'process',
        processType: 'binary',
        label: '⚡️ 二值化',
        description: '将图片转换为黑白二值图像'
      },
      {
        type: 'process',
        processType: 'blur',
        label: '🌫 高斯模糊',
        description: '对图片应用高斯模糊效果'
      },
      {
        type: 'process',
        processType: 'erode',
        label: '⬇️ 腐蚀',
        description: '对图像进行腐蚀操作'
      },
      {
        type: 'process',
        processType: 'dilate',
        label: '⬆️ 膨胀',
        description: '对图像进行膨胀操作'
      },
      {
        type: 'process',
        processType: 'edge',
        label: '📏 边缘检测',
        description: '检测图像中的边缘'
      }
    ]
  },
  mask: {
    title: '蒙版操作',
    nodes: [
      {
        type: 'process',
        processType: 'mask',
        label: '🎭 应用蒙版',
        description: '使用蒙版处理图像'
      },
      {
        type: 'process',
        processType: 'invert-mask',
        label: '🔄 反转蒙版',
        description: '反转蒙版的效果'
      }
    ]
  },
  draw: {
    title: '绘图节点',
    nodes: [
      {
        type: 'process',
        processType: 'draw-rect',
        label: '⬜️ 绘制矩形',
        description: '在图像上绘制矩形'
      },
      {
        type: 'process',
        processType: 'draw-circle',
        label: '⭕️ 绘制圆形',
        description: '在图像上绘制圆形'
      },
      {
        type: 'process',
        processType: 'draw-line',
        label: '📏 绘制直线',
        description: '在图像上绘制直线'
      }
    ]
  },
  output: {
    title: '输出节点',
    nodes: [
      {
        type: 'output',
        label: '📤 图像输出',
        description: '用于输出图片'
      }
    ]
  }
};

interface NodeSelectorProps {
  onNodeAdd: (type: string, position: { x: number; y: number }, data?: any) => void;
}

const NodeSelector = ({ onNodeAdd }: NodeSelectorProps) => {
  const onDragStart = (event: DragEvent<HTMLDivElement>, node: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = (node: NodeType) => {
    let data;
    if (node.type === 'process') {
      data = { type: node.processType, label: node.label };
    } else if (node.type === 'input' && node.inputType === 'matrix') {
      data = { type: 'matrix', label: node.label };
    }
    onNodeAdd(node.type, { x: 100, y: 100 }, data);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="font-bold text-lg p-4 border-b border-gray-200">节点列表</div>
      <div className="flex-1 overflow-y-auto p-4">
        <Collapse defaultActiveKey={['input', 'process']}>
          {Object.entries(nodeCategories).map(([key, category]) => (
            <Panel header={category.title} key={key}>
              <div className="space-y-2">
                {category.nodes.map((node) => (
                  <div
                    key={node.type + (node.processType || '') + (node.inputType || '')}
                    className="p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-500 hover:shadow-sm transition-all w-full"
                    draggable
                    onDragStart={(e) => onDragStart(e, node)}
                    onDoubleClick={() => onNodeClick(node)}
                  >
                    <div className="font-medium">{node.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{node.description}</div>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default NodeSelector; 