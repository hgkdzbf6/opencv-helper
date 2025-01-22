import { ReactFlowProvider } from 'reactflow';
import Flow from './components/Flow';

function App() {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
