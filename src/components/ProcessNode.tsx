import { memo, useEffect, useCallback, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { useImageStore } from '../store/imageStore';
import { processImage } from '../utils/imageProcessing';

const ProcessNode = memo(({ id, data }: { id: string; data: { type: string; label: string } }) => {
  const setImage = useImageStore((state) => state.setImage);
  const getConnectedImage = useImageStore((state) => state.getConnectedNodeImage);
  const nodeParams = useImageStore((state) => state.getNodeParams(id));
  const edges = useImageStore((state) => state.edges);
  
  // 使用 ref 来跟踪处理状态
  const processingRef = useRef(false);
  const lastProcessedImageRef = useRef<string | undefined>();
  const lastProcessedParamsRef = useRef<any>();

  const processAndUpdateImage = useCallback(async () => {
    // 如果正在处理中，跳过
    if (processingRef.current) {
      return;
    }

    const inputImage = getConnectedImage(id);
    const currentParams = nodeParams?.[data.type];

    // 如果没有输入图像或参数未变化，跳过处理
    if (!inputImage || 
        (inputImage === lastProcessedImageRef.current && 
         JSON.stringify(currentParams) === JSON.stringify(lastProcessedParamsRef.current))) {
      return;
    }

    try {
      console.log(`[ProcessNode ${id}] 开始处理图像，类型: ${data.type}`);
      console.log(`[ProcessNode ${id}] 参数:`, currentParams);
      
      processingRef.current = true;
      const processedImage = await processImage(data.type, inputImage, currentParams);
      
      // 更新处理记录
      lastProcessedImageRef.current = inputImage;
      lastProcessedParamsRef.current = currentParams;
      
      setImage(id, processedImage);
      console.log(`[ProcessNode ${id}] 图像处理完成`);
    } catch (error) {
      console.error(`[ProcessNode ${id}] 处理错误:`, error);
      setImage(id, '');
    } finally {
      processingRef.current = false;
    }
  }, [id, data.type, getConnectedImage, nodeParams, setImage]);

  useEffect(() => {
    const hasInput = edges.some(edge => edge.target === id);
    if (!hasInput) {
      setImage(id, '');
      return;
    }

    const timer = setTimeout(() => {
      processAndUpdateImage();
    }, 100);

    console.log(`[ProcessNode ${id}] 开始处理图像，类型: ${data.type}`);

    return () => clearTimeout(timer);
  }, [id, edges, processAndUpdateImage, setImage]);

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-teal-500"
      />
      <div className="text-center">{data.label}</div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-teal-500"
      />
    </div>
  );
});

ProcessNode.displayName = 'ProcessNode';

export default ProcessNode; 