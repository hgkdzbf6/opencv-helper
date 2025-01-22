import { Node, Edge } from 'reactflow';
import { useImageStore } from '../store/imageStore';
import { UploadOutlined, CodeOutlined } from '@ant-design/icons';
import { Button, Upload, Card, Slider, Switch, Modal, Tabs, message, Select, InputNumber } from 'antd';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { processImage } from '../utils/imageProcessing';
import { generateCode } from '../utils/codeGenerator';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
}

const ProcessControls = ({ nodeId, type }: { nodeId: string; type: string }) => {
  const setNodeParams = useImageStore((state) => state.setNodeParams);
  const nodeParams = useImageStore((state) => state.getNodeParams(nodeId));

  const onParamChange = (paramName: string, value: any) => {
    const currentParams = nodeParams?.[type] || {};
    setNodeParams(nodeId, { [type]: { ...currentParams, [paramName]: value } });
  };

  const renderSlider = (
    label: string,
    paramName: string,
    min: number,
    max: number,
    step: number = 1,
    defaultValue: number
  ) => (
    <div className="mb-4">
      <div className="font-medium mb-2">{label}</div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={nodeParams?.[type]?.[paramName] ?? defaultValue}
        onChange={(value) => onParamChange(paramName, value)}
      />
    </div>
  );

  const renderSelect = (
    label: string,
    paramName: string,
    options: { value: string; label: string }[],
    defaultValue: string
  ) => (
    <div className="mb-4">
      <div className="font-medium mb-2">{label}</div>
      <Select
        style={{ width: '100%' }}
        value={nodeParams?.[type]?.[paramName] ?? defaultValue}
        onChange={(value) => onParamChange(paramName, value)}
        options={options}
      />
    </div>
  );

  const renderSwitch = (
    label: string,
    paramName: string,
    defaultValue: boolean
  ) => (
    <div className="mb-4 flex justify-between items-center">
      <span>{label}</span>
      <Switch
        checked={nodeParams?.[type]?.[paramName] ?? defaultValue}
        onChange={(checked) => onParamChange(paramName, checked)}
      />
    </div>
  );

  const renderColorPicker = (
    label: string,
    paramName: string,
    defaultValue: [number, number, number]
  ) => (
    <div className="mb-4">
      <div className="font-medium mb-2">{label}</div>
      <div className="flex gap-2">
        {['R', 'G', 'B'].map((channel, index) => (
          <div key={channel} className="flex-1">
            <div className="text-xs text-gray-500 mb-1">{channel}</div>
            <InputNumber
              min={0}
              max={255}
              value={nodeParams?.[type]?.[paramName]?.[index] ?? defaultValue[index]}
              onChange={(value) => {
                const currentColor = [...(nodeParams?.[type]?.[paramName] ?? defaultValue)];
                currentColor[index] = value ?? defaultValue[index];
                onParamChange(paramName, currentColor);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  switch (type) {
    case 'binary':
      return (
        <div className="mt-4">
          {renderSlider('阈值', 'threshold', 0, 255, 1, 128)}
          {renderSlider('最大值', 'maxValue', 0, 255, 1, 255)}
          {renderSelect('二值化方法', 'method', [
            { value: 'THRESH_BINARY', label: '二值化' },
            { value: 'THRESH_BINARY_INV', label: '反二值化' },
            { value: 'THRESH_TRUNC', label: '截断' },
            { value: 'THRESH_TOZERO', label: '阈值化为零' },
            { value: 'THRESH_TOZERO_INV', label: '反阈值化为零' },
          ], 'THRESH_BINARY')}
          {renderSwitch('使用 Otsu 算法', 'useOtsu', false)}
        </div>
      );

    case 'blur':
      return (
        <div className="mt-4">
          {renderSlider('核大小', 'kernelSize', 3, 25, 2, 5)}
          {renderSlider('X方向标准差', 'sigmaX', 0, 10, 0.1, 0)}
          {renderSlider('Y方向标准差', 'sigmaY', 0, 10, 0.1, 0)}
          {renderSelect('边界类型', 'borderType', [
            { value: 'BORDER_DEFAULT', label: '默认' },
            { value: 'BORDER_CONSTANT', label: '常数' },
            { value: 'BORDER_REPLICATE', label: '复制' },
          ], 'BORDER_DEFAULT')}
        </div>
      );

    case 'erode':
    case 'dilate':
      return (
        <div className="mt-4">
          {renderSlider('核大小', 'kernelSize', 3, 25, 2, 3)}
          {renderSlider('迭代次数', 'iterations', 1, 10, 1, 1)}
          {renderSelect('核形状', 'kernelShape', [
            { value: 'MORPH_RECT', label: '矩形' },
            { value: 'MORPH_CROSS', label: '十字形' },
            { value: 'MORPH_ELLIPSE', label: '椭圆形' },
          ], 'MORPH_RECT')}
          {renderSlider('锚点 X', 'anchor.x', -1, 1, 1, -1)}
          {renderSlider('锚点 Y', 'anchor.y', -1, 1, 1, -1)}
        </div>
      );

    case 'edge':
      return (
        <div className="mt-4">
          {renderSlider('阈值1', 'threshold1', 0, 255, 1, 100)}
          {renderSlider('阈值2', 'threshold2', 0, 255, 1, 200)}
          {renderSelect('孔径大小', 'apertureSize', [
            { value: '3', label: '3x3' },
            { value: '5', label: '5x5' },
            { value: '7', label: '7x7' },
          ], '3')}
          {renderSwitch('使用 L2 梯度', 'l2gradient', false)}
        </div>
      );

    case 'mask':
    case 'invert-mask':
      return (
        <div className="mt-4">
          {renderSlider('阈值', 'threshold', 0, 255, 1, 128)}
          {renderSlider('最大值', 'maxValue', 0, 255, 1, 255)}
          {renderSelect('方法', 'method', [
            { value: 'THRESH_BINARY', label: '二值化' },
            { value: 'THRESH_BINARY_INV', label: '反二值化' },
          ], 'THRESH_BINARY')}
          {renderSlider('混合透明度', 'blendAlpha', 0, 1, 0.1, 0.5)}
        </div>
      );

    case 'draw-rect':
    case 'draw-circle':
      const isRect = type === 'draw-rect';
      return (
        <div className="mt-4">
          {renderSlider('X 坐标', 'x', 0, 1000, 1, isRect ? 0 : 50)}
          {renderSlider('Y 坐标', 'y', 0, 1000, 1, isRect ? 0 : 50)}
          {isRect ? (
            <>
              {renderSlider('宽度', 'width', 0, 1000, 1, 100)}
              {renderSlider('高度', 'height', 0, 1000, 1, 100)}
            </>
          ) : (
            renderSlider('半径', 'radius', 0, 500, 1, 25)
          )}
          {renderColorPicker('颜色', 'color', isRect ? [255, 0, 0] : [0, 255, 0])}
          {renderSlider('线条粗细', 'thickness', 1, 20, 1, 2)}
          {renderSelect('线条类型', 'lineType', [
            { value: 'LINE_4', label: '4连通' },
            { value: 'LINE_8', label: '8连通' },
            { value: 'LINE_AA', label: '抗锯齿' },
          ], 'LINE_8')}
          {renderSwitch('填充', 'filled', false)}
        </div>
      );

    case 'draw-line':
      return (
        <div className="mt-4">
          {renderSlider('起点 X', 'x1', 0, 1000, 1, 0)}
          {renderSlider('起点 Y', 'y1', 0, 1000, 1, 0)}
          {renderSlider('终点 X', 'x2', 0, 1000, 1, 100)}
          {renderSlider('终点 Y', 'y2', 0, 1000, 1, 100)}
          {renderColorPicker('颜色', 'color', [0, 0, 255])}
          {renderSlider('线条粗细', 'thickness', 1, 20, 1, 2)}
          {renderSelect('线条类型', 'lineType', [
            { value: 'LINE_4', label: '4连通' },
            { value: 'LINE_8', label: '8连通' },
            { value: 'LINE_AA', label: '抗锯齿' },
          ], 'LINE_8')}
        </div>
      );

    default:
      return null;
  }
};

const CodeGeneratorPanel = ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
  const [code, setCode] = useState<string>('');
  const nodeParams = useImageStore((state) => state.nodeParams);

  // 使用 useCallback 来缓存函数
  const generateAndShowCode = useCallback((language: 'python' | 'cpp') => {
    try {
      const generatedCode = generateCode({ language, nodes, edges, nodeParams });
      setCode(generatedCode);
    } catch (error) {
      message.error('生成代码失败: ' + (error as Error).message);
    }
  }, [nodes, edges, nodeParams]);

  return (
    <div className="mt-4">
      <div className="flex gap-2 mb-4">
        <Button 
          icon={<CodeOutlined />} 
          onClick={() => generateAndShowCode('python')}
        >
          生成 Python 代码
        </Button>
        <Button 
          icon={<CodeOutlined />} 
          onClick={() => generateAndShowCode('cpp')}
        >
          生成 C++ 代码
        </Button>
      </div>
      {code && (
        <div className="bg-gray-50 p-4 rounded">
          <pre className="whitespace-pre-wrap text-sm">
            {code}
          </pre>
        </div>
      )}
    </div>
  );
};

const PropertiesPanel = ({ selectedNode, nodes, edges }: PropertiesPanelProps) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const setImage = useImageStore((state) => state.setImage);
  const getConnectedImage = useImageStore((state) => state.getConnectedNodeImage);
  const toggleNodesPreview = useImageStore((state) => state.toggleNodesPreview);
  const showNodesPreview = useImageStore((state) => state.showNodesPreview);
  const nodeParams = useImageStore((state) => state.nodeParams);

  // 使用 useMemo 缓存图片获取结果
  const image = useMemo(() => {
    if (!selectedNode) return undefined;
    return selectedNode.type === 'output'
      ? getConnectedImage(selectedNode.data.id)
      : useImageStore.getState().getImage(selectedNode.data.id);
  }, [selectedNode, getConnectedImage]);

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
          {edges.length > 0 && <CodeGeneratorPanel nodes={nodes} edges={edges} />}
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
        <div 
          className="w-full h-[200px] bg-gray-50 rounded flex items-center justify-center overflow-hidden"
          onClick={() => image && setPreviewVisible(true)}
          style={{ cursor: image ? 'pointer' : 'default' }}
        >
          {image ? (
            <img src={image} alt="预览" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-gray-400 text-center">
              <div className="mb-1">暂无图片</div>
              {selectedNode?.type === 'input' && 
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

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ maxWidth: '1200px' }}
        bodyStyle={{ padding: 0 }}
      >
        <div className="w-full h-[80vh] bg-gray-50 flex items-center justify-center">
          {image && (
            <img 
              src={image} 
              alt="大图预览" 
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PropertiesPanel; 