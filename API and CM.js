// Call Management
POST /api/v1/calls
Body: {
  name: string,
  phone: string,
  callType: "audio"|"video"
}

// Call Status
GET /api/v1/calls/:callId

// Call Control
POST /api/v1/calls/:callId/actions
Body: {
  action: "mute"|"unmute"|"hangup"|"dtmf",
  dtmfDigit?: string
}

// WebSocket Connection
WS /api/v1/ws/calls/:callId

/routes
  /api
    /v1
      calls.js       // Call management endpoints
      websocket.js   // WebSocket handling
  index.js           // Route aggregation

  {
  success: boolean,
  data: any,
  error?: {
    code: string,
    message: string
  },
  meta: {
    timestamp: string,
    requestId: string
  }
}


// Initialize a call
POST /api/v1/calls
{
  "name": "John Doe",
  "phone": "+1234567890",
  "callType": "audio"
}

// Response
{
  "success": true,
  "data": {
    "callId": "call_123",
    "status": "initializing",
    "wsUrl": "wss://your-domain/api/v1/ws/calls/call_123"
  },
  "meta": {
    "timestamp": "2024-01-20T10:00:00Z",
    "requestId": "req_abc123"
  }
}

// Events from server
{
  type: "call_status",
  data: {
    status: "connecting"|"connected"|"failed"|"ended",
    timestamp: string
  }
}

// Events from client
{
  type: "dtmf",
  data: {
    digit: string
  }
}