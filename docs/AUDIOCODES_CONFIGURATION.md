# AudioCodes Mediant SBC Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring AudioCodes Mediant Session Border Controllers (SBCs) to work with our WebRTC-SIP API solution.

## Prerequisites

- AudioCodes Mediant SBC (supported models: Mediant 500/800/2600/4000)
- Latest firmware installed
- Valid SSL certificate for WebSocket TLS
- Network access between SBC and API server

## SBC Basic Configuration

### 1. Network Settings

1. Configure SBC IP address:
   - Access the Web interface
   - Navigate to Network Settings > IP Interfaces
   - Configure OAMP, Media, and Control interfaces

2. Configure DNS settings:
   ```
   # CLI commands
   configure network
   dns dns-server-1 <primary-dns>
   dns dns-server-2 <secondary-dns>
   ```

### 2. SSL/TLS Configuration

1. Install SSL certificates:
   - Navigate to Security > TLS Contexts
   - Create new TLS context for WebSocket
   - Upload server certificate and private key
   - Configure trusted root certificates

2. Configure TLS profile:
   ```
   # CLI commands
   configure network
   tls-context 1
   name "WebSocket-TLS"
   tls-version tls1_2
   ```

## WebSocket Configuration

### 1. SIP Interface Configuration

```
# CLI commands
 configure voip
 sip-interface "WebRTC_IF"
 udp-port 5060
 tcp-port 5060
 tls-port 5061
 interface "WebRTC"
```

### 2. WebSocket Settings

1. Enable WebSocket transport:
   ```
   # CLI commands
   configure voip
   sip-definition settings
   websocket-transport enable
   ```

2. Configure WebSocket parameters:
   - WebSocket port: 443
   - Keep-alive interval: 60 seconds
   - TLS Context: "WebSocket-TLS"

## SIP Routing Configuration

### 1. IP Groups

1. Create IP Group for WebRTC clients:
   ```
   # CLI commands
   configure voip
   ip-group "WebRTC_Clients"
   type "Server"
   protocol "WebSocket"
   media-realm "WebRTC_Realm"
   ```

2. Create IP Group for SIP trunk:
   ```
   configure voip
   ip-group "SIP_Trunk"
   type "Server"
   protocol "UDP"
   media-realm "SIP_Realm"
   ```

### 2. Routing Rules

1. Configure routing from WebRTC to SIP:
   ```
   # CLI commands
   configure voip
   ip-to-ip-routing 1
   src-ip-group "WebRTC_Clients"
   dst-ip-group "SIP_Trunk"
   ```

2. Configure routing from SIP to WebRTC:
   ```
   configure voip
   ip-to-ip-routing 2
   src-ip-group "SIP_Trunk"
   dst-ip-group "WebRTC_Clients"
   ```

## Media Configuration

### 1. Media Realms

1. Create WebRTC media realm:
   ```
   # CLI commands
   configure voip
   media-realm "WebRTC_Realm"
   ipv4if "WebRTC"
   port-range-start 6000
   port-range-end 7000
   ```

2. Configure SRTP settings:
   ```
   configure voip
   media security
   media-security-enable
   srtp-tx-rtp-auth enable
   srtp-tx-rtcp-auth enable
   ```

### 2. Transcoding Settings

1. Configure supported codecs:
   ```
   # CLI commands
   configure voip
   coder-group "WebRTC_Coders"
   g711-alaw
   g711-ulaw
   opus
   ```

2. Apply codec group to IP Groups:
   ```
   configure voip
   ip-group 1
   coders-group-name "WebRTC_Coders"
   ```

## Integration with WebRTC-SIP API

### 1. API Connection Settings

1. Configure WebSocket URL:
   ```
   # Environment variables in API
   SIP_WSS_URL=wss://sbc-domain:443/sip
   ```

2. Configure SIP domain:
   ```
   # Environment variables in API
   SIP_DOMAIN=your.sip.domain
   ```

### 2. Authentication

1. Configure SIP authentication:
   ```
   # CLI commands
   configure voip
   ip-group "WebRTC_Clients"
   authentication enable
   username "api-user"
   password "api-password"
   ```

2. Update API configuration:
   ```
   # Environment variables in API
   SIP_AUTH_USER=api-user
   SIP_AUTH_PASSWORD=api-password
   ```

## Testing and Verification

### 1. Connection Testing

1. Verify WebSocket connection:
   ```bash
   wscat -c wss://sbc-domain:443/sip
   ```

2. Check SIP registration:
   ```
   # CLI commands
   show voip register db
   ```

### 2. Call Testing

1. Make test calls through API
2. Monitor call progress:
   ```
   # CLI commands
   show voip calls
   show voip calls active
   ```

## Troubleshooting

### 1. Common Issues

1. WebSocket connection failures:
   - Verify TLS certificate
   - Check firewall rules
   - Validate WebSocket URL

2. Media problems:
   - Check ICE/STUN configuration
   - Verify SRTP settings
   - Monitor media statistics

### 2. Logging

1. Enable debug logging:
   ```
   # CLI commands
   debug log
   debug log debug-level 7
   ```

2. Capture SIP traces:
   ```
   # CLI commands
   debug capture voip
   debug capture voip interface WebRTC
   ```

## Maintenance

### 1. Backup Configuration

```
# CLI commands
 copy configuration-pkg to-file backup.zip
```

### 2. Performance Monitoring

1. Monitor system status:
   ```
   # CLI commands
   show system utilization
   show voip calls statistics
   ```

2. Regular checks:
   - CPU and memory usage
   - Active calls and registrations
   - WebSocket connection status

## Security Recommendations

1. Network Security:
   - Use TLS 1.2 or higher
   - Implement strong cipher suites
   - Regular certificate updates

2. Access Control:
   - Implement IP-based access rules
   - Use strong authentication
   - Regular password rotation

## Support

For additional support:
- Consult AudioCodes documentation
- Contact AudioCodes support
- Review API documentation