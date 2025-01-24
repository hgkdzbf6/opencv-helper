import { Handle, Position } from 'reactflow';
import { useDataStore } from '../../store/imageStore';

interface OutputNodeProps {
  id: string;
  data: { id: string };
  className?: string;
}

const OutputNode = ({ data, className }: OutputNodeProps) => {
  const connectedImage = useDataStore((state) => state.getConnectedNodeSourceData(data.id));

  return (
    <div className={`px-4 py-2 rounded border border-gray-200 bg-white font-medium shadow-sm ${className || ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="flex flex-col items-center">
        <div className="mb-2">输出图片</div>
        {connectedImage && (
          <div className="w-[100px] h-[100px] bg-gray-50 rounded overflow-hidden">
            <img 
              src={connectedImage.image} 
              alt="输出" 
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputNode; 