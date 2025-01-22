import { create } from 'zustand';
import { Edge } from 'reactflow';

export interface NodeParams {
  [key: string]: {
    threshold?: number;
    maxValue?: number;
    method?: string;
    useOtsu?: boolean;
    kernelSize?: number;
    sigmaX?: number;
    sigmaY?: number;
    borderType?: string;
    iterations?: number;
    kernelShape?: string;
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
    color?: [number, number, number];
    thickness?: number;
    lineType?: string;
    filled?: boolean;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  };
}

interface ImageState {
  images: Record<string, string>;
  edges: Edge[];
  showNodesPreview: boolean;
  nodeParams: Record<string, NodeParams>;
  setImage: (nodeId: string, imageData: string) => void;
  getImage: (nodeId: string) => string | undefined;
  setEdges: (edges: Edge[]) => void;
  getConnectedNodeImage: (nodeId: string) => string | undefined;
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
    return get().images[nodeId];
  },

  setEdges: (edges: Edge[]) => {
    set({ edges });
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