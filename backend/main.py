from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List, Union, Tuple, Literal
import cv2
import numpy as np
import base64
import json
import traceback

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定义参数类型
ThresholdMethod = Literal['THRESH_BINARY', 'THRESH_BINARY_INV', 'THRESH_TRUNC', 'THRESH_TOZERO', 'THRESH_TOZERO_INV']
BorderType = Literal['BORDER_DEFAULT', 'BORDER_CONSTANT', 'BORDER_REPLICATE']
KernelShape = Literal['MORPH_RECT', 'MORPH_CROSS', 'MORPH_ELLIPSE']
LineType = Literal['LINE_4', 'LINE_8', 'LINE_AA']

# 请求模型
class ImageProcessRequest(BaseModel):
    type: str
    image: str
    params: Dict[str, Union[int, float, str, List[int], bool, Dict[str, int], None]] = {}

def base64_to_cv2(base64_str: str) -> np.ndarray:
    """将 base64 图像转换为 OpenCV 格式"""
    try:
        # 检查输入
        if not base64_str:
            raise ValueError("图像数据为空")
            
        # 移除 base64 头部信息
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        # 解码 base64 数据
        try:
            img_data = base64.b64decode(base64_str)
        except Exception as e:
            raise ValueError(f"base64 解码失败: {str(e)}")
        
        # 转换为 numpy 数组
        try:
            nparr = np.frombuffer(img_data, np.uint8)
        except Exception as e:
            raise ValueError(f"转换为 numpy 数组失败: {str(e)}")
        
        # 解码图像
        try:
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("无法解码图像数据")
            return img
        except Exception as e:
            raise ValueError(f"OpenCV 解码失败: {str(e)}")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图像解码失败: {str(e)}")

def cv2_to_base64(img: np.ndarray) -> str:
    """将 OpenCV 图像转换为 base64 格式"""
    try:
        # 检查输入
        if img is None:
            raise ValueError("图像数据为空")
        if not isinstance(img, np.ndarray):
            raise ValueError("输入必须是 numpy 数组")
            
        # 编码图像
        try:
            _, buffer = cv2.imencode('.png', img)
            if not buffer.size:
                raise ValueError("图像编码失败")
        except Exception as e:
            raise ValueError(f"OpenCV 编码失败: {str(e)}")
        
        # 转换为 base64
        try:
            base64_str = base64.b64encode(buffer).decode('utf-8')
            return f"data:image/png;base64,{base64_str}"
        except Exception as e:
            raise ValueError(f"base64 编码失败: {str(e)}")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图像编码失败: {str(e)}")

@app.post("/process")
async def process_image(request: ImageProcessRequest):
    """处理图像的主要端点"""
    try:
        print(f"接收到处理请求: type={request.type}, params={request.params}")
        
        # 检查请求参数
        if not request.type:
            raise HTTPException(status_code=400, detail="未指定处理类型")
        if not request.image:
            raise HTTPException(status_code=400, detail="未提供图像数据")
            
        print("开始解码图像...")
        # 将 base64 图像转换为 OpenCV 格式
        img = base64_to_cv2(request.image)
        print(f"图像解码成功: shape={img.shape}")
        
        result = None
        
        # 根据类型处理图像
        print(f"开始处理图像: type={request.type}")
        if request.type == "binary":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            threshold = int(request.params.get("threshold", 128))
            max_value = int(request.params.get("maxValue", 255))
            method = request.params.get("method", "THRESH_BINARY")
            use_otsu = request.params.get("useOtsu", False)
            
            # 转换阈值化方法
            method_map = {
                "THRESH_BINARY": cv2.THRESH_BINARY,
                "THRESH_BINARY_INV": cv2.THRESH_BINARY_INV,
                "THRESH_TRUNC": cv2.THRESH_TRUNC,
                "THRESH_TOZERO": cv2.THRESH_TOZERO,
                "THRESH_TOZERO_INV": cv2.THRESH_TOZERO_INV
            }
            thresh_method = method_map.get(method, cv2.THRESH_BINARY)
            if use_otsu:
                thresh_method |= cv2.THRESH_OTSU
                
            print(f"二值化处理: threshold={threshold}, max_value={max_value}, method={method}, use_otsu={use_otsu}")
            _, result = cv2.threshold(gray, threshold, max_value, thresh_method)
        
        elif request.type == "grayscale":
            result = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            print('灰度处理完成')

        elif request.type == "contour":
            # 转换为灰度图
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # 二值化
            _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
            
            # 获取参数
            mode = request.params.get("mode", "RETR_EXTERNAL")
            method = request.params.get("contourMethod", "CHAIN_APPROX_SIMPLE")
            min_area = float(request.params.get("minArea", 100))
            max_area = float(request.params.get("maxArea", 10000))
            
            # 转换模式
            mode_map = {
                "RETR_EXTERNAL": cv2.RETR_EXTERNAL,
                "RETR_LIST": cv2.RETR_LIST,
                "RETR_CCOMP": cv2.RETR_CCOMP,
                "RETR_TREE": cv2.RETR_TREE
            }
            
            # 转换方法
            method_map = {
                "CHAIN_APPROX_NONE": cv2.CHAIN_APPROX_NONE,
                "CHAIN_APPROX_SIMPLE": cv2.CHAIN_APPROX_SIMPLE,
                "CHAIN_APPROX_TC89_L1": cv2.CHAIN_APPROX_TC89_L1,
                "CHAIN_APPROX_TC89_KCOS": cv2.CHAIN_APPROX_TC89_KCOS
            }
            
            # 查找轮廓
            contours, hierarchy = cv2.findContours(
                binary,
                mode_map.get(mode, cv2.RETR_EXTERNAL),
                method_map.get(method, cv2.CHAIN_APPROX_SIMPLE)
            )
            
            # 过滤轮廓
            filtered_contours = []
            for contour in contours:
                area = cv2.contourArea(contour)
                if min_area <= area <= max_area:
                    filtered_contours.append(contour)
            
            # 绘制轮廓
            result = np.zeros_like(img)
            cv2.drawContours(result, filtered_contours, -1, (0, 255, 0), 2)
            
            # 将轮廓点转换为列表并返回
            contours_data = []
            for contour in filtered_contours:
                contour_points = contour.reshape(-1, 2).tolist()
                contours_data.append({
                    'points': contour_points,
                    'area': cv2.contourArea(contour),
                    'perimeter': cv2.arcLength(contour, True)
                })
            
            # 将轮廓数据编码为 JSON 字符串
            result_data = {
                'image': cv2_to_base64(result),
                'contours_count': len(contours_data),
                'contours': contours_data
            }
            return {'result': json.dumps(result_data)}

        elif request.type == "blank":
            result = np.zeros_like(img)
            print('空白处理完成')

        elif request.type == "blur":
            kernel_size = int(request.params.get("kernelSize", 5))
            sigma_x = float(request.params.get("sigmaX", 0))
            sigma_y = float(request.params.get("sigmaY", 0))
            border_type = request.params.get("borderType", "BORDER_DEFAULT")
            
            # 转换边界类型
            border_map = {
                "BORDER_DEFAULT": cv2.BORDER_DEFAULT,
                "BORDER_CONSTANT": cv2.BORDER_CONSTANT,
                "BORDER_REPLICATE": cv2.BORDER_REPLICATE
            }
            border = border_map.get(border_type, cv2.BORDER_DEFAULT)
            
            if kernel_size % 2 == 0:
                kernel_size += 1  # 确保核大小为奇数
            print(f"模糊处理: kernel_size={kernel_size}, sigma_x={sigma_x}, sigma_y={sigma_y}, border_type={border_type}")
            result = cv2.GaussianBlur(img, (kernel_size, kernel_size), sigma_x, sigma_y, border)
            
        elif request.type == "erode":
            kernel_size = int(request.params.get("kernelSize", 3))
            iterations = int(request.params.get("iterations", 1))
            kernel_shape = request.params.get("kernelShape", "MORPH_RECT")
            anchor = request.params.get("anchor", {"x": -1, "y": -1})
            
            # 转换核形状
            shape_map = {
                "MORPH_RECT": cv2.MORPH_RECT,
                "MORPH_CROSS": cv2.MORPH_CROSS,
                "MORPH_ELLIPSE": cv2.MORPH_ELLIPSE
            }
            morph_shape = shape_map.get(kernel_shape, cv2.MORPH_RECT)
            
            print(f"腐蚀处理: kernel_size={kernel_size}, iterations={iterations}, kernel_shape={kernel_shape}, anchor={anchor}")
            kernel = cv2.getStructuringElement(morph_shape, (kernel_size, kernel_size))
            result = cv2.erode(img, kernel, iterations=iterations, anchor=(anchor["x"], anchor["y"]))
            
        elif request.type == "dilate":
            kernel_size = int(request.params.get("kernelSize", 3))
            iterations = int(request.params.get("iterations", 1))
            kernel_shape = request.params.get("kernelShape", "MORPH_RECT")
            anchor = request.params.get("anchor", {"x": -1, "y": -1})
            
            # 转换核形状
            shape_map = {
                "MORPH_RECT": cv2.MORPH_RECT,
                "MORPH_CROSS": cv2.MORPH_CROSS,
                "MORPH_ELLIPSE": cv2.MORPH_ELLIPSE
            }
            morph_shape = shape_map.get(kernel_shape, cv2.MORPH_RECT)
            
            print(f"膨胀处理: kernel_size={kernel_size}, iterations={iterations}, kernel_shape={kernel_shape}, anchor={anchor}")
            kernel = cv2.getStructuringElement(morph_shape, (kernel_size, kernel_size))
            result = cv2.dilate(img, kernel, iterations=iterations, anchor=(anchor["x"], anchor["y"]))
            
        elif request.type == "edge":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            threshold1 = int(request.params.get("threshold1", 100))
            threshold2 = int(request.params.get("threshold2", 200))
            aperture_size = int(request.params.get("apertureSize", 3))
            l2gradient = request.params.get("l2gradient", False)
            
            print(f"边缘检测: threshold1={threshold1}, threshold2={threshold2}, aperture_size={aperture_size}, l2gradient={l2gradient}")
            result = cv2.Canny(gray, threshold1, threshold2, apertureSize=aperture_size, L2gradient=l2gradient)
            
        elif request.type == "draw-rect":
            result = img.copy()
            x = int(request.params.get("x", 0))
            y = int(request.params.get("y", 0))
            width = int(request.params.get("width", 100))
            height = int(request.params.get("height", 100))
            color = request.params.get("color", [255, 0, 0])
            thickness = int(request.params.get("thickness", 2))
            line_type = request.params.get("lineType", "LINE_8")
            filled = request.params.get("filled", False)
            
            # 转换线型
            line_map = {
                "LINE_4": cv2.LINE_4,
                "LINE_8": cv2.LINE_8,
                "LINE_AA": cv2.LINE_AA
            }
            line = line_map.get(line_type, cv2.LINE_8)
            
            print(f"绘制矩形: x={x}, y={y}, width={width}, height={height}, color={color}, thickness={thickness}, line_type={line_type}, filled={filled}")
            cv2.rectangle(result, (x, y), (x + width, y + height), color, -1 if filled else thickness, line)
            
        elif request.type == "draw-circle":
            result = img.copy()
            x = int(request.params.get("x", 50))
            y = int(request.params.get("y", 50))
            radius = int(request.params.get("radius", 25))
            color = request.params.get("color", [0, 255, 0])
            thickness = int(request.params.get("thickness", 2))
            line_type = request.params.get("lineType", "LINE_8")
            filled = request.params.get("filled", False)
            
            # 转换线型
            line_map = {
                "LINE_4": cv2.LINE_4,
                "LINE_8": cv2.LINE_8,
                "LINE_AA": cv2.LINE_AA
            }
            line = line_map.get(line_type, cv2.LINE_8)
            
            print(f"绘制圆形: x={x}, y={y}, radius={radius}, color={color}, thickness={thickness}, line_type={line_type}, filled={filled}")
            cv2.circle(result, (x, y), radius, color, -1 if filled else thickness, line)
            
        elif request.type == "draw-line":
            result = img.copy()
            x1 = int(request.params.get("x1", 0))
            y1 = int(request.params.get("y1", 0))
            x2 = int(request.params.get("x2", 100))
            y2 = int(request.params.get("y2", 100))
            color = request.params.get("color", [0, 0, 255])
            thickness = int(request.params.get("thickness", 2))
            line_type = request.params.get("lineType", "LINE_8")
            
            # 转换线型
            line_map = {
                "LINE_4": cv2.LINE_4,
                "LINE_8": cv2.LINE_8,
                "LINE_AA": cv2.LINE_AA
            }
            line = line_map.get(line_type, cv2.LINE_8)
            
            print(f"绘制直线: x1={x1}, y1={y1}, x2={x2}, y2={y2}, color={color}, thickness={thickness}, line_type={line_type}")
            cv2.line(result, (x1, y1), (x2, y2), color, thickness, line)
            
        elif request.type in ["multiply", "screen", "overlay", "blend"]:
            # 获取第二张图片
            secondary_image = request.params.get("secondaryImage")
            if not secondary_image:
                raise HTTPException(status_code=400, detail="未提供第二张图片")
            
            # 解码第二张图片
            img2 = base64_to_cv2(secondary_image)
            print(f"第二张图片解码成功: shape={img2.shape}")
            # 确保两张图片大小相同
            if img.shape != img2.shape:
                img2 = cv2.resize(img2, (img.shape[1], img.shape[0]))
            
            # 根据不同的混合模式处理
            if request.type == "multiply":
                # 正片叠底
                opacity = float(request.params.get("opacity", 1.0))
                result = cv2.multiply(img, img2) / 255.0
                result = np.clip(result, 0, 255).astype(np.float32)
                img = img.astype(np.float32)
                result = cv2.addWeighted(img, 1 - opacity, result, opacity, 0)
                result = (result * 255).astype(np.uint8)
                print('正片叠底处理完成')
                
            elif request.type == "screen":
                # 滤色
                opacity = float(request.params.get("opacity", 1.0))
                result = 255 - cv2.multiply(255 - img, 255 - img2) / 255.0
                result = np.clip(result, 0, 255).astype(np.float32)
                img = img.astype(np.float32)
                result = cv2.addWeighted(img, 1 - opacity, result, opacity, 0)
                result = result.astype(np.uint8)
                print('滤色处理完成')
            elif request.type == "overlay":
                # 叠加
                opacity = float(request.params.get("opacity", 1.0))
                img = img.astype(float) / 255.0
                img2 = img2.astype(float) / 255.0
                
                mask = img <= 0.5
                result = np.zeros_like(img)
                result[mask] = 2 * img[mask] * img2[mask]
                result[~mask] = 1 - 2 * (1 - img[~mask]) * (1 - img2[~mask])
                img = img.astype(np.float32)
                result = result.astype(np.float32)
                result = cv2.addWeighted(img, 1 - opacity, result, opacity, 0)
                result = (result * 255).astype(np.uint8)
                print('叠加处理完成')
                
            elif request.type == "blend":
                # 普通混合
                ratio = float(request.params.get("ratio", 0.5))

                img = img.astype(np.float32)
                img2 = img2.astype(np.float32)
                result = cv2.addWeighted(img, 1 - ratio, img2, ratio, 0)
                result = np.clip(result, 0, 255).astype(np.uint8)
                print('普通混合处理完成')
            
        else:
            raise HTTPException(status_code=400, detail=f"不支持的处理类型: {request.type}")
            
        if result is None:
            raise HTTPException(status_code=500, detail="图像处理失败: result 为空")
            
        print("图像处理完成,开始编码返回...")
        # 将处理后的图像转换为 base64
        result_base64 = cv2_to_base64(result)
        print("图像编码完成")
        
        return {"result": result_base64}
        
    except ValueError as e:
        print(f"请求参数错误: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"处理过程出错: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"图像处理失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 