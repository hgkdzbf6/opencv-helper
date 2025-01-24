import { Handle, Position } from 'reactflow';
import { useDataStore } from '../../store/imageStore';

interface InputNodeProps {
  id: string;
  data: { id: string };
  className?: string;
}

const InputNode = ({ data, className }: InputNodeProps) => {
  const image = useDataStore((state) => state.getData(data.id));
  const showNodesPreview = useDataStore((state) => state.showNodesPreview);

  return (
    <div className={`px-4 py-2 rounded border border-gray-200 bg-white font-medium shadow-sm ${className || ''}`}>
      <div className="flex flex-col items-center">
        <div className="mb-2">输入图片</div>
        {showNodesPreview && image && (
          <div className="w-[100px] h-[100px] bg-gray-50 rounded overflow-hidden">
            <img 
              src={image.image} 
              alt="输入" 
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ right: '-8px', background: '#555' }}
      />
    </div>
  );
};

export default InputNode; 