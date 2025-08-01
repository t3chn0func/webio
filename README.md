# WebRTC SIP API

A RESTful API service that provides WebRTC-based voice and video calling capabilities with SIP integration.

## Features

- RESTful API for call management
- WebSocket support for real-time call events
- WebRTC and SIP integration
- Secure communication with TLS/WSS
- Rate limiting and security middleware
- Error handling and logging

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn package manager
- A SIP server (e.g., Ribbon SBC) for call routing

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the configuration:
   ```bash
   cp .env.example .env
   ```

## Configuration

Update the following environment variables in `.env`:

- `PORT`: API server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `SIP_DOMAIN`: Your SIP server domain
- `SIP_WSS_URL`: WebSocket URL for SIP server
- `API_KEY`: Your API key for authentication

## API Endpoints

### Call Management

#### Initialize Call
```http
POST /api/v1/calls
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "callType": "audio"
}
```

#### Get Call Status
```http
GET /api/v1/calls/:callId
```

#### Control Call
```http
POST /api/v1/calls/:callId/actions
Content-Type: application/json

{
  "action": "mute|unmute|hangup|dtmf",
  "dtmfDigit": "0-9*#" // Required for dtmf action
}
```

### WebSocket Events

Connect to WebSocket endpoint:
```
wss://your-api-server/api/v1/ws/calls/:callId
```

Event Types:
- `connection_established`: Initial connection success
- `call_status`: Call status updates
- `dtmf_processed`: DTMF processing confirmation
- `error`: Error notifications

## Development

1. Start development server:
   ```bash
   npm run dev
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Lint code:
   ```bash
   npm run lint
   ```

## Security

- CORS protection
- Helmet security headers
- Rate limiting
- Input validation
- Secure WebSocket connections

## Error Handling

API errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  },
  "meta": {
    "timestamp": "ISO datetime",
    "requestId": "UUID"
  }
}
```

## License

MIT License