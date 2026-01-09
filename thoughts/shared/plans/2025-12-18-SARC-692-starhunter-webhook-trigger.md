# Starhunter Webhook Trigger Implementation Plan

## Overview

Implement a new webhook trigger node for the Starhunter n8n integration to receive candidate events (applications, status changes, document uploads) from Starhunter systems via webhooks. This will complement the existing action node by enabling event-driven workflows.

**Ticket**: SARC-692
**Related Research**: `thoughts/shared/research/2025-12-15-SARC-692-application-trigger.md`

## Current State Analysis

**Existing Starhunter Node** (`nodes/Starhunter/Starhunter.node.ts:17-394`)
- Action node only (group: `['transform']`)
- 7 resources with 14 operations (search, create, update, log)
- GraphQL API integration at `{baseUrl}/Api/graphql`
- Bearer token authentication via StarhunterApi credentials
- Modular action structure in `nodes/Starhunter/actions/` subdirectories
- Package currently registers one node: `dist/nodes/Starhunter/Starhunter.node.js`

**Key Constraints**:
- Package version: 0.2.1
- n8n API version: 1
- TypeScript target: ES2019
- Build process: n8n-node CLI

**User Requirements from Clarification**:
1. Webhook registration: Manual configuration (initially), with future API registration support
2. Authentication: HMAC signature validation
3. Event types: Application events, status changes, document uploads
4. Response: Simple acknowledgment with timestamp

## Desired End State

A new trigger node (`StarhunterTrigger`) that:
1. Receives webhook events from Starhunter systems
2. Validates HMAC signatures for security
3. Handles three event types with appropriate filtering
4. Processes file attachments as n8n binary data
5. Returns immediate acknowledgment responses
6. Is registered as a separate node in package.json
7. Is designed to support future API-based webhook registration

**Verification**:
- New node appears in n8n trigger node list as "Starhunter Trigger"
- Can be added to workflows and generates unique webhook URLs
- Receives and processes test webhook payloads correctly
- HMAC validation rejects invalid signatures
- File attachments are accessible as binary data downstream
- Event type filtering works as expected

## What We're NOT Doing

- NOT modifying the existing Starhunter action node
- NOT implementing API-based webhook registration (reserved for future enhancement)
- NOT implementing webhookMethods lifecycle (no create/delete/checkExists yet)
- NOT adding interview scheduling events (only the three confirmed event types)
- NOT implementing webhook retry logic (responsibility of Starhunter system)
- NOT creating database persistence for webhook events (n8n workflow handles this)
- NOT implementing rate limiting (delegated to n8n instance configuration)

## Implementation Approach

**Separate Trigger Node Strategy** (aligned with n8n ecosystem best practices):
1. Create new `StarhunterTrigger` node class in separate directory
2. Implement `webhook()` method (not `execute()`)
3. Use group `['trigger']` instead of `['transform']`
4. Share credentials with existing action node (StarhunterApi)
5. Add HMAC secret to credentials for webhook validation
6. Structure for future API registration by designing flexible architecture

**Technology Stack**:
- n8n-workflow interfaces: `IWebhookFunctions`, `IWebhookResponseData`, `IWebhookDescription`
- Node.js crypto module for HMAC validation
- MultiPartFormData.Request interface for file handling

## Phase 1: Credentials Extension

### Overview
Extend StarhunterApi credentials to include HMAC secret for webhook signature validation.

### Changes Required

#### 1. Credentials Schema Update
**File**: `credentials/StarhunterApi.credentials.ts`
**Changes**: Add HMAC secret field to properties array

```typescript
// Add after accessToken property (line 32)
{
    displayName: 'Webhook Secret',
    name: 'webhookSecret',
    type: 'string',
    typeOptions: { password: true },
    required: false,
    default: '',
    description: 'HMAC secret for validating webhook signatures (required for webhook trigger)',
}
```

**Rationale**:
- Reuse existing credentials to avoid user confusion
- Optional field maintains backward compatibility
- Password type ensures secret is hidden in UI

### Success Criteria

#### Automated Verification:
- [x] TypeScript compilation succeeds: `npm run build`
- [x] Linting passes: `npm run lint`
- [x] Credentials file type-checks correctly

#### Manual Verification:
- [ ] Credential configuration form shows new "Webhook Secret" field
- [ ] Field is properly masked in UI (password type)
- [ ] Existing credentials continue to work without webhook secret
- [ ] Test credential connection still validates successfully

---

## Phase 2: Trigger Node Structure

### Overview
Create the basic trigger node structure with webhook configuration and event type filtering.

### Changes Required

#### 1. Create Trigger Node Directory
**Files**:
- `nodes/StarhunterTrigger/StarhunterTrigger.node.ts` (new)
- `nodes/StarhunterTrigger/starhunter.svg` (copy from `nodes/Starhunter/`)

#### 2. Implement Node Class
**File**: `nodes/StarhunterTrigger/StarhunterTrigger.node.ts`
**Changes**: Create new trigger node implementation

```typescript
import {
    type IWebhookFunctions,
    type INodeType,
    type INodeTypeDescription,
    type IWebhookResponseData,
    NodeOperationError,
} from 'n8n-workflow';
import * as crypto from 'crypto';

export class StarhunterTrigger implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Starhunter Trigger',
        name: 'starhunterTrigger',
        icon: 'file:starhunter.svg',
        group: ['trigger'],
        version: 1,
        description: 'Receive candidate events from Starhunter via webhooks',
        defaults: {
            name: 'Starhunter Trigger',
        },
        inputs: [],
        outputs: ['main'],
        credentials: [
            {
                name: 'starhunterApi',
                required: true,
            },
        ],
        webhooks: [
            {
                name: 'default',
                httpMethod: 'POST',
                responseMode: 'onReceived',
                path: 'webhook',
            },
        ],
        properties: [
            {
                displayName: 'Event Types',
                name: 'eventTypes',
                type: 'multiOptions',
                default: ['application'],
                required: true,
                description: 'Which event types to trigger the workflow',
                options: [
                    {
                        name: 'Application Events',
                        value: 'application',
                        description: 'Candidate applies to a project',
                    },
                    {
                        name: 'Status Change Events',
                        value: 'statusChange',
                        description: 'Candidate status changes (hired, rejected, etc.)',
                    },
                    {
                        name: 'Document Upload Events',
                        value: 'documentUpload',
                        description: 'Candidate uploads new documents',
                    },
                ],
            },
        ],
    };

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        // Implementation in Phase 3
        return {
            workflowData: [[]],
        };
    }
}
```

#### 3. Update Package Registration
**File**: `package.json`
**Changes**: Add new node to n8n configuration

```json
// Update n8n.nodes array (line 39-41)
"nodes": [
    "dist/nodes/Starhunter/Starhunter.node.js",
    "dist/nodes/StarhunterTrigger/StarhunterTrigger.node.js"
]
```

### Success Criteria

#### Automated Verification:
- [x] TypeScript compilation succeeds: `npm run build`
- [x] Linting passes: `npm run lint`
- [x] Build output includes `dist/nodes/StarhunterTrigger/StarhunterTrigger.node.js`

#### Manual Verification:
- [ ] "Starhunter Trigger" appears in n8n's trigger node list
- [ ] Node can be added to a workflow
- [ ] Event type selector shows three options
- [ ] Webhook URL is generated and displayed
- [ ] Icon displays correctly in node

---

## Phase 3: Webhook Handler Implementation

### Overview
Implement the core webhook() method with HMAC validation, event filtering, and data processing.

### Changes Required

#### 1. HMAC Validation Helper
**File**: `nodes/StarhunterTrigger/StarhunterTrigger.node.ts`
**Changes**: Add HMAC validation function

```typescript
// Add before webhook() method
private validateHmacSignature(
    payload: string,
    signature: string,
    secret: string,
): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
    );
}
```

#### 2. Complete Webhook Handler
**File**: `nodes/StarhunterTrigger/StarhunterTrigger.node.ts`
**Changes**: Implement full webhook() method

```typescript
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const credentials = await this.getCredentials('starhunterApi');
    const webhookSecret = credentials.webhookSecret as string;

    // Validate HMAC signature
    if (webhookSecret) {
        const req = this.getRequestObject();
        const signature = req.headers['x-starhunter-signature'] as string;

        if (!signature) {
            throw new NodeOperationError(
                this.getNode(),
                'Missing webhook signature header',
            );
        }

        const payload = JSON.stringify(this.getBodyData());

        if (!this.validateHmacSignature(payload, signature, webhookSecret)) {
            throw new NodeOperationError(
                this.getNode(),
                'Invalid webhook signature',
            );
        }
    }

    // Get event data
    const bodyData = this.getBodyData();
    const eventType = bodyData.eventType as string;

    // Filter by configured event types
    const allowedEventTypes = this.getNodeParameter('eventTypes') as string[];

    if (!allowedEventTypes.includes(eventType)) {
        // Return success but don't trigger workflow
        return {
            webhookResponse: {
                received: true,
                timestamp: new Date().toISOString(),
                message: 'Event type not enabled',
            },
            noWebhookResponse: false,
        };
    }

    // Prepare workflow data
    const workflowData = [
        [
            {
                json: bodyData,
            },
        ],
    ];

    // Return acknowledgment
    return {
        workflowData,
        webhookResponse: {
            received: true,
            timestamp: new Date().toISOString(),
        },
    };
}
```

### Success Criteria

#### Automated Verification:
- [x] TypeScript compilation succeeds: `npm run build`
- [x] Linting passes: `npm run lint`
- [x] No type errors in webhook implementation

#### Manual Verification:
- [ ] Valid webhook with correct signature triggers workflow
- [ ] Invalid signature is rejected with error
- [ ] Missing signature (when secret configured) is rejected
- [ ] Event type filtering works (filtered events return success without triggering)
- [ ] Webhook response contains acknowledgment JSON
- [ ] Workflow receives correct event data

---

## Phase 4: File Attachment Handling

### Overview
Add support for processing file attachments from multipart form data requests.

### Changes Required

#### 1. Binary Data Processing
**File**: `nodes/StarhunterTrigger/StarhunterTrigger.node.ts`
**Changes**: Extend webhook handler to process files

```typescript
import {
    type IWebhookFunctions,
    type INodeType,
    type INodeTypeDescription,
    type IWebhookResponseData,
    type INodeExecutionData,
    type MultiPartFormData,
    NodeOperationError,
} from 'n8n-workflow';
import * as fs from 'fs';

// Update webhook() method after preparing workflow data
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    // ... existing validation and event filtering code ...

    // Prepare execution data with binary support
    const executionData: INodeExecutionData = {
        json: bodyData,
        binary: {},
    };

    // Handle file attachments if present
    const req = this.getRequestObject() as MultiPartFormData.Request;

    if (req.body?.files) {
        const uploadedFiles = req.body.files;
        let fileIndex = 0;

        for (const [fieldName, fileOrFiles] of Object.entries(uploadedFiles)) {
            const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];

            for (const file of files) {
                const binaryPropertyName = files.length > 1
                    ? `${fieldName}${fileIndex}`
                    : fieldName;

                executionData.binary![binaryPropertyName] =
                    await this.helpers.prepareBinaryData(
                        fs.createReadStream(file.filepath),
                        file.originalFilename || file.newFilename,
                        file.mimetype,
                    );

                fileIndex++;
            }
        }
    }

    // Return with binary data
    return {
        workflowData: [[executionData]],
        webhookResponse: {
            received: true,
            timestamp: new Date().toISOString(),
            filesProcessed: Object.keys(executionData.binary || {}).length,
        },
    };
}
```

### Success Criteria

#### Automated Verification:
- [x] TypeScript compilation succeeds: `npm run build`
- [x] Linting passes: `npm run lint`
- [x] File handling types are correct

#### Manual Verification:
- [ ] Webhook with file attachments processes successfully
- [ ] Files are accessible as binary data in downstream nodes
- [ ] Multiple files are handled correctly with indexed names
- [ ] File metadata (filename, mimetype) is preserved
- [ ] Response includes filesProcessed count
- [ ] Webhooks without files still work normally

---

## Phase 5: Documentation and Examples

### Overview
Document the trigger node usage, webhook configuration, and HMAC setup requirements.

### Changes Required

#### 1. README Updates
**File**: `README.md`
**Changes**: Add trigger node section

```markdown
## Starhunter Trigger Node

The Starhunter Trigger node receives real-time events from your Starhunter system via webhooks.

### Supported Event Types

- **Application Events**: Triggered when a candidate applies to a project
- **Status Change Events**: Triggered when a candidate's status changes
- **Document Upload Events**: Triggered when documents are uploaded

### Setup Instructions

1. **Add Trigger to Workflow**
   - Search for "Starhunter Trigger" in the trigger nodes list
   - Add it to your workflow
   - Select which event types to listen for

2. **Configure Credentials**
   - Use your existing Starhunter API credentials
   - Add the webhook secret provided by your Starhunter administrator
   - The webhook secret is used for HMAC signature validation

3. **Copy Webhook URL**
   - The trigger node displays a unique webhook URL
   - Copy this URL

4. **Configure in Starhunter**
   - Contact your Starhunter administrator
   - Provide the webhook URL
   - Ensure HMAC signing is enabled with your webhook secret

### Event Payload Structure

#### Application Event
```json
{
  "eventType": "application",
  "timestamp": "2025-12-18T14:30:00Z",
  "candidate": {
    "id": "12345",
    "name": "Doe",
    "firstName": "John",
    "email": "john.doe@example.com",
    "phone": "+49123456789",
    "birthDate": "1990-05-15"
  },
  "project": {
    "id": "67890",
    "name": "Software Developer Position"
  },
  "applicationDate": "2025-12-18T14:30:00Z"
}
```

#### Status Change Event
```json
{
  "eventType": "statusChange",
  "timestamp": "2025-12-18T15:00:00Z",
  "candidate": {
    "id": "12345",
    "name": "Doe",
    "firstName": "John"
  },
  "project": {
    "id": "67890",
    "name": "Software Developer Position"
  },
  "oldStatus": "applied",
  "newStatus": "interview_scheduled",
  "changedBy": "hiring.manager@company.com"
}
```

#### Document Upload Event
```json
{
  "eventType": "documentUpload",
  "timestamp": "2025-12-18T15:30:00Z",
  "candidate": {
    "id": "12345",
    "name": "Doe",
    "firstName": "John"
  },
  "project": {
    "id": "67890",
    "name": "Software Developer Position"
  },
  "documentType": "resume",
  "fileName": "John_Doe_Resume.pdf"
}
```

File attachments are available in the `binary` property of the workflow data.

### Security: HMAC Signature Validation

The trigger validates webhook authenticity using HMAC-SHA256 signatures:

1. Starhunter signs the webhook payload with your shared secret
2. The signature is sent in the `X-Starhunter-Signature` header
3. The trigger validates the signature before processing
4. Invalid signatures are rejected with an error

**For Starhunter Administrators**: When configuring webhooks, enable HMAC signing and use the same secret that n8n users configure in their credentials.
```

#### 2. Create Example Workflow Documentation
**File**: `nodes/StarhunterTrigger/README.md` (new)
**Changes**: Create node-specific documentation

```markdown
# Starhunter Trigger Node

## Example Workflows

### Workflow 1: New Application Notification

Sends an email notification when a candidate applies:

1. **Starhunter Trigger** - Filter for "Application Events"
2. **Set** - Format candidate details
3. **Gmail** - Send email to hiring manager

### Workflow 2: Status Change Automation

Updates CRM when candidate status changes:

1. **Starhunter Trigger** - Filter for "Status Change Events"
2. **Switch** - Branch by new status
3. **HubSpot** / **Salesforce** - Update contact

### Workflow 3: Document Processing

Processes uploaded resumes with AI:

1. **Starhunter Trigger** - Filter for "Document Upload Events"
2. **Extract from File** - Extract resume text
3. **OpenAI** - Analyze qualifications
4. **Starhunter** (action node) - Update candidate notes

## Testing Your Webhook

Use curl to test locally:

```bash
# Calculate HMAC signature
PAYLOAD='{"eventType":"application","candidate":{"id":"test"}}'
SECRET="your-webhook-secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Send test webhook
curl -X POST \
  https://your-n8n.instance/webhook/YOUR_WEBHOOK_PATH \
  -H "Content-Type: application/json" \
  -H "X-Starhunter-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```
```

### Success Criteria

#### Automated Verification:
- [x] Documentation files are valid markdown
- [x] Code examples have correct syntax
- [x] All links work correctly

#### Manual Verification:
- [ ] README clearly explains setup process
- [ ] Event payload examples match expected structure
- [ ] Example workflows are practical and clear
- [ ] Security section explains HMAC validation
- [ ] Testing instructions work correctly

---

## Phase 6: Starhunter System Requirements

### Overview
Document what needs to be implemented in the Starhunter system to support webhooks.

### Changes Required

#### 1. Starhunter Requirements Document
**File**: `docs/STARHUNTER_WEBHOOK_REQUIREMENTS.md` (new)
**Changes**: Create comprehensive requirements for Starhunter team

```markdown
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
```

### Success Criteria

#### Automated Verification:
- [x] Documentation is valid markdown
- [x] Code examples are syntactically correct

#### Manual Verification:
- [ ] Requirements document is comprehensive and clear
- [ ] Event payload structures match n8n trigger expectations
- [ ] HMAC implementation guidance is accurate
- [ ] Testing checklist covers all critical functionality
- [ ] Future enhancements are clearly marked as out of scope

---

## Testing Strategy

### Unit Tests

**Note**: n8n community nodes typically don't include unit tests in the package itself. Testing is done manually and through integration testing.

Key test scenarios to verify manually:
- HMAC validation with correct signature
- HMAC validation with incorrect signature
- Event type filtering (enabled vs. disabled types)
- File attachment processing
- Binary data conversion

### Integration Tests

**Test Workflow 1: Basic Event Reception**
1. Create workflow with Starhunter Trigger
2. Configure for "Application Events"
3. Add webhook URL to test configuration
4. Send test webhook with valid signature
5. Verify workflow executes and receives correct data

**Test Workflow 2: Event Type Filtering**
1. Configure trigger for only "Application Events"
2. Send "statusChange" event with valid signature
3. Verify workflow does NOT trigger
4. Verify webhook returns success acknowledgment

**Test Workflow 3: File Attachment Handling**
1. Configure trigger for "Document Upload Events"
2. Send multipart/form-data request with PDF attachment
3. Add "Move Binary Data" node downstream
4. Verify file is accessible and can be downloaded

**Test Workflow 4: Security Validation**
1. Send webhook without signature header
2. Verify request is rejected
3. Send webhook with invalid signature
4. Verify request is rejected with error

### Manual Testing Steps

**Initial Setup Test**:
1. Install package in n8n: `npm install @starhunter/n8n-nodes-graphql@0.3.0`
2. Restart n8n
3. Verify "Starhunter Trigger" appears in trigger node list
4. Create new workflow and add trigger node

**Configuration Test**:
1. Select "Starhunter Trigger" from node list
2. Configure credentials (with webhook secret)
3. Select event types: Application + Status Change
4. Verify webhook URL is generated
5. Copy webhook URL

**Webhook Delivery Test**:
1. Use curl or Postman to send test POST request:
   ```bash
   PAYLOAD='{"eventType":"application","timestamp":"2025-12-18T14:30:00Z","candidate":{"id":"test-123","name":"Doe","firstName":"John","email":"john@example.com"},"project":{"id":"proj-456","name":"Test Position"}}'
   SECRET="your-webhook-secret"
   SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

   curl -X POST "YOUR_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -H "X-Starhunter-Signature: $SIGNATURE" \
     -d "$PAYLOAD"
   ```
2. Verify workflow executes
3. Check workflow execution data matches payload

**File Upload Test**:
1. Create multipart/form-data request with file
2. Send to webhook URL with valid signature
3. Verify workflow receives binary data
4. Use "Write Binary File" node to save and verify file integrity

**Error Handling Test**:
1. Send request without X-Starhunter-Signature header
2. Verify error response
3. Send request with incorrect signature
4. Verify rejection with appropriate error

## Performance Considerations

**Webhook Processing**:
- Response mode: `onReceived` ensures immediate acknowledgment (< 100ms target)
- HMAC validation adds ~1-2ms overhead (acceptable)
- File processing is asynchronous within workflow execution
- Large file uploads (>10MB) may require timeout adjustments in Starhunter

**Scalability**:
- Each trigger node generates unique webhook URL
- n8n handles webhook routing and queueing
- Concurrent webhook deliveries are handled by n8n's execution queue
- No additional scaling considerations needed in trigger node itself

**Memory**:
- Binary data is streamed from temporary files (not loaded into memory)
- Payload size limits inherited from n8n instance configuration
- Recommend documenting max payload size in Starhunter webhook config

## Migration Notes

**Version 0.2.1 → 0.3.0**:
- Existing action node workflows are NOT affected
- Credentials remain backward compatible (webhookSecret is optional)
- Users with existing StarhunterApi credentials can add webhook secret without recreating credentials
- No database migrations required
- Existing package consumers can upgrade without breaking changes

**Upgrade Path**:
1. Update package: `npm install @starhunter/n8n-nodes-graphql@0.3.0`
2. Restart n8n instance
3. New "Starhunter Trigger" node becomes available
4. Existing workflows continue functioning normally
5. Users can add webhook secret to existing credentials when ready to use trigger

## References

- Original ticket: SARC-692
- Related research: `thoughts/shared/research/2025-12-15-SARC-692-application-trigger.md`
- Current Starhunter node: `nodes/Starhunter/Starhunter.node.ts:17-394`
- Action pattern example: `nodes/Starhunter/actions/candidate/search.ts:85-154`
- Credentials: `credentials/StarhunterApi.credentials.ts:1-58`
- n8n webhook interfaces: `node_modules/n8n-workflow/dist/cjs/interfaces.d.ts:746-760,1565-1628`
- Package configuration: `package.json:33-41`
