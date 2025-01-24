# Auto-Drawer 图像处理工具

一个基于 Web 的图像处理工具，支持多种图像处理操作，包括基础处理、绘图工具、混合模式等功能。使用流程图的方式让图像处理变得简单直观。

## 功能特点

- 🎨 基础图像处理
  - 二值化处理
  - 高斯模糊
  - 腐蚀和膨胀
  - 边缘检测

- ✏️ 绘图工具
  - 矩形绘制
  - 圆形/椭圆绘制
  - 直线绘制

- 🎭 混合模式
  - 正片叠底
  - 滤色
  - 叠加
  - 普通混合

- 📝 其他功能
  - 实时预览
  - 参数调节
  - 代码生成（支持 Python 和 C++）
  - 流程图保存和加载

## 使用方法

1. 启动服务
   ```bash
   # 启动后端服务
   cd backend
   python main.py

   # 启动前端服务
   npm install
   npm start
   ```

2. 基本操作
   - 从左侧节点列表拖拽节点到画布
   - 连接节点的输入输出端口
   - 在右侧面板调整参数
   - 实时查看处理效果

3. 混合模式使用
   - 拖入两个输入节点和一个混合节点
   - 将第一个输入连接到混合节点的左侧端口
   - 将第二个输入连接到混合节点的顶部端口
   - 调整混合参数

## 环境要求

### 后端
- Python 3.8+
- FastAPI
- OpenCV
- NumPy

### 前端
- Node.js 16+
- React 18
- TypeScript
- Tailwind CSS

## 安装步骤

1. 克隆仓库
   ```bash
   git clone <repository-url>
   cd auto-drawer
   ```

2. 安装后端依赖
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. 安装前端依赖
   ```bash
   cd ..
   npm install
   ```

4. 创建配置文件
   ```bash
   cp .env.example .env
   ```
   根据需要修改配置文件中的参数

## 开发说明

### 目录结构
```
auto-drawer/
├── src/                # 前端源代码
│   ├── components/     # React 组件
│   ├── store/         # 状态管理
│   └── utils/         # 工具函数
├── backend/           # 后端源代码
│   └── main.py        # 主程序
├── public/           # 静态资源
└── package.json     # 项目配置
```

### 开发模式
```bash
# 启动后端开发服务器
cd backend
python main.py

# 启动前端开发服务器
npm run dev
```

### 构建部署
```bash
# 构建前端
npm run build

# 部署后端
cd backend
python main.py
```

## 常见问题

1. 图像上传失败
   - 检查图片格式是否支持
   - 确认图片大小是否超过限制

2. 节点连接问题
   - 确保连接方向正确
   - 检查节点类型是否匹配

3. 混合模式无效果
   - 确认两个输入端口都已连接
   - 检查输入图像是否正确加载

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 联系方式

- 作者：[zbf]
- 邮箱：[hgkdzbf6@163.com]
- GitHub：[https://github.com/hgkdzbf6]

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
