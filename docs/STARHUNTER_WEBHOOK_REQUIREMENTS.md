# Starhunter System: Webhook Implementation Requirements

## Overview

This document outlines the requirements for implementing webhook support in the Starhunter system to integrate with the n8n Starhunter Trigger node.

## Required Features

### 1. Webhook Configuration (Manual - Phase 1)

**Admin Interface Requirements**:
- Add webhook configuration section in admin panel
- Fields needed:
  - Webhook URL (text input)
  - HMAC Secret (password field, randomly generated)
  - Enabled Event Types (multi-select checkboxes)
  - Active status (toggle)
- Display the generated HMAC secret (copy-to-clipboard functionality)
- Allow admins to test webhook connection

### 2. Event Triggering

**Events to Implement**:

#### Application Event
- **Trigger**: When candidate submits application
- **Required Payload Fields**:
  ```json
  {
    "eventType": "application",
    "timestamp": "ISO 8601 timestamp",
    "candidate": {
      "id": "string",
      "name": "string",
      "firstName": "string",
      "email": "string",
      "phone": "string",
      "birthDate": "string (YYYY-MM-DD)"
    },
    "project": {
      "id": "string",
      "name": "string"
    },
    "applicationDate": "ISO 8601 timestamp"
  }
  ```

#### Status Change Event
- **Trigger**: When candidate status changes in project
- **Required Payload Fields**:
  ```json
  {
    "eventType": "statusChange",
    "timestamp": "ISO 8601 timestamp",
    "candidate": {
      "id": "string",
      "name": "string",
      "firstName": "string"
    },
    "project": {
      "id": "string",
      "name": "string"
    },
    "oldStatus": "string",
    "newStatus": "string",
    "changedBy": "string (employee email or ID)"
  }
  ```

#### Document Upload Event
- **Trigger**: When candidate or employee uploads documents
- **Required Payload Fields**:
  ```json
  {
    "eventType": "documentUpload",
    "timestamp": "ISO 8601 timestamp",
    "candidate": {
      "id": "string",
      "name": "string",
      "firstName": "string"
    },
    "project": {
      "id": "string",
      "name": "string"
    },
    "documentType": "string",
    "fileName": "string"
  }
  ```
- **File Attachments**: Send as multipart/form-data with files in `attachments[]` field

### 3. HMAC Signature Generation

**Implementation**:
```python
# Python example
import hmac
import hashlib
import json

def generate_signature(payload_dict, secret):
    payload_string = json.dumps(payload_dict, separators=(',', ':'))
    signature = hmac.new(
        secret.encode('utf-8'),
        payload_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

# Usage
payload = {"eventType": "application", "candidate": {...}}
secret = "your-webhook-secret"
signature = generate_signature(payload, secret)

# Send in header: X-Starhunter-Signature: {signature}
```

**Critical Requirements**:
- Use HMAC-SHA256 algorithm
- Generate hex digest (lowercase)
- Sign the exact JSON payload being sent (including whitespace)
- Send signature in `X-Starhunter-Signature` header

### 4. HTTP Request Specifications

**Request Format**:
- Method: POST
- Content-Type:
  - `application/json` for events without files
  - `multipart/form-data` for events with file attachments
- Headers:
  - `X-Starhunter-Signature`: HMAC-SHA256 signature (hex)
  - `Content-Type`: appropriate content type
  - `User-Agent`: "Starhunter-Webhook/1.0"

**Response Handling**:
- Success: HTTP 200 with JSON body `{"received": true, "timestamp": "..."}`
- Handle timeouts gracefully (10-second timeout recommended)
- Log failed webhook deliveries for retry

**Retry Logic** (recommended):
- Retry on connection errors or 5xx responses
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Maximum 5 retry attempts
- After all retries fail, mark webhook delivery as failed and alert admin

### 5. Error Handling

**Expected Error Responses from n8n**:
- 400 Bad Request: Invalid payload structure
- 401 Unauthorized: Invalid or missing HMAC signature
- 500 Internal Server Error: n8n workflow error

**Starhunter Response**:
- Log all errors with webhook URL, payload, and response
- Display failed webhooks in admin interface
- Provide manual retry option

## Testing Checklist

Before release:
- [ ] Webhook configuration can be created and edited
- [ ] HMAC secret is generated and displayed
- [ ] Application events trigger webhooks
- [ ] Status change events trigger webhooks
- [ ] Document upload events send files correctly
- [ ] HMAC signature validation works with n8n
- [ ] Failed deliveries are logged
- [ ] Retry logic works correctly
- [ ] Admin can view webhook delivery history

## Future Enhancements (Not Required Now)

These features are out of scope for the initial implementation but should be considered for future development:

### API-Based Webhook Registration
- REST API endpoints for creating/updating/deleting webhooks
- OAuth2 authentication for API
- Webhook registration endpoints:
  - `POST /api/webhooks` - Create webhook
  - `GET /api/webhooks/{id}` - Get webhook details
  - `PUT /api/webhooks/{id}` - Update webhook
  - `DELETE /api/webhooks/{id}` - Delete webhook
  - `GET /api/webhooks/{id}/deliveries` - Get delivery history

This would enable n8n's `webhookMethods` lifecycle management for automatic webhook registration when workflows are activated.
