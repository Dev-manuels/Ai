import os
from openai import OpenAI

class ReasoningEngine:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def generate_reasoning(self, match_data, prediction_data):
        if not self.client:
            return f"Statistical model identifies {prediction_data['ev']:.2%} EV based on historical performance and current market inefficiency."

        prompt = f"Professional analysis for {match_data['home_team']} vs {match_data['away_team']}..."
        # Simplified for now
        return "Reasoning generated."
