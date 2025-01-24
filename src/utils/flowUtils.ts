import { Node, Edge } from 'reactflow';
import { useDataStore } from '../store/imageStore';

interface FlowData {
  nodes: Node[];
  edges: Edge[];
  data_dict: Record<string, any>;
  nodeParams: Record<string, any>;
}

export type SaveOption = 'all' | 'input-only' | 'none';

export const saveFlow = (nodes: Node[], edges: Edge[], saveOption: SaveOption = 'all') => {
  const store = useDataStore.getState();
  const flowData: FlowData = {
    nodes,
    edges,
    data_dict: {},
    nodeParams: store.nodeParams,
  };

  // 根据保存选项处理图片
  if (saveOption === 'all') {
    flowData.data_dict = store.data_dict;
  } else if (saveOption === 'input-only') {
    // 只保存输入节点的图片
    nodes.forEach(node => {
      if (node.type === 'input') {
        const data = store.data_dict[node.id];
        if (data) {
          flowData.data_dict[node.id] = data;
        }
      }
    });
  }

  const dataStr = JSON.stringify(flowData);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  
  // 创建下载链接
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `flow-${new Date().toISOString().slice(0, 19)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const loadFlow = async (file: File): Promise<FlowData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const flowData: FlowData = JSON.parse(event.target?.result as string);
        resolve(flowData);
      } catch (error) {
        reject(new Error('无效的流程图文件'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}; 