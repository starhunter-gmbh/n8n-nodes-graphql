---
date: 2025-12-15T14:30:00+01:00
researcher: Christopher Schreiner
git_commit: 7f0b96f1154d11651ac1362c637a768f2438b7ec
branch: main
repository: starhunter-utils/automation-nodes
topic: "Implementation of n8n Application Webhook Trigger for Starhunter"
tags: [research, codebase, n8n, starhunter, webhook, trigger, SARC-692]
status: complete
last_updated: 2025-12-15
last_updated_by: Christopher Schreiner
---

# Research: Implementation of n8n Application Webhook Trigger for Starhunter

**Date**: 2025-12-15T14:30:00+01:00
**Researcher**: Christopher Schreiner
**Git Commit**: 7f0b96f1154d11651ac1362c637a768f2438b7ec
**Branch**: main
**Repository**: starhunter-utils/automation-nodes

## Research Question

How should we implement a webhook trigger in the existing Starhunter n8n node to receive candidate application events from Starhunter systems?

**Use Case**: When a candidate applies in a Starhunter system, the event should be pushed via webhook to an n8n trigger. The data includes:
- Candidate master data (Stammdaten)
- Project to which they applied
- Optional: Application documents as attachments

## Summary

The existing Starhunter n8n node is currently implemented as an **action node only** (group: 'transform'), not as a trigger node. To implement the application webhook trigger, we need to either:

1. Create a **separate trigger node** (recommended approach in n8n ecosystem)
2. Convert the existing node to support **both modes** (action and trigger)

The codebase is well-structured with modular actions organized by resource type. Webhook trigger implementation in n8n requires implementing the `webhook()` method, defining webhook descriptions, and handling multipart form data for file attachments.

## Detailed Findings

### Current Starhunter Node Structure

**Main Implementation** (`nodes/Starhunter/Starhunter.node.ts:17-394`)
- **Node Type**: Action node (not trigger)
- **Group**: `['transform']`
- **Resources**: 7 resources with multiple operations each
  - Candidate (search)
  - Email (log)
  - Employee (getCurrent, search)
  - Person (getBirthdays, getById, search)
  - Project (search)
  - Project Candidate (add, updateStatus, getByStatusChangeDate)
  - Task (create)
- **API Integration**: GraphQL API at `{baseUrl}/Api/graphql`
- **Authentication**: Bearer token via StarhunterApi credentials
- **Pattern**: Resource/Operation selector pattern

**Modular Action Structure**
Each action is organized in subdirectories:
```
nodes/Starhunter/actions/
├── candidate/
│   ├── index.ts (exports)
│   └── search.ts (implementation)
├── email/
├── employee/
├── person/
├── project/
├── projectCandidate/
└── task/
```

**Action Implementation Pattern** (`nodes/Starhunter/actions/candidate/search.ts`)
Each action module exports:
1. `description: INodeProperties[]` - UI field definitions with displayOptions
2. `execute: (context, itemIndex, baseUrl) => Promise<IDataObject[]>` - Execution logic

Example structure:
- Defines parameters (candidateId, name, birthDate, limit, offset)
- Constructs GraphQL query
- Uses `httpRequestWithAuthentication` helper
- Returns array of results from `response.data?.candidate`

### Webhook Trigger Implementation Patterns in n8n

Based on n8n-workflow type definitions, webhook triggers require:

#### 1. Webhook Description Configuration (`IWebhookDescription`)
Location: `node_modules/n8n-workflow/dist/cjs/interfaces.d.ts:1565-1628`

Required properties:
- `httpMethod`: HTTP method (GET, POST, PUT, DELETE, etc.)
- `name`: WebhookType ('default' | 'setup')
- `path`: URL path for the webhook

Response configuration:
- `responseMode`: When to send response
  - `'onReceived'`: Immediately after node execution (most common)
  - `'lastNode'`: After last node finishes
  - `'responseNode'`: From Response to Webhook node
  - `'streaming'`: Real-time streaming
- `responseData`: What data to return
  - `'allEntries'`: All workflow execution entries
  - `'firstEntryJson'`: First entry as JSON
  - `'firstEntryBinary'`: First entry as binary
  - `'noData'`: No data returned

#### 2. Webhook Function Implementation (`IWebhookFunctions`)
Location: `node_modules/n8n-workflow/dist/cjs/interfaces.d.ts:746-760`

Available methods for accessing request data:
- `getBodyData()`: Get parsed body data
- `getHeaderData()`: Get HTTP headers
- `getQueryData()`: Get query parameters
- `getParamsData()`: Get path parameters
- `getRequestObject()`: Get Express.js request object
- `getResponseObject()`: Get Express.js response object
- `getWebhookName()`: Get webhook type ('default' | 'setup')
- `getNodeParameter()`: Get node parameter values
- `helpers`: HTTP request, binary, and base helpers

#### 3. Webhook Method in INodeType
Location: `node_modules/n8n-workflow/dist/cjs/interfaces.d.ts:1195-1231`

The main webhook handler:
```typescript
async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData>
```

Returns:
```typescript
interface IWebhookResponseData {
    workflowData?: INodeExecutionData[][];  // Data passed to workflow
    webhookResponse?: any;                   // Custom HTTP response
    noWebhookResponse?: boolean;             // Skip sending response
}
```

#### 4. Webhook Lifecycle Management (`webhookMethods`)
Location: `node_modules/n8n-workflow/dist/cjs/interfaces.d.ts:739-745`

Optional lifecycle methods for external service registration:
```typescript
webhookMethods?: {
    default?: {
        checkExists: (this: IHookFunctions) => Promise<boolean>;
        create: (this: IHookFunctions) => Promise<boolean>;
        delete: (this: IHookFunctions) => Promise<boolean>;
    };
}
```

- `checkExists`: Verify if webhook exists on external service
- `create`: Register webhook with external service
- `delete`: Unregister webhook from external service

### File Attachment Handling in Webhooks

#### MultiPartFormData Interface
Location: `node_modules/n8n-workflow/dist/cjs/interfaces.d.ts:1175-1187`

Structure for file uploads:
```typescript
namespace MultiPartFormData {
    interface File {
        filepath: string;           // Temporary file path
        mimetype?: string;          // MIME type
        originalFilename?: string;  // Original filename
        newFilename: string;        // Renamed filename
        size?: number;              // File size in bytes
    }

    type Request = express.Request<{}, {}, {
        data: Record<string, string | string[]>;  // Form fields
        files: Record<string, File | File[]>;     // Uploaded files
    }>;
}
```

#### File Processing Pattern

1. Cast request object to `MultiPartFormData.Request`
2. Access uploaded files from `request.body.files`
3. Iterate through files (handle both single and array)
4. Convert files to binary data using `helpers.prepareBinaryData()`
5. Attach to execution data with appropriate keys

Example:
```typescript
const request = this.getRequestObject() as MultiPartFormData.Request;
const uploadedFiles = request.body.files;

for (const [fieldName, fileOrFiles] of Object.entries(uploadedFiles)) {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    for (const file of files) {
        const binaryData = await this.helpers.prepareBinaryData(
            fs.createReadStream(file.filepath),
            file.originalFilename,
            file.mimetype
        );
        // Store in execution data
    }
}
```

### Current Node Configuration

**Package Definition** (`package.json`)
- **Package Name**: `@starhunter/n8n-nodes-graphql`
- **Version**: 0.2.1
- **Registered Nodes**: Only one node entry
  - `dist/nodes/Starhunter/Starhunter.node.js`
- **Credentials**: `dist/credentials/StarhunterApi.credentials.js`
- **n8n API Version**: 1

**Credentials** (`credentials/StarhunterApi.credentials.ts`)
- Base URL field
- Bearer token field (access token)
- Documentation URL reference

## Code References

- `nodes/Starhunter/Starhunter.node.ts:17-394` - Main Starhunter node implementation
- `nodes/Starhunter/Starhunter.node.ts:22` - Current group: ['transform'] (action node)
- `nodes/Starhunter/Starhunter.node.ts:30-31` - Input/output configuration
- `nodes/Starhunter/Starhunter.node.ts:273-393` - Execute method (action execution logic)
- `nodes/Starhunter/actions/candidate/search.ts:9-83` - Example action description pattern
- `nodes/Starhunter/actions/candidate/search.ts:85-154` - Example action execute pattern
- `credentials/StarhunterApi.credentials.ts` - Authentication credentials
- `package.json:33-41` - n8n node registration configuration

## Architecture Documentation

### Current Pattern: Action Node

The Starhunter node follows n8n's standard action node pattern:

1. **Resource/Operation Selection**: User selects resource then operation
2. **Parameter Collection**: Dynamic fields shown based on selection
3. **Execution**: `execute()` method processes input items
4. **GraphQL Integration**: All operations use GraphQL API
5. **Error Handling**: Supports continueOnFail mode

### Required Pattern: Webhook Trigger Node

To implement the application webhook trigger:

1. **Separate Node Class**: Create new `StarhunterTrigger` class
2. **Group**: Change to `['trigger']` instead of `['transform']`
3. **Webhook Configuration**: Define in `webhooks` array in description
4. **Webhook Handler**: Implement `webhook()` method (NOT `execute()`)
5. **Data Structure**: Return execution data in `IWebhookResponseData` format
6. **File Support**: Handle multipart form data for attachments
7. **Authentication**: Optional webhook validation (API key, signature)

### Recommended Implementation Approach

**Option 1: Separate Trigger Node (Recommended)**
Create a new file: `nodes/StarhunterTrigger/StarhunterTrigger.node.ts`

Benefits:
- Clean separation of concerns
- Follows n8n conventions (separate trigger nodes)
- Easier to maintain and test
- Can have different versioning
- Users can distinguish between action and trigger in UI

Package registration would add:
```json
"nodes": [
    "dist/nodes/Starhunter/Starhunter.node.js",
    "dist/nodes/StarhunterTrigger/StarhunterTrigger.node.js"
]
```

**Option 2: Unified Node with Mode Selection**
Modify existing node to support both action and trigger modes.

Challenges:
- Complex description logic (different fields for different modes)
- Both `execute()` and `webhook()` methods needed
- Group would need to be `['trigger', 'transform']`
- More complex to maintain
- Less common pattern in n8n ecosystem

### Data Structure for Application Event

Based on the use case, the webhook should receive:

**JSON Payload Structure** (expected):
```json
{
    "candidate": {
        "id": "string",
        "name": "string",
        "firstName": "string",
        "email": "string",
        "phone": "string",
        "birthDate": "string",
        // ... other candidate fields
    },
    "project": {
        "id": "string",
        "name": "string",
        // ... project fields
    },
    "applicationDate": "ISO 8601 timestamp",
    "status": "string"
}
```

**File Attachments** (multipart form data):
- Field name: `attachments[]` or similar
- Multiple files supported
- Common types: PDF, DOCX, images
- Should be converted to n8n binary data format

### Integration with Existing Starhunter API

The trigger would complement existing actions:
- **Trigger**: Receives application event → starts workflow
- **Actions**: Can be used downstream to:
  - Search candidate details (`candidate.search`)
  - Add to project candidate (`projectCandidate.add`)
  - Update status (`projectCandidate.updateStatus`)
  - Create tasks (`task.create`)
  - Log emails (`email.log`)

## Open Questions

1. **Webhook Registration**: Does the Starhunter system support webhook registration via API?
   - If yes: Implement `webhookMethods` (create, checkExists, delete)
   - If no: Manual webhook URL configuration in Starhunter admin

2. **Authentication**: How should incoming webhooks be validated?
   - API key in header?
   - HMAC signature?
   - IP whitelist?
   - None (internal network only)?

3. **Event Types**: Will there be multiple event types beyond "application"?
   - Status changes?
   - Interview scheduling?
   - Document uploads?
   - If yes: Consider event type filtering parameter

4. **Versioning**: Should this be a new major version (2.0.0) or minor version (0.3.0)?
   - New node = minor version (0.3.0)
   - Breaking changes to existing node = major version

5. **Response Expectations**: What should the webhook response contain?
   - Simple acknowledgment (`{ "received": true }`)?
   - Workflow execution result?
   - No response (fire-and-forget)?

## Related Research

No previous research documents found for this topic.

## Next Steps for Implementation

1. **Decision**: Choose implementation approach (separate node vs. unified)
2. **Specification**: Define exact webhook payload structure with Starhunter team
3. **Authentication**: Determine webhook validation requirements
4. **Implementation**: Create trigger node with webhook handler
5. **Testing**: Test with actual Starhunter webhook events
6. **Documentation**: Update README with trigger usage examples
7. **Release**: Publish new version to npm
