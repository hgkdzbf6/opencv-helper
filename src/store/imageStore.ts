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
    apertureSize?: number;
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
    isGrayscale?: boolean;
    mode?: string;
    contourMethod?: string;
    minArea?: number;
    maxArea?: number;
  };
}

interface DataState {
  data_dict: Record<string, { image?: string; [key: string]: any }>;
  edges: Edge[];
  showNodesPreview: boolean;
  nodeParams: Record<string, NodeParams>;
  setData: (nodeId: string, data: { image?: string; [key: string]: any }) => void;
  getData: (nodeId: string, ignorePreviewSetting?: boolean) => { image?: string; [key: string]: any } | undefined;
  setEdges: (edges: Edge[]) => void;
  getConnectedNodeSourceData: (nodeId: string, ignorePreviewSetting?: boolean) => { image?: string; [key: string]: any } | undefined;
  getConnectedNodeSecondaryData: (nodeId: string, ignorePreviewSetting?: boolean) => { image?: string; [key: string]: any } | undefined;
  toggleNodesPreview: () => void;
  setNodeParams: (nodeId: string, params: NodeParams) => void;
  getNodeParams: (nodeId: string) => NodeParams | undefined;
}

export const useDataStore = create<DataState>((set, get) => ({
  data_dict: {},
  edges: [],
  showNodesPreview: true,
  nodeParams: {},

  setData: (nodeId: string, data: string | { image?: string; [key: string]: any }) => {
    if (typeof data === 'string') {
      set((state) => ({
        data_dict: {
          ...state.data_dict,
          [nodeId]: { image: data },
        },
      }));
    } else {
      set((state) => ({
        data_dict: {
          ...state.data_dict,
          [nodeId]: data,
        },
      }));
    }
  },

  getData: (nodeId: string, ignorePreviewSetting = false) => {
    const state = get();
    return (ignorePreviewSetting || state.showNodesPreview) ? state.data_dict[nodeId] : undefined;
  },

  setEdges: (edges: Edge[]) => {
    set({ edges });
  },

  getConnectedNodeSourceData: (nodeId: string, ignorePreviewSetting = false) => {
    const state = get();
    if (!ignorePreviewSetting && !state.showNodesPreview) return undefined;
    
    const edges = state.edges;
    const sourceEdge = edges.find(edge => edge.target === nodeId && edge.targetHandle !== 'secondary');
    if (!sourceEdge) return undefined;
    return state.data_dict[sourceEdge.source];
  },

  getConnectedNodeSecondaryData: (nodeId: string, ignorePreviewSetting = false) => {
    const state = get();
    if (!ignorePreviewSetting && !state.showNodesPreview) return undefined;
    
    const edges = state.edges;
    const sourceEdge = edges.find(edge => edge.target === nodeId && edge.targetHandle === 'secondary');
    if (!sourceEdge) return undefined;
    return state.data_dict[sourceEdge.source];
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