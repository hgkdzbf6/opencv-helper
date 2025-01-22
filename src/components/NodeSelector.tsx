import { DragEvent } from 'react';

const nodeTypes = [
  {
    type: 'input',
    label: '📥 输入节点',
    description: '用于输入图片'
  },
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
    type: 'output',
    label: '📤 输出节点',
    description: '用于输出图片'
  }
];

interface NodeSelectorProps {
  onNodeAdd: (type: string, position: { x: number; y: number }, data?: any) => void;
}

const NodeSelector = ({ onNodeAdd }: NodeSelectorProps) => {
  const onDragStart = (event: DragEvent<HTMLDivElement>, node: typeof nodeTypes[0]) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = (node: typeof nodeTypes[0]) => {
    const data = node.type === 'process' 
      ? { type: node.processType, label: node.label }
      : undefined;
    onNodeAdd(node.type, { x: 100, y: 100 }, data);
  };

  return (
    <div className="w-[200px] bg-white border-r border-gray-200 p-4">
      <div className="font-bold text-lg mb-4">节点列表</div>
      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.type + (node.processType || '')}
            className="p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-500 hover:shadow-sm transition-all"
            draggable
            onDragStart={(e) => onDragStart(e, node)}
            onDoubleClick={() => onNodeClick(node)}
          >
            <div className="font-medium">{node.label}</div>
            <div className="text-xs text-gray-500 mt-1">{node.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodeSelector; 