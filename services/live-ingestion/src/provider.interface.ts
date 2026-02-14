export interface LiveEvent {
  fixtureId: string;
  type: 'GOAL' | 'CARD' | 'CORNER' | 'SHOT' | 'SITUATION' | 'PRESSURE';
  timestamp: number;
  data: any;
}

export interface LiveOdds {
  fixtureId: string;
  bookmaker: string;
  market: string;
  values: {
    selection: string;
    odds: number;
    depth?: {
      price: number;
      volume: number;
    }[];
  }[];
  timestamp: number;
}

export interface LiveIngestionProvider {
  connect(): Promise<void>;
  onEvent(callback: (event: LiveEvent) => void): void;
  onOdds(callback: (odds: LiveOdds) => void): void;
}
