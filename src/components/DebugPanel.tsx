import { Button, Card } from 'antd';
import { useImageStore } from '../store/imageStore';

interface DebugPanelProps {
  nodes: any[];
  edges: any[];
}

const DebugPanel = ({ nodes, edges }: DebugPanelProps) => {
  const { images, getConnectedNodeImage } = useImageStore();

  const debugFlow = () => {
    console.group('调试信息');
    console.log('节点列表:', nodes);
    console.log('连接列表:', edges);
    console.log('图片存储:', images);

    // 遍历所有节点，检查其连接和图片状态
    nodes.forEach(node => {
      console.group(`节点 ${node.id} (${node.type})`);
      console.log('节点数据:', node.data);
      console.log('当前图片:', images[node.data.id]);
      console.log('连接的上游图片:', getConnectedNodeImage(node.data.id));
      console.groupEnd();
    });

    // 遍历所有连接
    edges.forEach(edge => {
      console.group(`连接 ${edge.source} -> ${edge.target}`);
      console.log('源节点图片:', images[edge.source]);
      console.log('目标节点图片:', images[edge.target]);
      console.groupEnd();
    });

    console.groupEnd();
  };

  return (
    <Card 
      title="调试面板" 
      size="small" 
      style={{ position: 'fixed', bottom: 20, right: 20, width: 200 }}
    >
      <Button onClick={debugFlow} type="primary" block>
        调试数据流
      </Button>
      <div className="mt-2 text-xs text-gray-500">
        点击按钮在控制台查看详细信息
      </div>
    </Card>
  );
};

export default DebugPanel; 