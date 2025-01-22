import { create } from 'zustand';
import { Edge } from 'reactflow';

interface NodeParams {
  binary?: {
    threshold: number;
  };
  blur?: {
    kernelSize: number;
  };
}

interface ImageState {
  images: Record<string, string>;
  edges: Edge[];
  showNodesPreview: boolean;
  nodeParams: Record<string, NodeParams>;
  setImage: (nodeId: string, imageData: string) => void;
  getImage: (nodeId: string, ignorePreviewSetting?: boolean) => string | undefined;
  setEdges: (edges: Edge[]) => void;
  getConnectedNodeImage: (nodeId: string, ignorePreviewSetting?: boolean) => string | undefined;
  getSourceNode: (nodeId: string) => string | undefined;
  toggleNodesPreview: () => void;
  setNodeParams: (nodeId: string, params: NodeParams) => void;
  getNodeParams: (nodeId: string) => NodeParams | undefined;
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: {},
  edges: [],
  showNodesPreview: true,
  nodeParams: {},

  setImage: (nodeId: string, imageData: string) => {
    set((state) => ({
      images: {
        ...state.images,
        [nodeId]: imageData,
      },
    }));
  },

  getImage: (nodeId: string) => {
    const state = get();
    return state.images[nodeId];
  },

  setEdges: (edges: Edge[]) => {
    set({ edges });
  },

  getSourceNode: (nodeId: string) => {
    const edge = get().edges.find(edge => edge.target === nodeId);
    return edge?.source;
  },

  getConnectedNodeImage: (nodeId: string) => {
    const state = get();
    const sourceNodeId = state.edges.find(edge => edge.target === nodeId)?.source;
    return sourceNodeId ? state.images[sourceNodeId] : undefined;
  },

  toggleNodesPreview: () => {
    set((state) => ({ showNodesPreview: !state.showNodesPreview }));
  },

  setNodeParams: (nodeId: string, params: NodeParams) => {
    set((state) => ({
      nodeParams: {
        ...state.nodeParams,
        [nodeId]: params,
      },
    }));
  },

  getNodeParams: (nodeId: string) => {
    return get().nodeParams[nodeId];
  },
})); 