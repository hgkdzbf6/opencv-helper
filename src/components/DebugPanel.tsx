import { useState, useEffect, useRef } from 'react';
import Draggable, { DraggableEventHandler } from 'react-draggable';
import { Button } from 'antd';
import { Node, Edge } from 'reactflow';
import { useImageStore } from '../store/imageStore';

interface DebugPanelProps {
  logs: string[];
  nodes: Node[];
  edges: Edge[];
}

const DebugPanel = ({ logs, nodes, edges }: DebugPanelProps) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const { images, getConnectedNodeImage } = useImageStore();

  useEffect(() => {
    // 初始化面板位置到右下角
    if (panelRef.current) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = panelRef.current;
      setPosition({
        x: innerWidth - offsetWidth - 20,
        y: innerHeight - offsetHeight - 20,
      });
    }
  }, []);

  const handleDragStop: DraggableEventHandler = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

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
      position={position}
      onStop={handleDragStop}
      bounds="parent"
      handle=".debug-panel-header"
    >
      <div
        ref={panelRef}
        className={`fixed bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-200 ${
          isMinimized ? 'w-48' : 'w-96'
        }`}
        style={{ zIndex: 1000 }}
      >
        <div className="debug-panel-header bg-gray-800 text-white px-4 py-2 cursor-move flex justify-between items-center">
          <span>调试面板</span>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:text-gray-300 focus:outline-none"
          >
            {isMinimized ? '展开' : '收起'}
          </button>
        </div>
        {!isMinimized && (
          <div className="p-4 max-h-96 overflow-y-auto">
            <Button onClick={debugFlow} type="primary" block className="mb-4">
              调试数据流
            </Button>
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center">暂无日志</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="mb-2 p-2 bg-gray-50 rounded text-sm font-mono whitespace-pre-wrap"
                >
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default DebugPanel; 