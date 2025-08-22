import WebSocket from 'ws';

const url = process.env.CHAT_API_URL;
if (!url) {
  console.error('CHAT_API_URL not defined');
  process.exit(1);
}

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('Connected');
  ws.send(JSON.stringify({ message: 'test-message' }));
});

ws.on('message', (data: WebSocket.RawData) => {
  const message = data.toString();
  console.log('Received:', message);
  ws.close();
});

ws.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

ws.on('error', (err: Error) => {
  console.error('WebSocket error:', err);
  process.exit(1);
});
