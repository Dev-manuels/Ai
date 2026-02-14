import axios from 'axios';

export class MLClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://ml:8000';
  }

  async getPrediction(homeTeam: string, awayTeam: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/predict`, {
        home_team: homeTeam,
        away_team: awayTeam
      });
      return response.data;
    } catch (error) {
      console.error('ML Service Error:', error);
      throw new Error('Failed to fetch prediction from ML service');
    }
  }

  async getReasoning(matchData: any, predictionData: any) {
    try {
      const response = await axios.post(`${this.baseUrl}/reasoning`, {
        match_data: matchData,
        prediction_data: predictionData
      });
      return response.data.reasoning;
    } catch (error) {
      return 'Statistical reasoning unavailable at this time.';
    }
  }
}
