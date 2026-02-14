import time

class LiveRiskManager:
    def __init__(self, drawdown_threshold=0.15, exposure_limit=0.05):
        self.drawdown_threshold = drawdown_threshold
        self.exposure_limit = exposure_limit
        self.active_exposure = 0.0
        self.circuit_breaker_active = False

    def check_signal(self, fixture_id: str, signal: dict, portfolio_state: dict):
        """
        Validates if a signal passes risk controls.
        """
        if self.circuit_breaker_active:
            return False, "Circuit breaker active"

        # Check for extreme volatility in signal
        if signal.get('ev', 0) > 0.5: # Suspect EV > 50%
            return False, "Extreme volatility detected - possible mispricing or data error"

        # Check portfolio drawdown
        current_drawdown = portfolio_state.get('drawdown', 0)
        if current_drawdown > self.drawdown_threshold:
            self.circuit_breaker_active = True
            return False, "Portfolio drawdown exceeded threshold"

        # Check match-specific regime (simplified)
        # In a real system, we'd check recent odds volatility here

        return True, "Risk check passed"

class RegimeDetector:
    def __init__(self):
        self.odds_history = {}

    def is_unstable(self, fixture_id: str, current_odds: float):
        if fixture_id not in self.odds_history:
            self.odds_history[fixture_id] = []

        history = self.odds_history[fixture_id]
        history.append((time.time(), current_odds))

        # Keep last 10 updates
        if len(history) > 10:
            history.pop(0)

        if len(history) < 5:
            return False

        # Check for rapid movement (> 10% in last minute)
        recent_changes = [abs(history[i][1] - history[i-1][1])/history[i-1][1]
                         for i in range(1, len(history))]

        if max(recent_changes) > 0.10:
            return True

        return False
