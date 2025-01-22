import { Node, Edge } from 'reactflow';
import { useImageStore } from '../store/imageStore';

interface FlowData {
  nodes: Node[];
  edges: Edge[];
  images: Record<string, string>;
  nodeParams: Record<string, any>;
}

export const saveFlow = (nodes: Node[], edges: Edge[]) => {
  const store = useImageStore.getState();
  const flowData: FlowData = {
    nodes,
    edges,
    images: store.images,
    nodeParams: store.nodeParams,
  };

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