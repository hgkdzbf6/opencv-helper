from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image

app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置为具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def base64_to_cv2(base64_str: str) -> np.ndarray:
    """将 base64 图像转换为 OpenCV 格式"""
    try:
        # 移除 base64 头部信息
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        # 解码 base64 数据
        img_data = base64.b64decode(base64_str)
        
        # 转换为 numpy 数组
        nparr = np.frombuffer(img_data, np.uint8)
        
        # 解码图像
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("无法解码图像数据")
            
        return img
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"图像解码失败: {str(e)}")

def cv2_to_base64(img: np.ndarray) -> str:
    """将 OpenCV 图像转换为 base64 格式"""
    try:
        # 编码图像
        _, buffer = cv2.imencode('.png', img)
        
        # 转换为 base64
        base64_str = base64.b64encode(buffer).decode('utf-8')
        
        return f"data:image/png;base64,{base64_str}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图像编码失败: {str(e)}")

@app.post("/process")
async def process_image(
    type: str,
    image: str,
    params: dict = {}
):
    """处理图像的主要端点"""
    try:
        # 将 base64 图像转换为 OpenCV 格式
        img = base64_to_cv2(image)
        result = None
        
        # 根据类型处理图像
        if type == "binary":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            threshold = params.get("threshold", 128)
            _, result = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
            
        elif type == "blur":
            kernel_size = params.get("kernelSize", 5)
            result = cv2.GaussianBlur(img, (kernel_size, kernel_size), 0)
            
        elif type == "erode":
            kernel_size = params.get("kernelSize", 3)
            iterations = params.get("iterations", 1)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
            result = cv2.erode(img, kernel, iterations=iterations)
            
        elif type == "dilate":
            kernel_size = params.get("kernelSize", 3)
            iterations = params.get("iterations", 1)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
            result = cv2.dilate(img, kernel, iterations=iterations)
            
        elif type == "edge":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            threshold1 = params.get("threshold1", 100)
            threshold2 = params.get("threshold2", 200)
            result = cv2.Canny(gray, threshold1, threshold2)
            
        elif type == "draw-rect":
            result = img.copy()
            x = params.get("x", 0)
            y = params.get("y", 0)
            width = params.get("width", 100)
            height = params.get("height", 100)
            color = params.get("color", [255, 0, 0])
            thickness = params.get("thickness", 2)
            cv2.rectangle(result, (x, y), (x + width, y + height), color, thickness)
            
        elif type == "draw-circle":
            result = img.copy()
            x = params.get("x", img.shape[1] // 2)
            y = params.get("y", img.shape[0] // 2)
            radius = params.get("radius", 50)
            color = params.get("color", [0, 255, 0])
            thickness = params.get("thickness", 2)
            cv2.circle(result, (x, y), radius, color, thickness)
            
        elif type == "draw-line":
            result = img.copy()
            x1 = params.get("x1", 0)
            y1 = params.get("y1", 0)
            x2 = params.get("x2", 100)
            y2 = params.get("y2", 100)
            color = params.get("color", [0, 0, 255])
            thickness = params.get("thickness", 2)
            cv2.line(result, (x1, y1), (x2, y2), color, thickness)
            
        elif type == "mask" or type == "invert-mask":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            threshold = params.get("threshold", 128)
            _, mask = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
            
            if type == "invert-mask":
                mask = cv2.bitwise_not(mask)
                
            result = cv2.bitwise_and(img, img, mask=mask)
            
        else:
            raise HTTPException(status_code=400, detail=f"不支持的处理类型: {type}")
            
        if result is None:
            raise HTTPException(status_code=500, detail="图像处理失败")
            
        # 将处理后的图像转换为 base64
        return {"result": cv2_to_base64(result)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 