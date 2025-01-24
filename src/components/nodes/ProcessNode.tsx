import React, { useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useImageStore } from '../../store/imageStore';
import { processImage, ProcessParams, ContourMode, ContourMethod } from '../../utils/imageProcessing';

interface ProcessNodeData {
  id: string;
  label: string;
  type: 'process' | 'input' | 'output';
  processType: 'binary' | 'blur' | 'erode' | 'dilate' | 'edge' | 'mask' | 'invert-mask' | 'draw-rect' | 'draw-circle' | 'draw-line' | 'multiply' | 'screen' | 'overlay' | 'blend' | 'grayscale' | 'blank' | 'contour' | 'print';
}

interface ProcessNodeProps {
  data: ProcessNodeData;
  className?: string;
}

const ProcessNode = ({ data, className }: ProcessNodeProps) => {
  const setImage = useImageStore((state) => state.setImage);
  const getConnectedImage = useImageStore((state) => state.getConnectedNodeSourceImage);
  const getSecondaryImage = useImageStore((state) => state.getConnectedNodeSecondaryImage);
  const inputImage = useImageStore((state) => state.getConnectedNodeSourceImage(data.id, true));
  const secondaryImage = useImageStore((state) => state.getConnectedNodeSecondaryImage(data.id, true));
  const outputImage = useImageStore((state) => state.getImage(data.id, true));
  const setNodeParams = useImageStore((state) => state.setNodeParams);
  const nodeParams = useImageStore((state) => state.getNodeParams(data.id));
  const showNodesPreview = useImageStore((state) => state.showNodesPreview);

  // 是否是混合模式节点
  const isBlendNode = ['multiply', 'screen', 'overlay', 'blend'].includes(data.processType);

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
        'grayscale': {
          // 灰度图不需要额外参数
        },
        'blank': {
          width: 512,
          height: 512,
          color: [255, 255, 255] as [number, number, number],
          isGrayscale: false
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
        },
        'multiply': {
          opacity: 1.0
        },
        'screen': {
          opacity: 1.0
        },
        'overlay': {
          opacity: 1.0
        },
        'blend': {
          ratio: 0.5
        },
        'contour': {
          mode: 'RETR_EXTERNAL',
          contourMethod: 'CHAIN_APPROX_SIMPLE',
          minArea: 100,
          maxArea: 10000
        },
        'print': {
          // 打印节点不需要参数
        }
      }[data.processType];
      
      if (defaultParams) {
        setNodeParams(data.id, { [data.processType]: defaultParams });
      }
    }
  }, [data.id, data.type, data.processType, nodeParams, setNodeParams]);

  useEffect(() => {
    if (!inputImage) return;

    const processParams = nodeParams?.[data.processType] || {};
    let outputImg: { image?: string; [key: string]: any } = {};

    const processAndUpdateImage = async () => {
      try {
        switch (data.processType) {
          case 'grayscale':
            const grayResult = await processImage('grayscale', inputImage.image || '', {});
            outputImg = { image: grayResult };
            break;

          case 'blank': {
            const blankParams: ProcessParams = {
              width: processParams.width || 512,
              height: processParams.height || 512,
              color: processParams.color || [255, 255, 255],
              isGrayscale: processParams.isGrayscale || false
            };
            const blankResult = await processImage('blank', inputImage.image || '', blankParams);
            outputImg = { image: blankResult };
            break;
          }

          case 'contour': {
            const contourParams: ProcessParams = {
              mode: processParams.mode || 'RETR_EXTERNAL',
              contourMethod: processParams.contourMethod || 'CHAIN_APPROX_SIMPLE',
              minArea: processParams.minArea || 100,
              maxArea: processParams.maxArea || 10000
            };
            const contourResult = await processImage('contour', inputImage.image || '', contourParams);
            // contourResult 是一个 JSON 字符串，包含图像和轮廓数据
            const contourData = JSON.parse(contourResult);
            outputImg = contourData;
            break;
          }

          case 'print':
            // 打印节点直接传递输入数据
            outputImg = inputImage;
            break;

          default:
            const result = await processImage(data.processType, inputImage.image || '', processParams);
            outputImg = { image: result };
        }

        console.log(`[ProcessNode ${data.id}] 图像处理完成，更新输出`);
        setImage(data.id, outputImg);
      } catch (error) {
        console.error(`[ProcessNode ${data.id}] 处理错误:`, error);
        setImage(data.id, {});
      }
    };

    const timer = setTimeout(() => {
      console.log(`[Timer ProcessNode ${data.id}] 开始延迟处理`);
      processAndUpdateImage();
    }, 100);

    return () => {
      console.log(`[ProcessNode ${data.id}] 清理定时器`);
      clearTimeout(timer);
    };
  }, [data.id, data.processType, inputImage, nodeParams, setImage]);

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
        onConnect={(params) => console.log('handle onConnect', params)}
      />
      <div className="p-2">
        <div className="text-sm font-medium mb-2">{data.label}</div>
        {data.processType === 'print' && inputImage ? (
          <div className="text-xs whitespace-pre-wrap overflow-auto max-h-[200px]">
            {typeof inputImage === 'object' ? (
              <>
                {inputImage.image && (
                  <div className="mb-2">
                    <img src={`data:image/png;base64,${inputImage.image}`} alt="输入图像" className="max-w-full" />
                  </div>
                )}
                <pre>{JSON.stringify(inputImage, null, 2)}</pre>
              </>
            ) : (
              inputImage
            )}
          </div>
        ) : (
          outputImage?.image && (
            <img src={`data:image/png;base64,${outputImage.image}`} alt="处理后图像" className="max-w-full" />
          )
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
        onConnect={(params) => console.log('handle onConnect', params)}
      />
    </div>
  );
};

export default ProcessNode;