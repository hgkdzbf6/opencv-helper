import { Node } from 'reactflow';
import { useImageStore } from '../store/imageStore';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload, Card, Slider, Switch } from 'antd';
import { useState, useEffect } from 'react';
import { processImage } from '../utils/imageProcessing';

interface PropertiesPanelProps {
  selectedNode: Node | null;
}

const ProcessControls = ({ nodeId, type }: { nodeId: string; type: string }) => {
  const setNodeParams = useImageStore((state) => state.setNodeParams);
  const nodeParams = useImageStore((state) => state.getNodeParams(nodeId));

  const onParamChange = (value: number) => {
    if (type === 'binary') {
      setNodeParams(nodeId, { binary: { threshold: value } });
    } else if (type === 'blur') {
      setNodeParams(nodeId, { blur: { kernelSize: value } });
    }
  };

  const currentValue = type === 'binary'
    ? nodeParams?.binary?.threshold || 128
    : nodeParams?.blur?.kernelSize || 5;

  if (type === 'binary') {
    return (
      <div className="mt-4">
        <div className="font-medium mb-2">阈值</div>
        <Slider
          min={0}
          max={255}
          value={currentValue}
          onChange={onParamChange}
        />
      </div>
    );
  }

  if (type === 'blur') {
    return (
      <div className="mt-4">
        <div className="font-medium mb-2">模糊程度</div>
        <Slider
          min={3}
          max={25}
          step={2}
          value={currentValue}
          onChange={onParamChange}
        />
      </div>
    );
  }

  return null;
};

const PropertiesPanel = ({ selectedNode }: PropertiesPanelProps) => {
  const setImage = useImageStore((state) => state.setImage);
  const getConnectedImage = useImageStore((state) => state.getConnectedNodeImage);
  const toggleNodesPreview = useImageStore((state) => state.toggleNodesPreview);
  const showNodesPreview = useImageStore((state) => state.showNodesPreview);
  const image = useImageStore((state) => 
    selectedNode?.type === 'output' 
      ? getConnectedNodeImage(selectedNode.data.id, true)
      : selectedNode 
        ? state.getImage(selectedNode.data.id, true) 
        : undefined
  );

  if (!selectedNode) {
    return (
      <div className="w-[300px] bg-white border-l border-gray-200 p-4">
        <div className="text-gray-400 text-center mt-8">
          <div className="text-xl mb-2">👈 请选择一个节点</div>
          <div className="text-sm">点击左侧节点查看详情</div>
        </div>
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <span>显示节点预览</span>
            <Switch checked={showNodesPreview} onChange={toggleNodesPreview} />
          </div>
        </div>
      </div>
    );
  }

  const getNodeTitle = () => {
    switch (selectedNode.type) {
      case 'input':
        return '📥 输入节点';
      case 'output':
        return '📤 输出节点';
      case 'process':
        return selectedNode.data.label;
      default:
        return '节点';
    }
  };

  return (
    <div className="w-[300px] bg-white border-l border-gray-200 p-4">
      <div className="mb-4">
        <div className="text-xl font-bold">{getNodeTitle()}</div>
        <div className="text-sm text-gray-500">
          节点 ID: {selectedNode.data.id}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span>显示节点预览</span>
          <Switch checked={showNodesPreview} onChange={toggleNodesPreview} />
        </div>
      </div>

      <Card title="图片预览" className="mb-4" size="small">
        <div className="w-full h-[200px] bg-gray-50 rounded flex items-center justify-center overflow-hidden">
          {image ? (
            <img src={image} alt="预览" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-gray-400 text-center">
              <div className="mb-1">暂无图片</div>
              {selectedNode.type === 'input' && 
                <div className="text-xs">请点击下方按钮上传</div>
              }
            </div>
          )}
        </div>
      </Card>

      {selectedNode.type === 'input' && (
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={(file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                setImage(selectedNode.data.id, reader.result);
              }
            };
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} type="primary" block>
            选择图片
          </Button>
        </Upload>
      )}

      {selectedNode.type === 'process' && (
        <ProcessControls 
          nodeId={selectedNode.data.id} 
          type={selectedNode.data.type} 
        />
      )}
    </div>
  );
};

export default PropertiesPanel; 