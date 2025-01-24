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
  data?: {
    type: string;
  };
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
      { type: 'input', label: '📷 图像输入', description: '上传本地图片' },
      { type: 'input', label: '⬜️ 空白图像', description: '创建空白图像', data: { type: 'blank' } }
    ]
  },
  basic_process: {
    title: '基础处理',
    nodes: [
      { type: 'process', processType: 'grayscale', label: '🌫 灰度图', description: '将彩色图像转换为灰度图' },
      { type: 'process', processType: 'blank', label: '⬜️ 空白图像', description: '创建纯色图像，可选择彩色或黑白' },
      { type: 'process', processType: 'binary', label: '⚫️ 二值化', description: '将图像转换为黑白二值图像' },
      { type: 'process', processType: 'blur', label: '🌫 模糊', description: '对图像进行高斯模糊' },
      { type: 'process', processType: 'erode', label: '🔍 腐蚀', description: '图像腐蚀操作' },
      { type: 'process', processType: 'dilate', label: '💫 膨胀', description: '图像膨胀操作' },
      { type: 'process', processType: 'edge', label: '🔲 边缘检测', description: '检测图像边缘' },
      { type: 'process', processType: 'contour', label: '📍 轮廓检测', description: '检测图像中的轮廓' }
    ]
  },
  draw: {
    title: '绘图工具',
    nodes: [
      { type: 'process', processType: 'draw-rect', label: '⬜️ 绘制矩形', description: '在图像上绘制矩形' },
      { type: 'process', processType: 'draw-circle', label: '🔴 绘制椭圆', description: '在图像上绘制椭圆形，可调整长轴和短轴' },
      { type: 'process', processType: 'draw-line', label: '➖ 绘制直线', description: '在图像上绘制直线' }
    ]
  },
  mask: {
    title: '蒙版操作',
    nodes: [
      { type: 'process', processType: 'mask', label: '🎭 应用蒙版', description: '使用蒙版处理图像' },
      { type: 'process', processType: 'invert-mask', label: '🔄 反转蒙版', description: '反转蒙版的效果' }
    ]
  },
  blend: {
    title: '混合模式',
    nodes: [
      { type: 'process', processType: 'multiply', label: '✖️ 正片叠底', description: '将两个图层的颜色相乘' },
      { type: 'process', processType: 'screen', label: '🔆 滤色', description: '将两个图层的颜色反相相乘' },
      { type: 'process', processType: 'overlay', label: '📍 叠加', description: '根据底图颜色决定是正片叠底还是滤色' },
      { type: 'process', processType: 'blend', label: '🔀 混合', description: '按不同比例混合两个图层' }
    ]
  },
  output: {
    title: '输出节点',
    nodes: [
      { type: 'output', label: '📤 图像输出', description: '输出处理后的图像' },
      { type: 'process', processType: 'print', label: '📝 数据打印', description: '打印非图像数据' }
    ]
  }
};

interface NodeSelectorProps {
  onNodeAdd: (type: string, position: { x: number; y: number }, data?: any) => void;
}

const NodeSelector = ({ onNodeAdd }: NodeSelectorProps) => {
  const onDragStart = (event: DragEvent<HTMLDivElement>, node: NodeType) => {
    const data = {
      type: node.type,
      label: node.label,
      ...(node.type === 'process' ? { processType: node.processType } : {}),
      ...(node.type === 'input' && node.data ? { data: node.data } : {})
    };
    event.dataTransfer.setData('application/reactflow', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
    console.log('拖拽的节点是：', node);
  };

  const onNodeClick = (node: NodeType) => {
    let data;
    if (node.type === 'process') {
      data = { type: node.type, processType: node.processType, label: node.label };
    } else if (node.type === 'input') {
      data = node.data ? { type: node.data.type, label: node.label } : undefined;
    }
    onNodeAdd(node.type, { x: 100, y: 100 }, data);
  };

  const collapseItems = Object.entries(nodeCategories).map(([key, category]) => ({
    key,
    label: category.title,
    children: (
      <div className="space-y-2">
        {category.nodes.map((node, index) => (
          <div
            key={`${key}-${index}`}
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
    )
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="font-bold text-lg p-4 border-b border-gray-200">节点列表</div>
      <div className="flex-1 overflow-y-auto p-4">
        <Collapse defaultActiveKey={['input', 'basic_process', 'draw']} items={collapseItems} />
      </div>
    </div>
  );
};

export default NodeSelector; 