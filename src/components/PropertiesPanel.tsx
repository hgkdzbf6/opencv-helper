import { Node, Edge } from 'reactflow';
import { useDataStore } from '../store/imageStore';
import { UploadOutlined, CodeOutlined } from '@ant-design/icons';
import { Button, Upload, Card, Slider, Switch, Modal, Tabs, message, Select, InputNumber, Radio } from 'antd';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { generateCode } from '../utils/codeGenerator';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  onNodeAdd: (type: string, position: { x: number; y: number }, data?: any) => void;
}

type ThresholdMethod = 'THRESH_BINARY' | 'THRESH_BINARY_INV' | 'THRESH_TRUNC' | 'THRESH_TOZERO' | 'THRESH_TOZERO_INV';
type BorderType = 'BORDER_DEFAULT' | 'BORDER_CONSTANT' | 'BORDER_REPLICATE';
type KernelShape = 'MORPH_RECT' | 'MORPH_CROSS' | 'MORPH_ELLIPSE';
type LineType = 'LINE_4' | 'LINE_8' | 'LINE_AA';
type ContourMode = 'RETR_EXTERNAL' | 'RETR_LIST' | 'RETR_CCOMP' | 'RETR_TREE';
type ContourMethod = 'CHAIN_APPROX_NONE' | 'CHAIN_APPROX_SIMPLE' | 'CHAIN_APPROX_TC89_L1' | 'CHAIN_APPROX_TC89_KCOS';

interface NodeTypeParams {
  threshold?: number;
  maxValue?: number;
  method?: ThresholdMethod;
  useOtsu?: boolean;
  kernelSize?: number;
  sigmaX?: number;
  sigmaY?: number;
  borderType?: BorderType;
  iterations?: number;
  kernelShape?: KernelShape;
  anchorX?: number;
  anchorY?: number;
  threshold1?: number;
  threshold2?: number;
  apertureSize?: number;
  l2gradient?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  color?: [number, number, number];
  thickness?: number;
  lineType?: LineType;
  filled?: boolean;
  opacity?: number;
  ratio?: number;
  isGrayscale?: boolean;
  mode?: ContourMode;
  contourMethod?: ContourMethod;
  minArea?: number;
  maxArea?: number;
}

interface NodeParams {
  [key: string]: NodeTypeParams;
}

type ParamKey = keyof NodeTypeParams;

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface DrawingCanvasProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (params: DrawingParams) => void;
  type: string;
  initialImage?: string;
}

interface DrawingParams {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radiusX?: number;
  radiusY?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

const DrawingCanvas = ({ visible, onClose, onComplete, type, initialImage }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (visible && canvasRef.current && initialImage) {
      const ctx = canvasRef.current.getContext('2d');
      const img = new Image();
      img.onload = () => {
        if (ctx && canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = initialImage;
    }
  }, [visible, initialImage]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPoint({ x, y });

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // 清除上一次的预览
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (initialImage) {
      const img = new Image();
      img.src = initialImage;
      ctx.drawImage(img, 0, 0);
    }

    // 绘制预览
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (type === 'draw-rect') {
      const width = currentPoint.x - startPoint.x;
      const height = currentPoint.y - startPoint.y;
      ctx.rect(startPoint.x, startPoint.y, width, height);
    } else if (type === 'draw-circle') {
      const rx = Math.abs(currentPoint.x - startPoint.x);
      const ry = Math.abs(currentPoint.y - startPoint.y);
      ctx.ellipse(
        startPoint.x,
        startPoint.y,
        rx,
        ry,
        0,
        0,
        2 * Math.PI
      );
    } else if (type === 'draw-line') {
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
    }

    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // 计算参数
    let params: DrawingParams = {};
    
    if (type === 'draw-rect') {
      params = {
        x: Math.min(startPoint.x, currentPoint.x),
        y: Math.min(startPoint.y, currentPoint.y),
        width: Math.abs(currentPoint.x - startPoint.x),
        height: Math.abs(currentPoint.y - startPoint.y)
      };
    } else if (type === 'draw-circle') {
      params = {
        x: startPoint.x,
        y: startPoint.y,
        radiusX: Math.abs(currentPoint.x - startPoint.x),
        radiusY: Math.abs(currentPoint.y - startPoint.y)
      };
    } else if (type === 'draw-line') {
      params = {
        x1: startPoint.x,
        y1: startPoint.y,
        x2: currentPoint.x,
        y2: currentPoint.y
      };
    }

    onComplete(params);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width="80%"
      footer={null}
      title="绘制图形"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ border: '1px solid #d9d9d9', cursor: 'crosshair' }}
      />
    </Modal>
  );
};

const ProcessControls = ({ nodeId, type }: { nodeId: string; type: string }) => {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const setNodeParams = useDataStore((state) => state.setNodeParams);
  const nodeParams = useDataStore((state) => state.getNodeParams(nodeId));
  const inputImage = useDataStore((state) => state.getConnectedNodeSourceData(nodeId, true));
  const currentParams = (nodeParams?.[type] || {}) as NodeTypeParams;


  const handleDrawingComplete = (params: DrawingParams) => {
    setIsDrawingMode(false);
    if (type === 'draw-circle') {
      const { x, y, radiusX, radiusY } = params;
      const radius = Math.max(radiusX || 0, radiusY || 0);
      setNodeParams(nodeId, { [type]: { ...currentParams, x, y, radius } });
    } else {
      setNodeParams(nodeId, { [type]: { ...currentParams, ...params } });
    }
  };

  const onParamChange = (key: ParamKey, value: any) => {
    console.log('Parameter change:', key, value); // 添加日志
    setNodeParams(nodeId, { [type]: { ...currentParams, [key]: value } });
  };

  const renderSlider = (label: string, key: ParamKey, min: number, max: number, step: number, defaultValue: number) => (
    <div className="mb-4">
      <div className="mb-2">{label}</div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={(currentParams[key] as number) ?? defaultValue}
        onChange={(value) => onParamChange(key, value)}
      />
    </div>
  );

  const renderSelect = <T extends  ThresholdMethod | BorderType | KernelShape | LineType | ContourMethod | ContourMode>(
    label: string,
    key: ParamKey,
    options: SelectOption<T>[],
    defaultValue: T
  ) => (
    <div className="mb-4">
      <div className="mb-2">{label}</div>
      <Select
        value={(currentParams[key] as T) ?? defaultValue}
        onChange={(value: T) => onParamChange(key, value)}
        style={{ width: '100%' }}
      >
        {options.map(option => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </div>
  );

  const renderSwitch = (label: string, key: ParamKey, defaultValue: boolean) => (
    <div className="mb-4 flex items-center justify-between">
      <span>{label}</span>
      <Switch
        checked={(currentParams[key] as boolean) ?? defaultValue}
        onChange={(checked) => onParamChange(key, checked)}
      />
    </div>
  );

  const renderColorPicker = (label: string, key: ParamKey, defaultValue: [number, number, number]) => (
    <div className="mb-4">
      <div className="mb-2">{label}</div>
      <div className="flex gap-2">
        {['R', 'G', 'B'].map((channel, index) => (
          <div key={channel} className="flex-1">
            <div className="text-xs mb-1">{channel}</div>
            <InputNumber
              min={0}
              max={255}
              value={((currentParams[key] as [number, number, number]) ?? defaultValue)[index]}
              onChange={(value) => {
                const newColor = [...((currentParams[key] as [number, number, number]) ?? defaultValue)];
                newColor[index] = value ?? 0;
                onParamChange(key, newColor as [number, number, number]);
              }}
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderNumberInput = (label: string, key: ParamKey, min: number, max: number, defaultValue: number) => (
    <div className="mb-4">
      <div className="mb-2">{label}</div>
      <InputNumber
        min={min}
        max={max}
        value={(currentParams[key] as number) ?? defaultValue}
        onChange={(value) => onParamChange(key, value)}
        style={{ width: '100%' }}
      />
    </div>
  );

  const content = (() => {
    switch (type) {
      case 'blur':
        return (
          <div className="space-y-4">
            {renderSlider('核大小', 'kernelSize', 1, 31, 2, 5)}
            {renderSlider('X方向标准差', 'sigmaX', 0, 10, 0.1, 0)}
            {renderSlider('Y方向标准差', 'sigmaY', 0, 10, 0.1, 0)}
            {renderSelect('边界类型', 'borderType', [
              { value: 'BORDER_DEFAULT', label: '默认' },
              { value: 'BORDER_CONSTANT', label: '常量' },
              { value: 'BORDER_REPLICATE', label: '复制' },
            ], 'BORDER_DEFAULT')}
          </div>
        );

      case 'draw-rect':
      case 'draw-circle':
      case 'draw-line':
        return (
          <div className="space-y-4">
            <Button onClick={() => setIsDrawingMode(true)} block>
              重新绘制
            </Button>
            {renderColorPicker('颜色', 'color', [255, 0, 0])}
            {renderSlider('线条粗细', 'thickness', 1, 20, 1, 2)}
            {renderSelect('线条类型', 'lineType', [
              { value: 'LINE_4', label: '4连通' },
              { value: 'LINE_8', label: '8连通' },
              { value: 'LINE_AA', label: '抗锯齿' },
            ], 'LINE_8')}
            {(type === 'draw-rect' || type === 'draw-circle') && (
              renderSwitch('填充', 'filled', false)
            )}
            {isDrawingMode && (
              <DrawingCanvas
                visible={isDrawingMode}
                onClose={() => setIsDrawingMode(false)}
                onComplete={handleDrawingComplete}
                type={type}
                initialImage={inputImage?.image}
              />
            )}
          </div>
        );

      case 'binary':
        return (
          <div className="space-y-4">
            {renderSlider('阈值', 'threshold', 0, 255, 1, 128)}
            {renderSlider('最大值', 'maxValue', 0, 255, 1, 255)}
            {renderSelect('方法', 'method', [
              { value: 'THRESH_BINARY', label: '二值化' },
              { value: 'THRESH_BINARY_INV', label: '反二值化' },
              { value: 'THRESH_TRUNC', label: '截断' },
              { value: 'THRESH_TOZERO', label: '阈值化为零' },
              { value: 'THRESH_TOZERO_INV', label: '反阈值化为零' },
            ], 'THRESH_BINARY')}
            {renderSwitch('使用 Otsu 算法', 'useOtsu', false)}
          </div>
        );

      case 'erode':
      case 'dilate':
        return (
          <div className="space-y-4">
            {renderSlider('核大小', 'kernelSize', 1, 31, 2, 3)}
            {renderSlider('迭代次数', 'iterations', 1, 10, 1, 1)}
            {renderSelect('核形状', 'kernelShape', [
              { value: 'MORPH_RECT', label: '矩形' },
              { value: 'MORPH_CROSS', label: '十字形' },
              { value: 'MORPH_ELLIPSE', label: '椭圆形' },
            ], 'MORPH_RECT')}
          </div>
        );

      case 'edge':
        return (
          <div className="space-y-4">
            {renderSlider('阈值1', 'threshold1', 0, 255, 1, 100)}
            {renderSlider('阈值2', 'threshold2', 0, 255, 1, 200)}
            {renderSlider('孔径大小', 'apertureSize', 3, 7, 2, 3)}
            {renderSwitch('使用 L2 梯度', 'l2gradient', false)}
          </div>
        );

      case 'multiply':
      case 'screen':
      case 'overlay':
        return (
          <div className="space-y-4">
            {renderSlider('不透明度', 'opacity', 0, 1, 0.01, 1)}
          </div>
        );

      case 'blend':
        return (
          <div className="space-y-4">
            {renderSlider('混合比例', 'ratio', 0, 1, 0.01, 0.5)}
          </div>
        );

      case 'grayscale':
        return (
          <div>
            <div className="text-sm text-gray-500 mb-4">
              将彩色图像转换为灰度图像，不需要额外参数。
            </div>
          </div>
        );

      case 'blank':
        return (
          <div>
            <div className="text-sm text-gray-500 mb-4">
              创建纯色图像，可以选择输出彩色或灰度图像。
            </div>
            {renderNumberInput('宽度', 'width', 1, 4096, 512)}
            {renderNumberInput('高度', 'height', 1, 4096, 512)}
            {renderColorPicker('颜色', 'color', [255, 255, 255])}
            {renderSwitch('输出灰度图', 'isGrayscale', false)}
          </div>
        );

      case 'contour':
        return (
          <div>
            <div className="text-sm text-gray-500 mb-4">
              检测图像中的轮廓，输出轮廓点列表。
            </div>
            {renderSelect('检测模式', 'mode', [
              { value: 'RETR_EXTERNAL', label: '只检测外轮廓' },
              { value: 'RETR_LIST', label: '检测所有轮廓' },
              { value: 'RETR_CCOMP', label: '检测所有轮廓并建立两层结构' },
              { value: 'RETR_TREE', label: '检测所有轮廓并重建层次结构' }
            ], 'RETR_EXTERNAL')}
            {renderSelect('轮廓近似方法', 'contourMethod', [
              { value: 'CHAIN_APPROX_NONE', label: '保存所有轮廓点' },
              { value: 'CHAIN_APPROX_SIMPLE', label: '压缩水平、垂直和对角线段' },
              { value: 'CHAIN_APPROX_TC89_L1', label: 'Teh-Chin链逼近算法' },
              { value: 'CHAIN_APPROX_TC89_KCOS', label: 'Teh-Chin链逼近算法' }
            ], 'CHAIN_APPROX_SIMPLE')}
            {renderNumberInput('最小面积', 'minArea', 0, 100000, 100)}
            {renderNumberInput('最大面积', 'maxArea', 0, 100000, 10000)}
          </div>
        );

      case 'print':
        const inputData = useDataStore.getState().getConnectedNodeSourceData(nodeId, true);
        return (
          <div>
            <div className="text-sm text-gray-500 mb-4">
              打印输入数据。
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <pre className="whitespace-pre-wrap text-sm">
                {inputData ? JSON.stringify(inputData, null, 2) : '暂无数据'}
              </pre>
            </div>
          </div>
        );

      default:
        return null;
    }
  })();

  return (
    <div className="space-y-4">
      {content}
    </div>
  );
};

const CodeGeneratorPanel = ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
  const [code, setCode] = useState<string>('');
  const nodeParams = useDataStore((state) => state.nodeParams);

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

const PropertiesPanel = ({ selectedNode, nodes, edges, onNodeAdd }: PropertiesPanelProps) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [inputOrOutput, setInputOrOutput] = useState<string | object | undefined>(undefined);
  const setData = useDataStore((state) => state.setData);
  const getData = useDataStore((state) => state.getData);
  const getConnectedData = useDataStore((state) => state.getConnectedNodeSourceData);
  const toggleNodesPreview = useDataStore((state) => state.toggleNodesPreview);
  const showNodesPreview = useDataStore((state) => state.showNodesPreview);
  const nodeParams = useDataStore((state) => state.getNodeParams);
  const setNodeParams = useDataStore((state) => state.setNodeParams);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'rect' | 'circle' | 'line'>('rect');
  const [selectedBackgroundNode, setSelectedBackgroundNode] = useState<string | undefined>();

  const inputData = useMemo(() => {
    if (!selectedNode) return undefined;
    const data = getConnectedData(selectedNode.id, true);
    return data;
  }, [selectedNode, getConnectedData]);

  const outputData = useMemo(() => {
    if (!selectedNode) return undefined;
    return getData(selectedNode.id, false);
  }, [selectedNode, getData]);

  const getAvailableNodes = useMemo(() => {
    return nodes.filter(node => node.id !== selectedNode?.id && 
      (node.type === 'input' || node.type === 'process'));
  }, [nodes, selectedNode]);

  const backgroundImage = useMemo(() => {
    if (!selectedBackgroundNode) return undefined;
    return useDataStore.getState().getData(selectedBackgroundNode, true);
  }, [selectedBackgroundNode]);

  const handleDrawComplete = useCallback((params: DrawingParams) => {
    if (selectedNode?.type === 'process' && 
        (selectedNode.data.processType === 'draw-rect' || 
         selectedNode.data.processType === 'draw-circle' || 
         selectedNode.data.processType === 'draw-line')) {
      const currentParams = nodeParams(selectedNode.id)?.[selectedNode.data.processType] || {};
      
      if (selectedNode.data.processType === 'draw-circle') {
        const { x, y, radiusX, radiusY, ...rest } = params;
        const radius = Math.max(radiusX || 0, radiusY || 0);
        setNodeParams(selectedNode.id, { 
          [selectedNode.data.processType]: { 
            ...currentParams, 
            x, 
            y, 
            radius, 
            ...rest 
          } 
        });
      } else {
        setNodeParams(selectedNode.id, { 
          [selectedNode.data.processType]: { 
            ...currentParams, 
            ...params 
          } 
        });
      }
    }
    setIsDrawingMode(false);
  }, [selectedNode, nodeParams, setNodeParams]);

  const handlePreviewClick = useCallback((inputOrOutput: string) => {
    if (selectedNode?.type === 'process' && 
        (selectedNode.data.processType === 'draw-rect' || selectedNode.data.processType === 'draw-circle' || selectedNode.data.processType === 'draw-line')) {
      setIsDrawingMode(true);
    }
    setPreviewVisible(true);
    setInputOrOutput(inputOrOutput);
  }, [selectedNode]);

  const handleToolChange = (value: string) => {
    setIsDrawingMode(true);
    setDrawingTool(value as 'rect' | 'circle' | 'line');
  };

  if (!selectedNode) {
    return (
      <div className="w-[300px] bg-white border-l border-gray-200 p-4 h-screen overflow-y-auto">
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
    <div className="w-[300px] bg-white border-l border-gray-200 p-4 h-screen overflow-y-auto">
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

      <Card title="输入图片预览" className="mb-4" size="small">
        <div 
          className="w-full bg-gray-50 rounded flex items-center justify-center overflow-hidden"
          onClick={inputData ? () => handlePreviewClick("input") : undefined}
          style={{ cursor: inputData ? 'pointer' : 'default' }}
        >
          {inputData ? (
            <img 
              src={inputData.image} 
              alt="输入图像预览" 
              className="max-w-full max-h-full object-contain"
            />
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

      <Card title="输出图片预览" className="mb-4" size="small">
        <div 
          className="w-full bg-gray-50 rounded flex items-center justify-center overflow-hidden"
          onClick={outputData ? () => {
            handlePreviewClick("output");
          } : undefined}
          style={{ cursor: outputData ? 'pointer' : 'default' }}
        >
          {outputData ? (
            <img 
              src={outputData.image} 
              alt="输出图像预览" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <div className="mb-1">暂无图片</div>
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
                setData(selectedNode.data.id, { image: reader.result });
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
          type={selectedNode.data.processType} 
        />
      )}

      <Modal
        open={previewVisible}
        footer={
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {(selectedNode?.type === 'process' && 
                (selectedNode.data.processType === 'draw-rect' || 
                 selectedNode.data.processType === 'draw-circle' || 
                 selectedNode.data.processType === 'draw-line') || 
                !selectedNode) && (
                <>
                  <Radio.Group 
                    value={drawingTool}
                    onChange={e => handleToolChange(e.target.value)}
                  >
                    <Radio.Button value="rect">矩形</Radio.Button>
                    <Radio.Button value="circle">椭圆</Radio.Button>
                    <Radio.Button value="line">直线</Radio.Button>
                  </Radio.Group>
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择背景图片"
                    value={selectedBackgroundNode}
                    onChange={setSelectedBackgroundNode}
                    allowClear
                  >
                    {getAvailableNodes.map(node => (
                      <Select.Option key={node.id} value={node.id}>
                        {node.data.label} (ID: {node.id})
                      </Select.Option>
                    ))}
                  </Select>
                </>
              )}
            </div>
            <Button onClick={() => {
              setPreviewVisible(false);
              setIsDrawingMode(false);
            }}>
              关闭预览
            </Button>
          </div>
        }
        onCancel={() => {
          setPreviewVisible(false);
          setIsDrawingMode(false);
        }}
        width="80%"
        style={{ maxWidth: '1200px' }}
        styles={{ body: { padding: 0 } }}
      >
        <div className="w-full h-[80vh] bg-gray-50 flex items-center justify-center">
          {(backgroundImage || inputOrOutput === "output" || inputOrOutput === "input") && (
            isDrawingMode ? (
              <DrawingCanvas 
                visible={isDrawingMode}
                onClose={() => setIsDrawingMode(false)}
                onComplete={handleDrawComplete}
                type={drawingTool}
                initialImage={backgroundImage?.image || (inputOrOutput === "output" ? outputData?.image : inputOrOutput === "input" ? inputData?.image : undefined)}
              />
            ) : (
              <img 
                src={backgroundImage?.image || (inputOrOutput === "output" ? outputData?.image : inputOrOutput === "input" ? inputData?.image : undefined)} 
                alt="大图预览" 
                className="max-w-full max-h-full object-contain"
              />
            )
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PropertiesPanel; 