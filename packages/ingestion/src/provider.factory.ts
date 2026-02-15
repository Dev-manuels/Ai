import { IngestionProvider } from './provider.interface';
import { ApiFootballAdapter } from './adapters/api-football.adapter';
import { MockProvider } from './adapters/mock.provider';

export class ProviderFactory {
  static getProvider(type: string): IngestionProvider {
    switch (type.toLowerCase()) {
      case 'api-football':
        return new ApiFootballAdapter(process.env.API_FOOTBALL_KEY || '');
      case 'mock':
        return new MockProvider();
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}
