// 定义参数类型
export type ThresholdMethod = 'THRESH_BINARY' | 'THRESH_BINARY_INV' | 'THRESH_TRUNC' | 'THRESH_TOZERO' | 'THRESH_TOZERO_INV';
export type BorderType = 'BORDER_DEFAULT' | 'BORDER_CONSTANT' | 'BORDER_REPLICATE';
export type KernelShape = 'MORPH_RECT' | 'MORPH_CROSS' | 'MORPH_ELLIPSE';
export type LineType = 'LINE_4' | 'LINE_8' | 'LINE_AA';
export type ContourMode = 'RETR_EXTERNAL' | 'RETR_LIST' | 'RETR_CCOMP' | 'RETR_TREE';
export type ContourMethod = 'CHAIN_APPROX_NONE' | 'CHAIN_APPROX_SIMPLE' | 'CHAIN_APPROX_TC89_L1' | 'CHAIN_APPROX_TC89_KCOS';

export interface ProcessParams {
  // 二值化参数
  threshold?: number;
  maxValue?: number;
  method?: ThresholdMethod;
  useOtsu?: boolean;

  // 模糊参数
  kernelSize?: number;
  sigmaX?: number;
  sigmaY?: number;
  borderType?: BorderType;

  // 形态学操作参数
  iterations?: number;
  kernelShape?: KernelShape;
  anchor?: { x: number; y: number };

  // 边缘检测参数
  threshold1?: number;
  threshold2?: number;
  apertureSize?: number;
  l2gradient?: boolean;

  // 蒙版参数
  blendAlpha?: number;

  // 绘图参数
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: [number, number, number];
  thickness?: number;
  lineType?: LineType;
  filled?: boolean;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

  // 空白图像参数
  isGrayscale?: boolean;

  // 轮廓检测参数
  mode?: ContourMode;
  contourMethod?: ContourMethod;
  minArea?: number;
  maxArea?: number;

  // 混合模式参数
  blendMode?: 'multiply' | 'screen' | 'overlay' | 'blend';
  opacity?: number;
  ratio?: number;

  // 允许任意其他参数
  [key: string]: any;
}

// API 基础 URL
const API_BASE_URL = 'http://localhost:8000';

// 处理图像的主函数
export const processImage = async (type: string, imageData: string, params: ProcessParams = {}): Promise<string> => {
  try {
    console.log('开始处理图像，类型:', type);
    console.log('处理参数:', params);

    // 确保 imageData 是 base64 格式
    const base64Image = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;

    const send_params = {
      ...params,
      // 确保数值类型参数为数字
      threshold: params.threshold ? Number(params.threshold) : undefined,
      kernelSize: params.kernelSize ? Number(params.kernelSize) : undefined,
      iterations: params.iterations ? Number(params.iterations) : undefined,
      threshold1: params.threshold1 ? Number(params.threshold1) : undefined,
      threshold2: params.threshold2 ? Number(params.threshold2) : undefined,
      x: params.x ? Number(params.x) : undefined,
      y: params.y ? Number(params.y) : undefined,
      width: params.width ? Number(params.width) : undefined,
      height: params.height ? Number(params.height) : undefined,
      radius: params.radius ? Number(params.radius) : undefined,
      x1: params.x1 ? Number(params.x1) : undefined,
      y1: params.y1 ? Number(params.y1) : undefined,
      x2: params.x2 ? Number(params.x2) : undefined,
      y2: params.y2 ? Number(params.y2) : undefined,
    }

    for (const key in send_params) {
      if (send_params[key as keyof typeof send_params] === undefined) {
        delete send_params[key as keyof typeof send_params];
      }
    }

    // 构造请求数据
    const requestData = {
      type,
      image: base64Image,
      params: send_params,
    };

    console.log('发送请求数据:', requestData);

    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '图像处理失败' }));
      console.error('服务器响应错误:', {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      throw new Error(error.detail || `服务器错误: ${response.status}`);
    }

    const data = await response.json();
    console.log('图像处理完成');
    return data.result;
  } catch (error) {
    console.error('处理图像失败:', error);
    throw error;
  }
};
