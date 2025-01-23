import { create } from 'zustand';
import { Edge } from 'reactflow';

export interface NodeParams {
  [key: string]: {
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
    color?: [number, number, number];
    thickness?: number;
    lineType?: 'LINE_4' | 'LINE_8' | 'LINE_AA';
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
    const edge = state.edges.find(edge => edge.target === nodeId);
    if (!edge) {
      return undefined;
    }
    return state.images[edge.source];
  },

  toggleNodesPreview: () => {
    set((state) => ({ 
      showNodesPreview: !state.showNodesPreview 
    }));
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