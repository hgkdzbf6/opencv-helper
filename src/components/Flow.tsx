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
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button, Upload, message, Modal, Radio, Space } from 'antd';
import { SaveOutlined, UploadOutlined } from '@ant-design/icons';
import InputNode from './nodes/InputNode';
import OutputNode from './nodes/OutputNode';
import ProcessNode from './nodes/ProcessNode';
import PropertiesPanel from './PropertiesPanel';
import NodeSelector from './NodeSelector';
import DebugPanel from './DebugPanel';
import ResizablePanel from './ResizablePanel';
import { useImageStore } from '../store/imageStore';
import { saveFlow, SaveOption, loadFlow } from '../utils/flowUtils';

const nodeTypes = {
  'input': InputNode,
  'process': ProcessNode,
  'output': OutputNode,
  'draw-rect': ProcessNode,
  'draw-circle': ProcessNode,
  'draw-line': ProcessNode,
  'binary': ProcessNode,
  'blur': ProcessNode,
  'erode': ProcessNode,
  'dilate': ProcessNode,
  'edge': ProcessNode,
  'mask': ProcessNode,
  'invert-mask': ProcessNode,
  'blank': InputNode
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

// 添加选择样式
const edgeStyles = {
  selected: {
    stroke: '#2196f3',
    strokeWidth: 3,
  },
};

const nodeStyles = {
  selected: {
    borderColor: '#2196f3',
    boxShadow: '0 0 0 2px #2196f3',
  },
};

const Flow = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const setStoreEdges = useImageStore((state) => state.setEdges);
  const setImage = useImageStore((state) => state.setImage);
  const setNodeParams = useImageStore((state) => state.setNodeParams);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveOption, setSaveOption] = useState<SaveOption>('all');

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      const selectedChange = changes.find((change) => change.type === 'select');
      if (selectedChange) {
        const node = nodes.find((n) => n.id === selectedChange.id);
        setSelectedNode(selectedChange.selected ? node || null : null);
      }
    },
    [nodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const onConnect = useCallback((connection: Connection) => {
    const newEdges = addEdge(connection, edges);
    setEdges(newEdges);
    setStoreEdges(newEdges);
  }, [edges, setStoreEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

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
        data: {
          id: nodeId,
          label: node.label,
          processType: node.type,
          type: node.type
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance],
  );

  const onNodeAdd = useCallback((type: string, position: { x: number; y: number }, data?: any) => {
    console.log('data', data);
    const nodeId = getId();
    const newNode = {
      id: nodeId,
      type: type,
      position,
      data: {
        id: nodeId,
        label: data?.label || type,
        type: data?.type
      }
    };

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const showSaveModal = () => {
    if (nodes.length === 0) {
      message.warning('流程图为空');
      return;
    }
    setSaveModalVisible(true);
  };

  const handleSave = () => {
    saveFlow(nodes, edges, saveOption);
    setSaveModalVisible(false);
    message.success('保存成功');
  };

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

  const addLog = useCallback((message: string) => {
    setLogs((prevLogs) => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  return (
    <div className="w-screen h-screen flex">
      <ResizablePanel
        width={200}
        minWidth={150}
        maxWidth={300}
        position="left"
      >
        <NodeSelector onNodeAdd={onNodeAdd} />
      </ResizablePanel>

      <div className="flex-1 h-full">
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
          className="[&_.selected]:!border-blue-500 [&_.selected]:!shadow-[0_0_0_2px_#3b82f6] [&_.selected]:!stroke-blue-500 [&_.selected]:!stroke-[3px]"
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
          <Panel position="top-right" className="bg-white p-2 rounded shadow-lg">
            <div className="flex gap-2">
              <Button 
                icon={<SaveOutlined />} 
                onClick={showSaveModal}
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

      <ResizablePanel
        width={300}
        minWidth={200}
        maxWidth={500}
        position="right"
      >
        <PropertiesPanel
          selectedNode={selectedNode}
          nodes={nodes}
          edges={edges}
          onNodeAdd={onNodeAdd}
        />
      </ResizablePanel>

      <DebugPanel logs={logs} nodes={nodes} edges={edges} />

      <Modal
        title="保存选项"
        open={saveModalVisible}
        onOk={handleSave}
        onCancel={() => setSaveModalVisible(false)}
      >
        <Space direction="vertical">
          <div>选择要保存的图片：</div>
          <Radio.Group value={saveOption} onChange={e => setSaveOption(e.target.value)}>
            <Space direction="vertical">
              <Radio value="all">保存所有图片</Radio>
              <Radio value="input-only">仅保存输入图片</Radio>
              <Radio value="none">不保存图片</Radio>
            </Space>
          </Radio.Group>
        </Space>
      </Modal>
    </div>
  );
};

export default Flow; 