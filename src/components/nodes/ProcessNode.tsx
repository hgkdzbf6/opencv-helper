import { Handle, Position } from 'reactflow';
import { useImageStore } from '../../store/imageStore';
import { useEffect, useCallback } from 'react';
import { processImage } from '../../utils/imageProcessing';

interface ProcessNodeProps {
  id: string;
  data: {
    id: string;
    type: 'process' | 'input' | 'output';
    processType: 'binary' | 'blur' | 'erode' | 'dilate' | 'edge' | 'mask' | 'invert-mask' | 'draw-rect' | 'draw-circle' | 'draw-line';
    label: string;
  };
  className?: string;
}

const ProcessNode = ({ data, className }: ProcessNodeProps) => {
  const setImage = useImageStore((state) => state.setImage);
  const getConnectedImage = useImageStore((state) => state.getConnectedNodeSourceImage);
  const inputImage = useImageStore((state) => state.getConnectedNodeSourceImage(data.id, true));
  const outputImage = useImageStore((state) => state.getImage(data.id, true));
  const setNodeParams = useImageStore((state) => state.setNodeParams);
  const nodeParams = useImageStore((state) => state.getNodeParams(data.id));
  const showNodesPreview = useImageStore((state) => state.showNodesPreview);

  // 初始化节点参数
  useEffect(() => {
    if (!nodeParams) {
      const defaultParams = {
        'binary': { 
          threshold: 128,
          maxValue: 255,
          method: 'THRESH_BINARY' as const,
          useOtsu: false
        },
        'blur': { 
          kernelSize: 5,
          sigmaX: 0,
          sigmaY: 0,
          borderType: 'BORDER_DEFAULT' as const
        },
        'erode': { 
          kernelSize: 3,
          iterations: 1,
          kernelShape: 'MORPH_RECT' as const,
          anchor: { x: -1, y: -1 }
        },
        'dilate': { 
          kernelSize: 3,
          iterations: 1,
          kernelShape: 'MORPH_RECT' as const,
          anchor: { x: -1, y: -1 }
        },
        'edge': { 
          threshold1: 100,
          threshold2: 200,
          apertureSize: 3,
          l2gradient: false
        },
        'mask': {
          threshold: 128,
          maxValue: 255,
          method: 'THRESH_BINARY' as const,
          blendAlpha: 0.5
        },
        'invert-mask': {
          threshold: 128,
          maxValue: 255,
          method: 'THRESH_BINARY' as const,
          blendAlpha: 0.5
        },
        'draw-rect': { 
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          color: [255, 0, 0] as [number, number, number],
          thickness: 2,
          lineType: 'LINE_8' as const,
          filled: false
        },
        'draw-circle': { 
          x: 50,
          y: 50,
          radius: 25,
          color: [0, 255, 0] as [number, number, number],
          thickness: 2,
          lineType: 'LINE_8' as const,
          filled: false
        },
        'draw-line': { 
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
          color: [0, 0, 255] as [number, number, number],
          thickness: 2,
          lineType: 'LINE_8' as const
        }
      }[data.processType];
      
      if (defaultParams) {
        setNodeParams(data.id, { [data.processType]: defaultParams });
      }
    }
  }, [data.id, data.type, data.processType, nodeParams, setNodeParams]);

  // 使用 useCallback 缓存处理函数
  const processAndUpdateImage = useCallback(async () => {
    console.log(`[ProcessNode ${data.id}] 检查处理条件`);
    console.log(`- 输入图像: ${inputImage ? '有' : '无'}`);
    console.log(`- 节点参数: ${nodeParams ? '有' : '无'}`);
    console.log(`- 节点类型: ${data.type}`);
    console.log('data', data);
    if (!inputImage || !nodeParams) {
      console.log(`[ProcessNode ${data.id}] 跳过处理：无输入图像或参数`);
      setImage(data.id, '');
      return;
    }

    try {
      console.log(`[ProcessNode ${data.id}] 开始处理图像，类型: ${data.type}，具体类型: ${data.processType}`);
      const params = nodeParams[data.processType] || {};
      console.log(`[ProcessNode ${data.id}] 处理参数:`, JSON.stringify(params, null, 2));
      
      const processed = await processImage(data.processType, inputImage, params);
      console.log(`[ProcessNode ${data.id}] 图像处理完成，更新输出`);
      setImage(data.id, processed);
    } catch (error) {
      console.error(`[ProcessNode ${data.id}] 处理错误:`, error);
      setImage(data.id, '');
    }
  }, [data.id, data.type, inputImage, nodeParams, setImage]);

  // 当输入图像或参数改变时处理图像
  useEffect(() => {
    console.log(`[ProcessNode ${data.id}] 检测到变化`);
    console.log('data', data);
    console.log(`- 输入图像: ${inputImage ? '有' : '无'}`);
    console.log(`- 节点参数: ${nodeParams ? '有' : '无'}`);
    
    if (!inputImage) {
      console.log(`[ProcessNode ${data.id}] 无输入图像，清除输出`);
      setImage(data.id, '');
      return;
    }

    const timer = setTimeout(() => {
      console.log(`[Timer ProcessNode ${data.id}] 开始延迟处理`);
      processAndUpdateImage();
    }, 100);

    return () => {
      console.log(`[ProcessNode ${data.id}] 清理定时器`);
      clearTimeout(timer);
    };
  }, [data.id, inputImage, nodeParams, processAndUpdateImage, setImage]);

  return (
    <div className={`px-4 py-2 rounded border border-gray-200 bg-white font-medium shadow-sm ${className || ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="flex flex-col items-center">
        <div className="mb-2">{data.label}</div>
        {showNodesPreview && outputImage && (
          <div className="w-[100px] h-[100px] bg-gray-50 rounded overflow-hidden">
            <img 
              src={outputImage} 
              alt="处理后" 
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default ProcessNode; 