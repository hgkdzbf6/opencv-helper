import cv from 'opencv-ts';

export const processImage = async (
  imageData: string,
  type: string,
  params: Record<string, number> = {}
): Promise<string> => {
  // 创建一个临时的 img 元素来加载图片
  const img = new Image();
  img.src = imageData;
  await new Promise((resolve) => (img.onload = resolve));

  // 创建 canvas 来处理图片
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  // 获取图像数据
  const imageMatrix = cv.imread(canvas);
  let processed = new cv.Mat();

  try {
    switch (type) {
      case 'binary':
        // 转换为灰度图
        cv.cvtColor(imageMatrix, processed, cv.COLOR_RGBA2GRAY);
        // 应用二值化，阈值默认为 128
        const threshold = params.threshold || 128;
        cv.threshold(processed, processed, threshold, 255, cv.THRESH_BINARY);
        break;

      case 'blur':
        // 高斯模糊，默认核大小为 5
        const kernelSize = params.kernelSize || 5;
        cv.GaussianBlur(
          imageMatrix,
          processed,
          new cv.Size(kernelSize, kernelSize),
          0,
          0,
          cv.BORDER_DEFAULT
        );
        break;

      default:
        processed = imageMatrix.clone();
    }

    // 将处理后的图像绘制到 canvas
    cv.imshow(canvas, processed);
    return canvas.toDataURL();
  } finally {
    // 释放内存
    imageMatrix.delete();
    processed.delete();
  }
}; 