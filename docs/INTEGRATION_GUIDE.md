# Integration Guide for WebRTC-SIP API Solution

## Overview

This guide explains how to integrate your application with our WebRTC-SIP API solution for handling real-time communication.

## API Authentication

### Headers
```javascript
{
  'X-API-Key': 'your_api_key',
  'X-API-Secret': 'your_api_secret',
  'Content-Type': 'application/json'
}
```

## WebSocket Connection

1. Establish WebSocket connection:
```javascript
const ws = new WebSocket('wss://your-domain/api/v1/ws/calls/{callId}');

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleCallEvent(data);
};
```

2. Handle call events:
```javascript
function handleCallEvent(event) {
  switch(event.type) {
    case 'call.initialized':
      // Handle call initialization
      break;
    case 'call.connected':
      // Handle successful connection
      break;
    case 'call.ended':
      // Handle call termination
      break;
    case 'call.error':
      // Handle errors
      break;
  }
}
```

## API Endpoints

### 1. Initialize Call

```http
POST /api/v1/calls
Content-Type: application/json

{
  "name": "Customer Name",
  "phone": "+1234567890",
  "callType": "inbound"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "callId": "uuid-v4",
    "wsUrl": "wss://your-domain/api/v1/ws/calls/uuid-v4"
  }
}
```

### 2. End Call

```http
POST /api/v1/calls/{callId}/end
Content-Type: application/json
```

### 3. Get Call History

```http
GET /api/v1/call-logs?customerName=John&ani=1234567890
```

Response:
```json
{
  "success": true,
  "data": {
    "calls": [
      {
        "callId": "uuid-v4",
        "customerName": "John",
        "ani": "+1234567890",
        "callType": "inbound",
        "startTime": "2024-01-20T10:00:00Z",
        "endTime": "2024-01-20T10:05:00Z",
        "duration": 300,
        "status": "ended",
        "actions": [...]
      }
    ]
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {...}
  }
}
```

### Common Error Codes
- `INVALID_REQUEST`: Invalid request parameters
- `UNAUTHORIZED`: Authentication failed
- `CALL_NOT_FOUND`: Call ID not found
- `CONNECTION_ERROR`: WebSocket connection error
- `DATABASE_ERROR`: Database operation failed

## Rate Limiting

- Default limit: 100 requests per minute
- Headers:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time until limit resets

## Example Integration

### Browser Integration
```javascript
class CallManager {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://your-domain/api/v1';
  }

  async initializeCall(customerName, phoneNumber) {
    const response = await fetch(`${this.baseUrl}/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret
      },
      body: JSON.stringify({
        name: customerName,
        phone: phoneNumber,
        callType: 'inbound'
      })
    });

    const data = await response.json();
    if (data.success) {
      this.connectWebSocket(data.data.wsUrl);
      return data.data.callId;
    }
    throw new Error(data.error.message);
  }

  connectWebSocket(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleCallEvent(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  handleCallEvent(event) {
    switch(event.type) {
      case 'call.initialized':
        this.onCallInitialized(event);
        break;
      case 'call.connected':
        this.onCallConnected(event);
        break;
      case 'call.ended':
        this.onCallEnded(event);
        break;
      case 'call.error':
        this.onCallError(event);
        break;
    }
  }

  async endCall(callId) {
    const response = await fetch(`${this.baseUrl}/calls/${callId}/end`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret
      }
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error.message);
    }
  }

  async getCallHistory(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}/call-logs?${queryParams}`, {
      headers: {
        'X-API-Key': this.apiKey,
        'X-API-Secret': this.apiSecret
      }
    });

    return response.json();
  }
}
```

### Usage Example
```javascript
const callManager = new CallManager('your_api_key', 'your_api_secret');

// Initialize a call
try {
  const callId = await callManager.initializeCall('John Doe', '+1234567890');
  console.log('Call initialized:', callId);
} catch (error) {
  console.error('Failed to initialize call:', error);
}

// Get call history
try {
  const history = await callManager.getCallHistory({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  });
  console.log('Call history:', history);
} catch (error) {
  console.error('Failed to fetch call history:', error);
}
```

## Best Practices

1. Error Handling:
   - Implement proper error handling for all API calls
   - Handle WebSocket disconnections gracefully
   - Implement retry logic for failed requests

2. Security:
   - Store API credentials securely
   - Use HTTPS for all API calls
   - Validate all user inputs

3. Performance:
   - Implement connection pooling
   - Cache frequently accessed data
   - Use appropriate timeout values

4. Monitoring:
   - Log all API calls and responses
   - Monitor WebSocket connection status
   - Track error rates and types

## Testing

1. Test Environment:
   - Use test API credentials
   - Test with different network conditions
   - Verify error handling

2. Test Cases:
   - Call initialization
   - WebSocket events
   - Call termination
   - Error scenarios

## Support

For technical support:
- Check API documentation
- Review error logs
- Contact support team