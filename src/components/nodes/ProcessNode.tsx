import { Handle, Position } from 'reactflow';
import { useImageStore } from '../../store/imageStore';
import { useEffect } from 'react';
import { processImage } from '../../utils/imageProcessing';

interface ProcessNodeProps {
  id: string;
  data: {
    id: string;
    type: 'binary' | 'blur';
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
      const defaultParams = data.type === 'binary' 
        ? { binary: { threshold: 128 } }
        : { blur: { kernelSize: 5 } };
      setNodeParams(data.id, defaultParams);
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
        const params = data.type === 'binary'
          ? { threshold: nodeParams.binary?.threshold || 128 }
          : { kernelSize: nodeParams.blur?.kernelSize || 5 };

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