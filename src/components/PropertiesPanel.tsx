import { Node, Edge } from 'reactflow';
import { useImageStore } from '../store/imageStore';
import { UploadOutlined, CodeOutlined } from '@ant-design/icons';
import { Button, Upload, Card, Slider, Switch, Modal, Tabs, message, Select, InputNumber, Radio } from 'antd';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { processImage } from '../utils/imageProcessing';
import { generateCode } from '../utils/codeGenerator';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  onNodeAdd: (type: string, position: { x: number; y: number }, data: any) => void;
}

type ThresholdMethod = 'THRESH_BINARY' | 'THRESH_BINARY_INV' | 'THRESH_TRUNC' | 'THRESH_TOZERO' | 'THRESH_TOZERO_INV';
type BorderType = 'BORDER_DEFAULT' | 'BORDER_CONSTANT' | 'BORDER_REPLICATE';
type KernelShape = 'MORPH_RECT' | 'MORPH_CROSS' | 'MORPH_ELLIPSE';
type LineType = 'LINE_4' | 'LINE_8' | 'LINE_AA';

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
}

interface NodeParams {
  [key: string]: NodeTypeParams;
}

type ParamKey = keyof NodeTypeParams;

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

const ProcessControls = ({ nodeId, type }: { nodeId: string; type: string }) => {
  const setNodeParams = useImageStore((state) => state.setNodeParams);
  const nodeParams = useImageStore((state) => state.getNodeParams(nodeId));
  const setImage = useImageStore((state) => state.setImage);

  if (type === 'blank') {
    const width = nodeParams?.blank?.width || 640;
    const height = nodeParams?.blank?.height || 480;
    const color = nodeParams?.blank?.color || [255, 255, 255];

    const handleParamChange = (key: string, value: any) => {
      setNodeParams(nodeId, {
        blank: {
          ...nodeParams?.blank,
          [key]: value
        }
      });

      // 创建空白图像
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        ctx.fillRect(0, 0, width, height);
        setImage(nodeId, canvas.toDataURL());
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <div className="mb-2">宽度</div>
          <InputNumber
            min={1}
            max={4096}
            value={width}
            onChange={(value) => handleParamChange('width', value)}
          />
        </div>
        <div>
          <div className="mb-2">高度</div>
          <InputNumber
            min={1}
            max={4096}
            value={height}
            onChange={(value) => handleParamChange('height', value)}
          />
        </div>
        <div>
          <div className="mb-2">背景颜色</div>
          <div className="flex gap-2">
            <InputNumber
              min={0}
              max={255}
              value={color[0]}
              onChange={(value) => handleParamChange('color', [value, color[1], color[2]])}
            />
            <InputNumber
              min={0}
              max={255}
              value={color[1]}
              onChange={(value) => handleParamChange('color', [color[0], value, color[2]])}
            />
            <InputNumber
              min={0}
              max={255}
              value={color[2]}
              onChange={(value) => handleParamChange('color', [color[0], color[1], value])}
            />
          </div>
        </div>
      </div>
    );
  }

  const currentParams = (nodeParams?.[type] || {}) as NodeTypeParams;

  const onParamChange = (key: ParamKey, value: NodeTypeParams[ParamKey]) => {
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

  const renderSelect = <T extends ThresholdMethod | BorderType | KernelShape | LineType>(
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

  switch (type) {
    case 'binary':
      return (
        <div className="mt-4">
          {renderSlider('阈值', 'threshold', 0, 255, 1, 128)}
          {renderSlider('最大值', 'maxValue', 0, 255, 1, 255)}
          {renderSelect<ThresholdMethod>('二值化方法', 'method', [
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
          {renderSelect<BorderType>('边界类型', 'borderType', [
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
          {renderSelect<KernelShape>('核形状', 'kernelShape', [
            { value: 'MORPH_RECT', label: '矩形' },
            { value: 'MORPH_CROSS', label: '十字形' },
            { value: 'MORPH_ELLIPSE', label: '椭圆形' },
          ], 'MORPH_RECT')}
          {renderSlider('锚点 X', 'anchorX', -1, 1, 1, -1)}
          {renderSlider('锚点 Y', 'anchorY', -1, 1, 1, -1)}
        </div>
      );

    case 'edge':
      return (
        <div className="mt-4">
          {renderSlider('阈值1', 'threshold1', 0, 255, 1, 100)}
          {renderSlider('阈值2', 'threshold2', 0, 255, 1, 200)}
          {renderSlider('孔径大小', 'apertureSize', 3, 7, 2, 3)}
          {renderSwitch('使用 L2 梯度', 'l2gradient', false)}
        </div>
      );

    case 'draw-rect':
      return (
        <div className="mt-4">
          {renderSlider('X 坐标', 'x', 0, 1000, 1, 0)}
          {renderSlider('Y 坐标', 'y', 0, 1000, 1, 0)}
          {renderSlider('宽度', 'width', 1, 1000, 1, 100)}
          {renderSlider('高度', 'height', 1, 1000, 1, 100)}
          {renderColorPicker('颜色', 'color', [255, 0, 0])}
          {renderSlider('线条粗细', 'thickness', 1, 10, 1, 2)}
          {renderSelect<LineType>('线条类型', 'lineType', [
            { value: 'LINE_4', label: '4连通' },
            { value: 'LINE_8', label: '8连通' },
            { value: 'LINE_AA', label: '抗锯齿' },
          ], 'LINE_8')}
          {renderSwitch('填充', 'filled', false)}
        </div>
      );

    case 'draw-circle':
      return (
        <div className="mt-4">
          {renderSlider('X 坐标', 'x', 0, 1000, 1, 50)}
          {renderSlider('Y 坐标', 'y', 0, 1000, 1, 50)}
          {renderSlider('半径', 'radius', 1, 500, 1, 25)}
          {renderColorPicker('颜色', 'color', [0, 255, 0])}
          {renderSlider('线条粗细', 'thickness', 1, 10, 1, 2)}
          {renderSelect<LineType>('线条类型', 'lineType', [
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
          {renderSlider('线条粗细', 'thickness', 1, 10, 1, 2)}
          {renderSelect<LineType>('线条类型', 'lineType', [
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

const DrawingCanvas = ({ image, onDrawComplete, initialParams }: { 
  image: string; 
  onDrawComplete: (type: 'rect' | 'circle' | 'line', params: any) => void;
  initialParams?: any;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [drawingTool, setDrawingTool] = useState<'rect' | 'circle' | 'line'>(
    initialParams ? (
      initialParams.radius ? 'circle' : 
      initialParams.x1 !== undefined ? 'line' : 'rect'
    ) : 'rect'
  );
  const [previewCtx, setPreviewCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setPreviewCtx(ctx);

    // 加载图片
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 如果有初始参数，绘制初始形状
      if (initialParams) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;

        if (initialParams.radius) {
          // 绘制椭圆
          ctx.beginPath();
          ctx.ellipse(
            initialParams.x,
            initialParams.y,
            initialParams.radiusX || initialParams.radius,
            initialParams.radiusY || initialParams.radius,
            0,
            0,
            2 * Math.PI
          );
          ctx.stroke();
          setStartPoint({
            x: initialParams.x - (initialParams.radiusX || initialParams.radius),
            y: initialParams.y - (initialParams.radiusY || initialParams.radius)
          });
        } else if (initialParams.x1 !== undefined) {
          // 绘制直线
          ctx.beginPath();
          ctx.moveTo(initialParams.x1, initialParams.y1);
          ctx.lineTo(initialParams.x2, initialParams.y2);
          ctx.stroke();
          setStartPoint({ x: initialParams.x1, y: initialParams.y1 });
        } else {
          // 绘制矩形
          ctx.strokeRect(
            initialParams.x,
            initialParams.y,
            initialParams.width,
            initialParams.height
          );
          setStartPoint({
            x: initialParams.x,
            y: initialParams.y
          });
        }
      }
    };
    img.src = image;
  }, [image, initialParams]);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, currentPoint: { x: number; y: number }) => {
    if (!ctx || !startPoint) return;

    const width = currentPoint.x - startPoint.x;
    const height = currentPoint.y - startPoint.y;

    // 清除之前的预览
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(img, 0, 0);

      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;

      if (drawingTool === 'rect') {
        ctx.strokeRect(startPoint.x, startPoint.y, width, height);
      } else if (drawingTool === 'circle') {
        const centerX = startPoint.x + width / 2;
        const centerY = startPoint.y + height / 2;
        const radiusX = Math.abs(width / 2);
        const radiusY = Math.abs(height / 2);
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (drawingTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      }
    };
    img.src = image;
  }, [startPoint, drawingTool, image]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !previewCtx) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    drawShape(previewCtx, currentPoint);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const endPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setIsDrawing(false);

    if (drawingTool === 'rect') {
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);
      const x = Math.min(startPoint.x, endPoint.x);
      const y = Math.min(startPoint.y, endPoint.y);
      onDrawComplete('rect', { x, y, width, height });
    } else if (drawingTool === 'circle') {
      const width = endPoint.x - startPoint.x;
      const height = endPoint.y - startPoint.y;
      const centerX = startPoint.x + width / 2;
      const centerY = startPoint.y + height / 2;
      const radiusX = Math.abs(width / 2);
      const radiusY = Math.abs(height / 2);
      onDrawComplete('circle', { x: centerX, y: centerY, radiusX, radiusY });
    } else if (drawingTool === 'line') {
      onDrawComplete('line', {
        x1: startPoint.x,
        y1: startPoint.y,
        x2: endPoint.x,
        y2: endPoint.y
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
};

const PropertiesPanel = ({ selectedNode, nodes, edges, onNodeAdd }: PropertiesPanelProps) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const setImage = useImageStore((state) => state.setImage);
  const getConnectedImage = useImageStore((state) => state.getConnectedNodeImage);
  const toggleNodesPreview = useImageStore((state) => state.toggleNodesPreview);
  const showNodesPreview = useImageStore((state) => state.showNodesPreview);
  const nodeParams = useImageStore((state) => state.nodeParams);
  const setNodeParams = useImageStore((state) => state.setNodeParams);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'rect' | 'circle' | 'line'>('rect');

  // 使用 useMemo 缓存图片获取结果
  const image = useMemo(() => {
    if (!selectedNode) return undefined;
    return selectedNode.type === 'output'
      ? getConnectedImage(selectedNode.data.id, true)
      : useImageStore.getState().getImage(selectedNode.data.id, true);
  }, [selectedNode, getConnectedImage]);

  const handleDrawComplete = useCallback((type: 'rect' | 'circle' | 'line', params: any) => {
    if (selectedNode?.type === 'process' && 
        (selectedNode.data.type === 'draw-rect' || selectedNode.data.type === 'draw-circle' || selectedNode.data.type === 'draw-line')) {
      // 更新现有节点的参数
      setNodeParams(selectedNode.data.id, { 
        [selectedNode.data.type]: {
          ...params,
          color: nodeParams[selectedNode.data.id]?.[selectedNode.data.type]?.color || [255, 0, 0],
          thickness: nodeParams[selectedNode.data.id]?.[selectedNode.data.type]?.thickness || 2,
          lineType: nodeParams[selectedNode.data.id]?.[selectedNode.data.type]?.lineType || 'LINE_8',
          filled: nodeParams[selectedNode.data.id]?.[selectedNode.data.type]?.filled || false
        }
      });
      message.success('形状已更新');
    } else {
      // 创建新节点
      const nodeType = type === 'rect' ? 'draw-rect' : type === 'circle' ? 'draw-circle' : 'draw-line';
      const label = type === 'rect' ? '⬜️ 绘制矩形' : type === 'circle' ? '⭕️ 绘制圆形' : '直线';
      
      onNodeAdd('process', { x: 100, y: 100 }, { 
        type: nodeType, 
        label,
        params: {
          ...params,
          color: [255, 0, 0],
          thickness: 2,
          lineType: 'LINE_8',
          filled: false
        }
      });
      
      message.success(`已添加${type === 'rect' ? '矩形' : type === 'circle' ? '椭圆形' : '直线'}节点`);
    }
    setPreviewVisible(false);
    setIsDrawingMode(false);
  }, [onNodeAdd, selectedNode, nodeParams, setNodeParams]);

  const handlePreviewClick = useCallback(() => {
    if (selectedNode?.type === 'process' && 
        (selectedNode.data.type === 'draw-rect' || selectedNode.data.type === 'draw-circle' || selectedNode.data.type === 'draw-line')) {
      setIsDrawingMode(true);
    }
    setPreviewVisible(true);
  }, [selectedNode]);

  const handleToolChange = (value: string) => {
    setIsDrawingMode(true);
    setDrawingTool(value as 'rect' | 'circle' | 'line');
  };

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
          className="w-full bg-gray-50 rounded flex items-center justify-center overflow-hidden"
          onClick={image ? handlePreviewClick : undefined}
          style={{ cursor: image ? 'pointer' : 'default' }}
        >
          {image ? (
            <img 
              src={image} 
              alt="预览" 
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
        footer={
          <div className="flex justify-between items-center">
            <div>
              {(selectedNode?.type === 'process' && 
                (selectedNode.data.type === 'draw-rect' || 
                 selectedNode.data.type === 'draw-circle' || 
                 selectedNode.data.type === 'draw-line') || 
                !selectedNode) && (
                <Radio.Group 
                  value={drawingTool}
                  onChange={e => handleToolChange(e.target.value)}
                >
                  <Radio.Button value="rect">矩形</Radio.Button>
                  <Radio.Button value="circle">椭圆</Radio.Button>
                  <Radio.Button value="line">直线</Radio.Button>
                </Radio.Group>
              )}
            </div>
            <Button onClick={() => {
              setPreviewVisible(false);
              setIsDrawingMode(false);
            }}>
              关闭
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
          {image && (
            isDrawingMode ? (
              <DrawingCanvas 
                image={image} 
                onDrawComplete={handleDrawComplete}
                initialParams={
                  selectedNode?.type === 'process' ? 
                  nodeParams[selectedNode.data.id]?.[selectedNode.data.type] : 
                  undefined
                }
              />
            ) : (
              <img 
                src={image} 
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