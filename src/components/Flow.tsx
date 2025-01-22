import { useCallback, useState, DragEvent } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  NodeTypes,
  Node,
  ReactFlowInstance,
  EdgeChange,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Upload, message } from 'antd';
import { SaveOutlined, UploadOutlined } from '@ant-design/icons';
import InputNode from './nodes/InputNode';
import OutputNode from './nodes/OutputNode';
import ProcessNode from './nodes/ProcessNode';
import PropertiesPanel from './PropertiesPanel';
import NodeSelector from './NodeSelector';
import DebugPanel from './DebugPanel';
import { useImageStore } from '../store/imageStore';
import { saveFlow, loadFlow } from '../utils/flowUtils';

const nodeTypes: NodeTypes = {
  input: InputNode,
  output: OutputNode,
  process: ProcessNode,
};

let id = 1; // 从1开始编号
const getId = () => {
  const newId = `${id}`;
  id += 1;
  return newId;
};

// 默认的边样式
const defaultEdgeOptions = {
  animated: false,
  style: {
    stroke: '#374151',
    strokeWidth: 2,
  },
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#374151',
  },
};

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, _onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const setStoreEdges = useImageStore((state) => state.setEdges);
  const setImage = useImageStore((state) => state.setImage);
  const setNodeParams = useImageStore((state) => state.setNodeParams);

  // 更新节点样式
  const updateNodeStyles = useCallback((nodes: Node[], selectedId: string | null) => {
    return nodes.map(node => ({
      ...node,
      className: node.id === selectedId ? 'border-2 border-blue-500' : '',
    }));
  }, []);

  // 更新边的样式
  const updateEdgeStyles = useCallback((edges: Edge[], selectedId: string | null) => {
    return edges.map(edge => ({
      ...edge,
      style: {
        ...defaultEdgeOptions.style,
        stroke: edge.id === selectedId ? '#3b82f6' : '#374151',
        strokeWidth: edge.id === selectedId ? 3 : 2,
      },
      markerEnd: {
        ...defaultEdgeOptions.markerEnd,
        color: edge.id === selectedId ? '#3b82f6' : '#374151',
      },
    }));
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // 检查连接规则
      const sourceNode = nodes.find(node => node.id === params.source);
      const targetNode = nodes.find(node => node.id === params.target);

      if (!sourceNode || !targetNode) return;

      // 输入节点不能有输入连接
      if (targetNode.type === 'input') return;
      // 输出节点不能有输出连接
      if (sourceNode.type === 'output') return;
      // 防止重复连接
      if (edges.some(edge => 
        edge.source === params.source && edge.target === params.target
      )) return;
      // 每个节点只能有一个输入连接
      if (edges.some(edge => edge.target === params.target)) return;

      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      // 立即更新 store 中的边
      setStoreEdges(newEdges);

      // 调试信息
      console.group('新建连接');
      console.log('源节点:', sourceNode);
      console.log('目标节点:', targetNode);
      console.log('新边:', newEdges);
      console.groupEnd();
    },
    [edges, nodes, setEdges, setStoreEdges],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      _onEdgesChange(changes);
      // 在下一个事件循环中更新 store，确保边的状态已经更新
      setTimeout(() => {
        setStoreEdges(edges);
        // 调试信息
        console.group('边更新');
        console.log('变更:', changes);
        console.log('当前边:', edges);
        console.groupEnd();
      }, 0);
    },
    [edges, _onEdgesChange, setStoreEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodes(nodes => updateNodeStyles(nodes, node.id));
  }, [updateNodeStyles]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setEdges(edges => updateEdgeStyles(edges, edge.id));
  }, [updateEdgeStyles]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setNodes(nodes => updateNodeStyles(nodes, null));
    setEdges(edges => updateEdgeStyles(edges, null));
  }, [updateNodeStyles, updateEdgeStyles]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const nodeData = event.dataTransfer.getData('application/reactflow');
      if (!nodeData) return;

      const node = JSON.parse(nodeData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = getId();
      const newNode = {
        id: nodeId,
        type: node.type,
        position,
        data: node.type === 'process' 
          ? { id: nodeId, type: node.processType, label: node.label }
          : { id: nodeId },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
  );

  const onNodeAdd = useCallback(
    (type: string, position: { x: number; y: number }, data?: any) => {
      const nodeId = getId();
      const newNode = {
        id: nodeId,
        type,
        position,
        data: data || { id: nodeId },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [],
  );

  const onSave = useCallback(() => {
    if (nodes.length === 0) {
      message.warning('流程图为空');
      return;
    }
    saveFlow(nodes, edges);
    message.success('保存成功');
  }, [nodes, edges]);

  const onLoad = useCallback(async (file: File) => {
    try {
      const flowData = await loadFlow(file);
      
      // 重置 ID 计数器
      id = Math.max(...flowData.nodes.map(node => parseInt(node.id))) + 1;
      
      // 更新节点和边
      setNodes(flowData.nodes);
      setEdges(flowData.edges);
      setStoreEdges(flowData.edges);

      // 恢复图片和参数
      Object.entries(flowData.images).forEach(([nodeId, imageData]) => {
        setImage(nodeId, imageData);
      });
      Object.entries(flowData.nodeParams).forEach(([nodeId, params]) => {
        setNodeParams(nodeId, params);
      });

      message.success('加载成功');
    } catch (error) {
      message.error('加载失败: ' + (error as Error).message);
    }
  }, [setNodes, setEdges, setStoreEdges, setImage, setNodeParams]);

  return (
    <div className="w-full h-full flex">
      <NodeSelector onNodeAdd={onNodeAdd} />
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
          <Panel position="top-right" className="bg-white p-2 rounded shadow-lg">
            <div className="flex gap-2">
              <Button 
                icon={<SaveOutlined />} 
                onClick={onSave}
                type="primary"
              >
                保存流程
              </Button>
              <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={(file) => {
                  onLoad(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>
                  加载流程
                </Button>
              </Upload>
            </div>
          </Panel>
        </ReactFlow>
      </div>
      <PropertiesPanel selectedNode={selectedNode} />
      <DebugPanel nodes={nodes} edges={edges} />
    </div>
  );
};

export default Flow; 