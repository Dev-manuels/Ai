import redis
import json
import time
from .models.live_engine import LiveMatchStateEngine
from .models.dixon_coles import DixonColesModel
from .execution import LiveEVEngine, ExecutionSimulator
from .risk import LiveRiskManager, RegimeDetector
from .sharp_money import SharpMoneyEngine
from .market_intelligence import MarketIntelligenceEngine
from .research.experimentation import ExperimentManager

class LiveInferenceService:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)
        self.event_stream = 'live_events'
        self.odds_stream = 'live_odds'
        self.group_name = 'ml_service_group'
        self.consumer_name = 'ml_consumer_1'

        # Initialize models and engines
        self.pre_match_model = DixonColesModel()
        self.live_engine = LiveMatchStateEngine(self.pre_match_model)
        self.ev_engine = LiveEVEngine()
        self.execution_sim = ExecutionSimulator()
        self.risk_manager = LiveRiskManager()
        self.regime_detector = RegimeDetector()
        self.sharp_engine = SharpMoneyEngine()
        self.market_intel = MarketIntelligenceEngine()
        self.experiment_manager = ExperimentManager()

        # Match states cache: fixtureId -> { score, elapsed, events, current_probs }
        self.match_states = {}

    def setup(self):
        try:
            self.redis.xgroup_create(self.event_stream, self.group_name, id='0', mkstream=True)
        except redis.exceptions.ResponseError:
            pass # Already exists

    def run(self):
        print("ML Live Inference Service running...")
        while True:
            try:
                # Read from both streams
                streams = self.redis.xreadgroup(self.group_name, self.consumer_name,
                                               {self.event_stream: '>', self.odds_stream: '>'},
                                               count=10, block=5000)
                if not streams:
                    continue

                for stream_name, messages in streams:
                    for msg_id, data in messages:
                        fixture_id = data[b'fixtureId'].decode()

                        if stream_name.decode() == self.event_stream:
                            self._handle_event(fixture_id, data)
                        elif stream_name.decode() == self.odds_stream:
                            self._handle_odds(fixture_id, data)

                        self.redis.xack(stream_name, self.group_name, msg_id)
            except Exception as e:
                print(f"Inference Error: {e}")
                time.sleep(1)

    def _handle_event(self, fixture_id, data):
        event_type = data[b'type'].decode()
        event_data = json.loads(data[b'data'].decode())

        if fixture_id not in self.match_states:
            self.match_states[fixture_id] = {'score': [0, 0], 'elapsed': 0, 'events': [], 'current_probs': None}

        state = self.match_states[fixture_id]
        state['events'].append({'type': event_type, 'data': event_data})

        # Update elapsed time if available in event
        if 'elapsed' in event_data:
            state['elapsed'] = event_data['elapsed']

        if event_type == 'GOAL':
            state['score'] = event_data['score']

        # Re-calculate probabilities
        probs = self.live_engine.predict_live_probs('Home', 'Away', state['score'], state['elapsed'])
        state['current_probs'] = probs
        print(f"Updated Probs for {fixture_id}: {probs}")

        # Run shadow experiments
        self.experiment_manager.run_shadow_inference(fixture_id, {
            'home_team': 'Home',
            'away_team': 'Away',
            'score': state['score'],
            'elapsed': state['elapsed']
        })

        # Publish to internal live_predictions stream
        self.redis.xadd('live_predictions', {
            'fixtureId': fixture_id,
            'probs': json.dumps(probs),
            'timestamp': str(time.time())
        })

    def _handle_odds(self, fixture_id, data):
        bookmaker = data[b'bookmaker'].decode()
        market_odds = json.loads(data[b'values'].decode())
        state = self.match_states.get(fixture_id)

        # Update order book depth if available
        if bookmaker == 'Betfair':
            self.execution_sim.update_order_book(fixture_id, market_odds)

        # Track prices for leadership and intelligence
        for selection_odds in market_odds:
            sel = selection_odds['selection']
            price = selection_odds['odds']

            self.sharp_engine.add_price(fixture_id, bookmaker, sel, price)
            self.market_intel.update_consensus(fixture_id, bookmaker, sel, price)

            # Detect shading/staleness for soft books
            if bookmaker not in ['Pinnacle', 'Betfair']:
                intel = self.market_intel.detect_shading(fixture_id, bookmaker, sel, price)
                if intel and intel['is_stale']:
                    print(f"STALE LINE DETECTED: {bookmaker} {fixture_id} {sel} @ {price}")

        if not state or not state['current_probs']:
            return

        # Periodically check for sharp signals (e.g., if we see Betfair movement)
        if bookmaker == 'Betfair':
            for sel in ['home', 'draw', 'away']:
                leadership = self.sharp_engine.detect_leadership(fixture_id, sel, 'Betfair', 'Pinnacle')
                if leadership and leadership['leadership_score'] > 0.7:
                    print(f"SHARP SIGNAL: Betfair leading Pinnacle for {fixture_id} {sel}")

        ev_signals = self.ev_engine.calculate_ev(state['current_probs'], market_odds)

        for signal in ev_signals:
            if signal['ev'] > 0.05: # 5% EV threshold
                # Risk check
                is_unstable = self.regime_detector.is_unstable(fixture_id, signal['odds'])
                if is_unstable:
                    print(f"Risk Block: Unstable market for {fixture_id}")
                    continue

                passed, reason = self.risk_manager.check_signal(fixture_id, signal, {})
                if not passed:
                    print(f"Risk Block: {reason}")
                    continue

                print(f"LIVE EV SIGNAL: {fixture_id} {signal}")

                # Simulate execution
                exec_result = self.execution_sim.simulate_execution(
                    fixture_id, signal['selection'], signal['odds']
                )

                # Publish signal and execution result
                self.redis.xadd('live_signals', {
                    'fixtureId': fixture_id,
                    'signal': json.dumps(signal),
                    'execution': json.dumps(exec_result),
                    'timestamp': str(time.time())
                })

if __name__ == "__main__":
    import os
    service = LiveInferenceService(os.getenv('REDIS_URL', 'redis://localhost:6379'))
    service.setup()
    service.run()
