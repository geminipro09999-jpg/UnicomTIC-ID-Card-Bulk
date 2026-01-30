export interface Participant {
  name: string;
  id: string | null;
  date: string | null;
}

export interface ManualGridConfig {
  enabled: boolean;
  cols: number;
  rows: number;
}

export interface FontSizes {
  name: number;
  id: number;
  date: number;
}

export interface Position {
  x: number;
  y: number;
}

export type CutMarkType = 'none' | 'border' | 'crop';

export interface AppSettings {
  pageSize: string;
  cardWidthMM: number;
  cardHeightMM: number;
  manualGrid: ManualGridConfig;
  cutMarkType: CutMarkType;
  logoSize: number;
  logoPos: Position;
  fontSizes: FontSizes;
  namePos: Position;
  idPos: Position;
  globalDate: string;
  startId: string;
}

export interface LayoutConfig {
  width: number;
  height: number;
  name: string;
  cols: number;
  rows: number;
  maxCols: number;
  maxRows: number;
  cardsPerPage: number;
  margin: number;
  gap: number;
}

export interface ColumnMapping {
  name: string;
  id: string;
  date: string;
}