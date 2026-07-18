class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = [];
  }

  connect() {
    if (this.ws) return;

    this.ws = new WebSocket('ws://localhost:8000/ws/notifications');

    this.ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.listeners.forEach(listener => listener(data));
      } catch (err) {
        console.error('WebSocket parse error', err);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket Disconnected. Reconnecting...');
      this.ws = null;
      setTimeout(() => this.connect(), 5000);
    };
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

export const wsService = new WebSocketService();
