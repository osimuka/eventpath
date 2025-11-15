"""Python SDK for service-analytics event tracking."""

import time
import threading
from typing import Dict, Any, Optional
import requests


class Analytics:
    """Analytics client for Python applications."""

    def __init__(self, api_url: str, api_key: str, batch_size: int = 10, flush_interval: int = 5):
        """
        Initialize analytics client.

        Args:
            api_url: Base URL for analytics API
            api_key: API key for authentication
            batch_size: Number of events to batch before sending
            flush_interval: Seconds between automatic flushes
        """
        self.api_url = api_url
        self.api_key = api_key
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.queue = []
        self.user_id = None
        self.session_id = self._generate_session_id()
        self.lock = threading.Lock()
        self.flush_thread = None
        self._start_flush_timer()

    def identify(self, user_id: str, traits: Optional[Dict[str, Any]] = None) -> None:
        """
        Identify user for tracking.

        Args:
            user_id: User identifier
            traits: Optional user attributes
        """
        self.user_id = user_id

    def track(self, event_name: str, properties: Optional[Dict[str, Any]] = None) -> None:
        """
        Track an event.

        Args:
            event_name: Name of the event
            properties: Optional event properties
        """
        event = {
            "eventName": event_name,
            "properties": properties or {},
            "userId": self.user_id,
            "sessionId": self.session_id,
            "timestamp": time.time(),
        }

        with self.lock:
            self.queue.append(event)

            if len(self.queue) >= self.batch_size:
                self.flush()

    def flush(self) -> None:
        """Flush queued events to server."""
        if not self.queue:
            return

        with self.lock:
            events = self.queue.copy()
            self.queue.clear()

        try:
            response = requests.post(
                f"{self.api_url}/api/v1/events",
                json={"events": events},
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": self.api_key,
                },
                timeout=10,
            )
            response.raise_for_status()
        except Exception as e:
            print(f"Failed to send events: {e}")
            # Re-add events to queue on failure
            with self.lock:
                self.queue = events + self.queue

    def _start_flush_timer(self) -> None:
        """Start background flush timer."""

        def flush_periodically():
            while True:
                time.sleep(self.flush_interval)
                self.flush()

        self.flush_thread = threading.Thread(target=flush_periodically, daemon=True)
        self.flush_thread.start()

    @staticmethod
    def _generate_session_id() -> str:
        """Generate unique session ID."""
        import uuid

        return f"session-{uuid.uuid4()}"


def init(api_url: str, api_key: str) -> Analytics:
    """Initialize analytics client."""
    return Analytics(api_url, api_key)
