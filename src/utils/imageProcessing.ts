declare namespace cv {
  class Mat {
    delete(): void;
    copyTo(dst: Mat): void;
  }
  class Size {
    constructor(width: number, height: number);
  }
  class Point {
    constructor(x: number, y: number);
  }
  class Scalar {
    constructor(r: number, g: number, b: number, a?: number);
  }
  
  const THRESH_BINARY: number;
  const THRESH_BINARY_INV: number;
  const THRESH_TRUNC: number;
  const THRESH_TOZERO: number;
  const THRESH_TOZERO_INV: number;
  const THRESH_OTSU: number;
  
  const BORDER_DEFAULT: number;
  const BORDER_CONSTANT: number;
  const BORDER_REPLICATE: number;
  
  const MORPH_RECT: number;
  const MORPH_CROSS: number;
  const MORPH_ELLIPSE: number;
  
  const LINE_4: number;
  const LINE_8: number;
  const LINE_AA: number;
  
  function threshold(src: Mat, dst: Mat, thresh: number, maxval: number, type: number): void;
  function GaussianBlur(src: Mat, dst: Mat, ksize: Size, sigmaX: number, sigmaY: number, borderType?: number): void;
  function getStructuringElement(shape: number, ksize: Size, anchor?: Point): Mat;
  function erode(src: Mat, dst: Mat, kernel: Mat, anchor?: Point, iterations?: number): void;
  function dilate(src: Mat, dst: Mat, kernel: Mat, anchor?: Point, iterations?: number): void;
  function Canny(src: Mat, dst: Mat, threshold1: number, threshold2: number, apertureSize?: number, L2gradient?: boolean): void;
  function bitwise_not(src: Mat, dst: Mat): void;
  function addWeighted(src1: Mat, alpha: number, src2: Mat, beta: number, gamma: number, dst: Mat): void;
  function rectangle(img: Mat, pt1: Point, pt2: Point, color: Scalar, thickness?: number, lineType?: number): void;
  function circle(img: Mat, center: Point, radius: number, color: Scalar, thickness?: number, lineType?: number): void;
  function line(img: Mat, pt1: Point, pt2: Point, color: Scalar, thickness?: number, lineType?: number): void;
}

type Color = [number, number, number];

interface ProcessParams {
  threshold?: number;
  maxValue?: number;
  method?: 'THRESH_BINARY' | 'THRESH_BINARY_INV' | 'THRESH_TRUNC' | 'THRESH_TOZERO' | 'THRESH_TOZERO_INV';
  useOtsu?: boolean;
  kernelSize?: number;
  sigmaX?: number;
  sigmaY?: number;
  borderType?: 'BORDER_DEFAULT' | 'BORDER_CONSTANT' | 'BORDER_REPLICATE';
  iterations?: number;
  kernelShape?: 'MORPH_RECT' | 'MORPH_CROSS' | 'MORPH_ELLIPSE';
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
  color?: Color;
  thickness?: number;
  lineType?: 'LINE_4' | 'LINE_8' | 'LINE_AA';
  filled?: boolean;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export const processImage = (type: string, image: cv.Mat, params: ProcessParams): cv.Mat => {
  const result = new cv.Mat();

  switch (type) {
    case 'binary': {
      const threshold = params.threshold ?? 128;
      const maxValue = params.maxValue ?? 255;
      const methodName = params.method ?? 'THRESH_BINARY';
      const useOtsu = params.useOtsu ?? false;
      cv.threshold(
        image,
        result,
        threshold,
        maxValue,
        cv[methodName] + (useOtsu ? cv.THRESH_OTSU : 0)
      );
      break;
    }

    case 'blur': {
      const kernelSize = params.kernelSize ?? 5;
      const sigmaX = params.sigmaX ?? 0;
      const sigmaY = params.sigmaY ?? 0;
      const borderTypeName = params.borderType ?? 'BORDER_DEFAULT';
      const ksize = new cv.Size(kernelSize, kernelSize);
      cv.GaussianBlur(image, result, ksize, sigmaX, sigmaY, cv[borderTypeName]);
      break;
    }

    case 'erode':
    case 'dilate': {
      const kernelSize = params.kernelSize ?? 3;
      const iterations = params.iterations ?? 1;
      const kernelShapeName = params.kernelShape ?? 'MORPH_RECT';
      const anchor = params.anchor ?? { x: -1, y: -1 };
      const kernel = cv.getStructuringElement(
        cv[kernelShapeName],
        new cv.Size(kernelSize, kernelSize)
      );
      if (type === 'erode') {
        cv.erode(image, result, kernel, new cv.Point(anchor.x, anchor.y), iterations);
      } else {
        cv.dilate(image, result, kernel, new cv.Point(anchor.x, anchor.y), iterations);
      }
      kernel.delete();
      break;
    }

    case 'edge': {
      const threshold1 = params.threshold1 ?? 100;
      const threshold2 = params.threshold2 ?? 200;
      const apertureSize = parseInt(params.apertureSize ?? '3', 10);
      const l2gradient = params.l2gradient ?? false;
      cv.Canny(image, result, threshold1, threshold2, apertureSize, l2gradient);
      break;
    }

    case 'mask':
    case 'invert-mask': {
      const threshold = params.threshold ?? 128;
      const maxValue = params.maxValue ?? 255;
      const methodName = params.method ?? 'THRESH_BINARY';
      const blendAlpha = params.blendAlpha ?? 0.5;
      
      const mask = new cv.Mat();
      cv.threshold(image, mask, threshold, maxValue, cv[methodName]);
      
      if (type === 'invert-mask') {
        cv.bitwise_not(mask, mask);
      }
      
      cv.addWeighted(image, blendAlpha, mask, 1 - blendAlpha, 0, result);
      mask.delete();
      break;
    }

    case 'draw-rect': {
      image.copyTo(result);
      const x = params.x ?? 0;
      const y = params.y ?? 0;
      const width = params.width ?? 100;
      const height = params.height ?? 100;
      const color = params.color ?? [255, 0, 0] as Color;
      const thickness = params.filled ? -1 : (params.thickness ?? 2);
      const lineTypeName = params.lineType ?? 'LINE_8';
      cv.rectangle(
        result,
        new cv.Point(x, y),
        new cv.Point(x + width, y + height),
        new cv.Scalar(...color),
        thickness,
        cv[lineTypeName]
      );
      break;
    }

    case 'draw-circle': {
      image.copyTo(result);
      const x = params.x ?? 50;
      const y = params.y ?? 50;
      const radius = params.radius ?? 25;
      const color = params.color ?? [0, 255, 0] as Color;
      const thickness = params.filled ? -1 : (params.thickness ?? 2);
      const lineTypeName = params.lineType ?? 'LINE_8';
      cv.circle(
        result,
        new cv.Point(x, y),
        radius,
        new cv.Scalar(...color),
        thickness,
        cv[lineTypeName]
      );
      break;
    }

    case 'draw-line': {
      image.copyTo(result);
      const x1 = params.x1 ?? 0;
      const y1 = params.y1 ?? 0;
      const x2 = params.x2 ?? 100;
      const y2 = params.y2 ?? 100;
      const color = params.color ?? [0, 0, 255] as Color;
      const thickness = params.thickness ?? 2;
      const lineTypeName = params.lineType ?? 'LINE_8';
      cv.line(
        result,
        new cv.Point(x1, y1),
        new cv.Point(x2, y2),
        new cv.Scalar(...color),
        thickness,
        cv[lineTypeName]
      );
      break;
    }

    default:
      image.copyTo(result);
  }

  return result;
}; 