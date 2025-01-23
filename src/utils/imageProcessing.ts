// 定义处理参数类型
interface ProcessParams {
  threshold?: number;
  maxValue?: number;
  method?: string;
  useOtsu?: boolean;
  kernelSize?: number;
  sigmaX?: number;
  sigmaY?: number;
  borderType?: string;
  iterations?: number;
  kernelShape?: string;
  anchor?: { x: number; y: number };
  threshold1?: number;
  threshold2?: number;
  apertureSize?: string;
  l2gradient?: boolean;
  blendAlpha?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  color?: [number, number, number];
  thickness?: number;
  lineType?: string;
  filled?: boolean;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
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

    const my_data = {
      type,
      image: base64Image,
      params: {
        ...params,
        // 确保数值类型参数为数字
        threshold: params.threshold ? Number(params.threshold) : undefined,
        kernelSize: params.kernelSize ? Number(params.kernelSize) : undefined,
        iterations: params.iterations ? Number(params.iterations) : undefined,
        threshold1: params.threshold1 ? Number(params.threshold1) : undefined,
        threshold2: params.threshold2 ? Number(params.threshold2) : undefined,
      },
    }
    console.log(my_data);
    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(my_data),
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
