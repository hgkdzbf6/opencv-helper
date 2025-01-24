import React, { useEffect, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useDataStore } from '../../store/imageStore';
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
  const setData = useDataStore((state) => state.setData);
  const getConnectedData = useDataStore((state) => state.getConnectedNodeSourceData);
  const getSecondaryData = useDataStore((state) => state.getConnectedNodeSecondaryData);
  const inputData = useDataStore((state) => state.getConnectedNodeSourceData(data.id, true));
  const secondaryData = useDataStore((state) => state.getConnectedNodeSecondaryData(data.id, true));
  const outputData = useDataStore((state) => state.getData(data.id, true));
  const setNodeParams = useDataStore((state) => state.setNodeParams);
  const nodeParams = useDataStore((state) => state.getNodeParams(data.id));
  const showNodesPreview = useDataStore((state) => state.showNodesPreview);

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
    if (!inputData) return;

    const processParams = nodeParams?.[data.processType] || {};
    let outputImg: { image?: string; [key: string]: any } = {};

    const processAndUpdateImage = async () => {
      try {
        // 确保输入图像是有效的 base64 字符串
        const inputImageData = inputData.image || '';
        if (!inputImageData) {
          console.warn(`[ProcessNode ${data.id}] 输入图像为空`);
          return;
        }

        switch (data.processType) {
          case 'grayscale':
            const grayResult = await processImage('grayscale', inputImageData, {});
            outputImg = { image: grayResult };
            break;

          case 'blank': {
            const blankParams = {
              width: Number(processParams.width) || 512,
              height: Number(processParams.height) || 512,
              color: processParams.color || [255, 255, 255],
              isGrayscale: Boolean(processParams.isGrayscale)
            } as unknown as ProcessParams;
            const blankResult = await processImage('blank', inputImageData, blankParams);
            outputImg = { image: blankResult };
            break;
          }

          case 'contour': {
            // 先转换为灰度图
            const grayImage = await processImage('grayscale', inputImageData, {});
            // 再进行轮廓检测
            const contourParams = {
              mode: (processParams.mode || 'RETR_EXTERNAL') as ContourMode,
              contourMethod: (processParams.contourMethod || 'CHAIN_APPROX_SIMPLE') as ContourMethod,
              minArea: Number(processParams.minArea) || 100,
              maxArea: Number(processParams.maxArea) || 10000
            } as unknown as ProcessParams;
            const contourResult = await processImage('contour', grayImage, contourParams);
            // contourResult 是一个 JSON 字符串，包含图像和轮廓数据
            const contourData = JSON.parse(contourResult);
            outputImg = contourData;
            break;
          }

          case 'print':
            // 打印节点直接传递输入数据
            outputImg = inputData;
            break;

          default:
            const result = await processImage(data.processType, inputImageData, processParams as ProcessParams);
            console.log(`[processAndUpdateImage][ProcessNode ${data.id}] 处理结果:`, result);
            outputImg = { image: result };
        }

        console.log(`[ProcessNode ${data.id}] 图像处理完成，更新输出`);
        setData(data.id, outputImg);
      } catch (error) {
        console.error(`[ProcessNode ${data.id}] 处理错误:`, error);
        setData(data.id, { error: error instanceof Error ? error.message : '处理失败' });
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
  }, [data.id, data.processType, inputData, nodeParams, setData]);

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
        {data.processType === 'print' && inputData ? (
          <div className="text-xs whitespace-pre-wrap overflow-auto max-h-[200px]">
            {typeof inputData === 'object' ? (
              <>
                {inputData.image && (
                  <div className="mb-2">
                    <img src={`${inputData.image}`} alt="输入图像" className="max-w-full" />
                  </div>
                )}
                <pre>{JSON.stringify(inputData, null, 2)}</pre>
              </>
            ) : (
              inputData
            )}
          </div>
        ) : outputData?.error ? (
          <div className="text-xs text-red-500">{outputData.error}</div>
        ) : (
          outputData?.image && (
            <img src={`${outputData.image}`} alt="处理后图像" className="max-w-full" />
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