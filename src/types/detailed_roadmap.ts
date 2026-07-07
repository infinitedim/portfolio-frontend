export interface Root {
  _id: string;
  title: Title;
  description: string;
  slug: string;
  nodes: Node[];
  edges: Edge[];
  draft: unknown;
  createdAt: string;
  updatedAt: string;
  dimensions: Dimensions;
  order: number;
  questions: Array<unknown>;
  relatedRoadmaps: string[];
  seo: Seo;
  type: string;
  status: string;
  courses: Array<unknown>;
  aiCourses: string[];
}

export interface Title {
  card: string;
  page: string;
  _id: string;
}

export interface Node {
  id: string;
  type: string;
  position: Position;
  selected: boolean;
  selectable: boolean;
  draggable?: boolean;
  deletable?: boolean;
  data: Data;
  zIndex: number;
  width?: number;
  height?: number;
  measured: Measured;
  dragging: boolean;
  resizing?: boolean;
  focusable: boolean;
  style?: Style2;
  positionAbsolute?: PositionAbsolute;
}

export interface Position {
  x: number;
  y: number;
}

export interface Data {
  label: string;
  style?: Style;
  oldId?: string;
  legend?: Legend;
  href?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  legends?: Legend2[];
}

export interface Style {
  fontSize?: number;
  justifyContent?: string;
  textAlign?: string;
  borderColor?: string;
  backgroundColor?: string;
  strokeDasharray?: string;
  strokeLinecap?: string;
  strokeWidth?: number;
  stroke?: string;
}

export interface Legend {
  id: string;
  color: string;
  label: string;
  position: string;
}

export interface Legend2 {
  id: string;
  color: string;
  label: string;
}

export interface Measured {
  width: number;
  height: number;
}

export interface Style2 {
  width: number;
  height?: number;
}

export interface PositionAbsolute {
  x: number;
  y: number;
}

export interface Edge {
  style: Style3;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  data: Data2;
  id: string;
  selected: boolean;
  focusable: boolean;
  selectable: boolean;
}

export interface Style3 {
  strokeDasharray: string;
  strokeLinecap: string;
  strokeWidth: number;
  stroke: string;
}

export interface Data2 {
  edgeStyle: string;
}

export interface Dimensions {
  height: number;
  width: number;
}

export interface Seo {
  title: string;
  description: string;
  keywords: string[];
  _id: string;
}
