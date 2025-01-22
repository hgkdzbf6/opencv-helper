import { Handle, Position } from 'reactflow';
import { useImageStore } from '../../store/imageStore';
import { useEffect } from 'react';
import { processImage } from '../../utils/imageProcessing';

interface ProcessNodeProps {
  id: string;
  data: {
    id: string;
    type: 'binary' | 'blur' | 'erode' | 'dilate' | 'edge' | 'mask' | 'invert-mask' | 'draw-rect' | 'draw-circle' | 'draw-line';
    label: string;
  };
  className?: string;
}

const ProcessNode = ({ data, className }: ProcessNodeProps) => {
  const setImage = useImageStore((state) => state.setImage);
  const getConnectedImage = useImageStore((state) => state.getConnectedNodeImage);
  const inputImage = useImageStore((state) => state.getConnectedNodeImage(data.id));
  const outputImage = useImageStore((state) => state.getImage(data.id));
  const setNodeParams = useImageStore((state) => state.setNodeParams);
  const nodeParams = useImageStore((state) => state.getNodeParams(data.id));
  const showNodesPreview = useImageStore((state) => state.showNodesPreview);

  // 初始化节点参数
  useEffect(() => {
    if (!nodeParams) {
      const defaultParams = {
        binary: { threshold: 128 },
        blur: { kernelSize: 5 },
        erode: { kernelSize: 3 },
        dilate: { kernelSize: 3 },
        edge: { threshold1: 100, threshold2: 200 },
        mask: { threshold: 128 },
        'invert-mask': { threshold: 128 },
        'draw-rect': { x: 0, y: 0, width: 100, height: 100, color: [255, 0, 0] },
        'draw-circle': { x: 50, y: 50, radius: 25, color: [0, 255, 0] },
        'draw-line': { x1: 0, y1: 0, x2: 100, y2: 100, color: [0, 0, 255] }
      }[data.type];
      
      if (defaultParams) {
        setNodeParams(data.id, { [data.type]: defaultParams });
      }
    }
  }, [data.id, data.type, nodeParams, setNodeParams]);

  // 当输入图片或参数改变时，处理图片
  useEffect(() => {
    const processAndUpdateImage = async () => {
      if (!inputImage || !nodeParams) {
        setImage(data.id, '');
        return;
      }

      try {
        const params = nodeParams[data.type] || {};
        const processed = await processImage(inputImage, data.type, params);
        setImage(data.id, processed);
      } catch (error) {
        console.error('处理图片时出错:', error);
      }
    };

    processAndUpdateImage();
  }, [inputImage, nodeParams, data.type, data.id, setImage]);

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