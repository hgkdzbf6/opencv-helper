import React, { useRef, useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import Draggable from 'react-draggable';
import { Button } from 'antd';
import { useImageStore } from '../store/imageStore';

interface DebugPanelProps {
  logs: string[];
  nodes: Node[];
  edges: Edge[];
}

const DebugPanel: React.FC<DebugPanelProps> = ({ logs, nodes, edges }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const { images, getConnectedNodeImage } = useImageStore();

  const debugFlow = () => {
    console.group('流程图调试信息');
    console.log('节点:', nodes);
    console.log('连接:', edges);
    console.log('图像:', images);
    nodes.forEach(node => {
      if (node.type === 'process') {
        console.group(`节点 ${node.id}`);
        console.log('输入图像:', getConnectedNodeImage(node.id));
        console.log('输出图像:', images[node.id]);
        console.groupEnd();
      }
    });
    console.groupEnd();
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: 20, y: window.innerHeight - 300 }}
      handle=".debug-panel-handle"
    >
      <div
        ref={nodeRef}
        className="absolute bg-white rounded-lg shadow-lg border border-gray-200 w-[300px]"
        style={{ zIndex: 1000 }}
      >
        <div className="debug-panel-handle p-2 bg-gray-100 rounded-t-lg cursor-move flex justify-between items-center">
          <span className="font-medium">调试面板</span>
          <div className="flex items-center gap-2">
            <Button size="small" onClick={debugFlow}>调试</Button>
            <Button 
              size="small" 
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? '展开' : '收起'}
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <div className="p-2 max-h-[200px] overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-xs mb-1 font-mono">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-400 text-center text-sm">暂无日志</div>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default DebugPanel; 