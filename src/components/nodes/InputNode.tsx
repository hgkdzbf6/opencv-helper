import { Handle, Position } from 'reactflow';
import { useImageStore } from '../../store/imageStore';

interface InputNodeProps {
  id: string;
  data: { id: string };
  className?: string;
}

const InputNode = ({ data, className }: InputNodeProps) => {
  const image = useImageStore((state) => state.getImage(data.id));

  return (
    <div className={`px-4 py-2 rounded border border-gray-200 bg-white font-medium shadow-sm ${className || ''}`}>
      <Handle type="source" position={Position.Right} />
      <div className="flex flex-col items-center">
        <div className="mb-2">输入图片</div>
        {image && (
          <div className="w-[100px] h-[100px] bg-gray-50 rounded overflow-hidden">
            <img 
              src={image} 
              alt="输入" 
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InputNode; 