import React, { useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import NodeSelector from './NodeSelector';
import { useDataStore } from '../store/imageStore';

interface FlowEditorProps {
  // 如果需要的话可以添加props
}

const FlowEditor: React.FC<FlowEditorProps> = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const setStoreEdges = useDataStore((state) => state.setEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      setStoreEdges(newEdges);
    },
    [edges, setEdges, setStoreEdges]
  );

  const handleSaveFlow = useCallback(() => {
    const flow = {
      nodes,
      edges
    };
    const json = JSON.stringify(flow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flow.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleLoadFlow = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const flow = JSON.parse(e.target?.result as string);
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
            setStoreEdges(flow.edges || []);
          } catch (error) {
            console.error('加载流程失败:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [setNodes, setEdges, setStoreEdges]);

  const onNodeAdd = useCallback((nodeData: any) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: nodeData.type,
      position: { x: 100, y: 100 },
      data: {
        ...nodeData,
        id: `node_${Date.now()}`
      }
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  return (
    <div className="w-full h-screen bg-gray-50 relative">
      {/* 工具栏 */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 bg-white p-2 rounded shadow-lg cursor-move">
        <button
          onClick={handleSaveFlow}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          保存流程
        </button>
        <button
          onClick={handleLoadFlow}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          加载流程
        </button>
      </div>

      {/* 节点选择器 */}
      <NodeSelector onNodeAdd={onNodeAdd} />

      {/* 流程图编辑器 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default FlowEditor; 