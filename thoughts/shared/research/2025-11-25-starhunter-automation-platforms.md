---
date: 2025-11-25T18:45:00+01:00
researcher: Claude Code
git_commit: 1de5a7c5ac76edcb5f70b816e4d8a07e78b8e973
branch: main
repository: automation-nodes
topic: "Starhunter CRM Integration Options for Make.com and Alternative Automation Platforms"
tags: [research, automation, make.com, zapier, pipedream, activepieces, graphql, n8n]
status: complete
last_updated: 2025-11-25
last_updated_by: Claude Code
---

# Research: Starhunter CRM Integration for Make.com and Alternative Automation Platforms

**Date**: 2025-11-25T18:45:00+01:00
**Researcher**: Claude Code
**Git Commit**: 1de5a7c5ac76edcb5f70b816e4d8a07e78b8e973
**Branch**: main
**Repository**: automation-nodes

## Research Question

Based on the existing n8n Starhunter node implementation, what are the options for creating similar functionality in make.com and other automation platforms? What alternative services might be relevant?

## Summary

The existing n8n Starhunter node provides a comprehensive integration with the Starhunter CRM via GraphQL API with Bearer token authentication. The node supports 6 resources (Person, Candidate, Employee, Email, Project Candidate, Task) with 10 operations total. This integration can be replicated in make.com using their custom app framework, with native GraphQL and Bearer token support. Several alternative platforms offer similar capabilities, with **Activepieces** (open-source, free self-hosted) and **Pipedream** (developer-friendly) standing out as excellent options alongside make.com.

---

## Part 1: Existing n8n Starhunter Node Analysis

### Architecture Overview

**Location**: `n8n/nodes/Starhunter/`

**Components**:
- **Credentials**: `StarhunterApi.credentials.ts` - Base URL + Bearer token authentication
- **Main Node**: `Starhunter.node.ts` - Resource/operation routing
- **Actions**: Modular action implementations per resource

### Authentication

```typescript
// StarhunterApi.credentials.ts:38-45
authenticate: IAuthenticateGeneric = {
  type: 'generic',
  properties: {
    headers: {
      Authorization: '=Bearer {{$credentials.accessToken}}',
    },
  },
};
```

**Configuration**:
- Base URL (default: `https://release-current.starhunter.software`)
- Access Token (Bearer token)
- API Endpoint: `{baseUrl}/Api/graphql`

### Resources and Operations

| Resource | Operation | Type | Description |
|----------|-----------|------|-------------|
| **Person** | getById | Query | Retrieve person by ID |
| **Person** | search | Query | Search persons by name with pagination |
| **Person** | getBirthdays | Query | Get persons with birthdays on a specific date |
| **Candidate** | search | Query | Search candidates by ID, name, or birth date |
| **Employee** | getCurrent | Query | Get authenticated user's employee record |
| **Employee** | search | Query | Search employees by ID or name |
| **Email** | log | Mutation | Log email activity in Starhunter |
| **Project Candidate** | getByStatusChangeDate | Query | Get candidates by status change date |
| **Task** | create | Mutation | Create a new task |

### GraphQL Queries Used

**Person Query Fields**:
```graphql
id, name, firstName, secondName, middleName, academicTitle,
salutation, email, birthDate, phone, functions, address,
createdAt, updatedAt
```

**Candidate Additional Fields**:
```graphql
contactHistory { title, type, date }
```

**Task Creation**:
```graphql
mutation CreateTask($title: String!, $description: String, $deadline: Date, $assignee: Id, $target: Id) {
  createTask(title: $title, description: $description, deadline: $deadline, assignee: $assignee, target: $target) {
    id, title, description, deadline, assignee
  }
}
```

---

## Part 2: Make.com Custom App Development

### Overview

Make.com (formerly Integromat) provides a comprehensive custom app development platform that fully supports GraphQL API integration with Bearer token authentication.

### Development Options

1. **Web-Based Editor**: Build directly in Make platform interface
2. **VS Code Extension**: Professional local development with Git integration
   - Marketplace: https://marketplace.visualstudio.com/items?itemName=Integromat.apps-sdk
   - GitHub: https://github.com/integromat/vscode-apps-sdk

### App Structure for Starhunter

```
Starhunter Custom App
├── Base
│   ├── Base URL: {{connection.baseUrl}}/Api/graphql
│   └── Authorization: Bearer {{connection.apiKey}}
├── Connection (Basic)
│   ├── Parameter: baseUrl (Base URL)
│   └── Parameter: apiKey (Bearer Token)
└── Modules
    ├── Person - Get by ID (Action)
    ├── Person - Search (Search)
    ├── Person - Get Birthdays (Search)
    ├── Candidate - Search (Search)
    ├── Employee - Get Current (Action)
    ├── Employee - Search (Search)
    ├── Email - Log (Action)
    ├── Project Candidate - Get by Status Change (Search)
    └── Task - Create (Action)
```

### Connection Configuration

```json
{
  "parameters": [
    {
      "name": "baseUrl",
      "type": "text",
      "label": "Base URL",
      "required": true,
      "default": "https://release-current.starhunter.software"
    },
    {
      "name": "apiKey",
      "type": "text",
      "label": "API Token",
      "required": true
    }
  ]
}
```

### Base Authorization

```json
{
  "baseUrl": "{{connection.baseUrl}}/Api/graphql",
  "headers": {
    "authorization": "Bearer {{connection.apiKey}}",
    "content-type": "application/json"
  }
}
```

### GraphQL Module Template

Make.com provides a **Universal Module** type for GraphQL:

```json
{
  "url": "{{connection.baseUrl}}/Api/graphql",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "query": "{{parameters.query}}",
    "variables": "{{parameters.variables}}"
  },
  "type": "json"
}
```

### Pricing

| Plan | Price | Custom Apps |
|------|-------|-------------|
| Free | $0/mo | Yes - private only |
| Core | $9/mo | Yes + API access |
| Pro | $29/mo | Yes + advanced features |
| Teams | Custom | Yes + collaboration |

**Key Point**: Custom app creation is FREE on all plans including free tier.

### Documentation Links

- Developer Hub: https://developers.make.com
- Custom Apps Overview: https://developers.make.com/custom-apps-documentation
- GraphQL Module: https://developers.make.com/custom-apps-documentation/app-structure/modules/universal-module/graphql
- Authorization: https://developers.make.com/custom-apps-documentation/app-structure/base/authorization
- VS Code Extension: https://developers.make.com/custom-apps-documentation/make-apps-editor/apps-sdk

---

## Part 3: Alternative Automation Platforms

### Comparison Summary

| Platform | GraphQL Native | Bearer Token | Self-Hosted | Starting Price |
|----------|---------------|--------------|-------------|----------------|
| **Activepieces** | Yes | Excellent | Yes (FREE) | $0 self-hosted |
| **Pipedream** | HTTP/Code | Excellent | No | $0-$74/mo |
| **Workato** | Yes (Best) | Yes | No | ~$10,000/year |
| **Tray.io** | Yes | Yes | No | $500+/mo |
| **Zapier** | HTTP only | Yes | No | Free build, $29.99/mo use |
| **Power Automate** | No | Issues | No | $15/user/mo |

### Recommended Platforms

#### 1. Activepieces (Best Overall)

**Why**: Open-source, free self-hosted, native GraphQL, TypeScript framework

**Key Features**:
- Native GraphQL piece with query/variables support
- Excellent Custom Auth for Bearer tokens
- MIT license - completely free self-hosted
- TypeScript SDK for custom pieces
- No per-task costs

**Custom Auth for Starhunter**:
```typescript
PieceAuth.CustomAuth({
  displayName: 'Starhunter Authentication',
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      defaultValue: 'https://release-current.starhunter.software'
    }),
    access_token: PieceAuth.SecretText({
      displayName: 'Access Token',
      required: true
    })
  },
  required: true
})
```

**Pricing**:
- Community (Self-Hosted): FREE, unlimited
- Cloud Plus: $15/mo
- Cloud Business: $150/mo

**Documentation**: https://www.activepieces.com/docs/developers/misc/build-piece

#### 2. Pipedream (Best for Developers)

**Why**: Code-first approach, excellent Node.js support, connected accounts

**Key Features**:
- Full Node.js/Python flexibility
- Use any npm package (urql, graphql-request)
- Connected accounts manage auth
- Generous free tier
- Hot reloading for development

**GraphQL Implementation**:
```javascript
import { createClient } from '@urql/core';

const client = createClient({
  url: `${this.starhunter.$auth.base_url}/Api/graphql`,
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${this.starhunter.$auth.access_token}`,
    },
  },
});

const result = await client.query(PERSON_QUERY, { id: personId });
```

**Pricing**:
- Free: 100 credits/mo
- Basic: $45/mo
- Advanced: $74/mo

**Documentation**: https://pipedream.com/docs/

#### 3. Workato (Best Enterprise)

**Why**: Best-in-class GraphQL with schema introspection

**Key Features**:
- Native GraphQL connector
- Auto-generates fields from schema
- Dynamic schema introspection
- Enterprise security

**Note**: High cost (~$10,000/year) but justified for large deployments

**Documentation**: https://docs.workato.com/connectors/graphql.html

#### 4. Zapier (Largest Ecosystem)

**Why**: 8,000+ apps, free to build, largest community

**Key Features**:
- Platform CLI for custom integrations
- Session auth for Bearer tokens
- Extensive documentation
- Free to build and publish

**Limitations**: No native GraphQL - requires HTTP workarounds

**Documentation**: https://docs.zapier.com/platform/

### Not Recommended

#### Microsoft Power Automate

**Issues**:
- No native GraphQL support
- Bearer token authentication unreliable (header replacement issues)
- Expensive premium licensing required ($15/user/mo minimum)
- Limited custom connector capabilities

---

## Part 4: Implementation Recommendations

### For Internal Use

**Recommended: Activepieces (Self-Hosted)**

1. Deploy Activepieces via Docker
2. Create custom Starhunter piece with TypeScript
3. Implement all 10 operations from n8n node
4. No ongoing costs, full control

### For Customer-Facing Integration

**Recommended: Make.com**

1. Create custom app using VS Code extension
2. Implement connection with Base URL + Bearer token
3. Create modules for each operation
4. Publish privately or to marketplace

### For Developer Teams

**Recommended: Pipedream**

1. Create connected account for Starhunter
2. Build workflows with code steps
3. Use urql or graphql-request for queries
4. Share workflows via Git

### Migration Path from n8n

| n8n Operation | Make.com Module Type | Activepieces Action Type |
|---------------|---------------------|-------------------------|
| Person - getById | Action | Action |
| Person - search | Search | Action (returns array) |
| Person - getBirthdays | Search | Action (returns array) |
| Candidate - search | Search | Action (returns array) |
| Employee - getCurrent | Action | Action |
| Employee - search | Search | Action (returns array) |
| Email - log | Action | Action |
| Project Candidate - getByStatusChangeDate | Search | Action (returns array) |
| Task - create | Action | Action |

---

## Code References

### n8n Implementation Files

- `n8n/nodes/Starhunter/Starhunter.node.ts` - Main node definition
- `n8n/credentials/StarhunterApi.credentials.ts` - Authentication
- `n8n/nodes/Starhunter/actions/person/getById.ts` - Person getById
- `n8n/nodes/Starhunter/actions/person/search.ts` - Person search
- `n8n/nodes/Starhunter/actions/person/getBirthdays.ts` - Birthday search
- `n8n/nodes/Starhunter/actions/candidate/search.ts` - Candidate search
- `n8n/nodes/Starhunter/actions/employee/getCurrent.ts` - Current user
- `n8n/nodes/Starhunter/actions/employee/search.ts` - Employee search
- `n8n/nodes/Starhunter/actions/email/log.ts` - Email logging
- `n8n/nodes/Starhunter/actions/projectCandidate/getByStatusChangeDate.ts` - Status change filter
- `n8n/nodes/Starhunter/actions/task/create.ts` - Task creation

---

## Sources

### Make.com
- https://developers.make.com
- https://developers.make.com/custom-apps-documentation
- https://developers.make.com/custom-apps-documentation/app-structure/modules/universal-module/graphql
- https://developers.make.com/custom-apps-documentation/app-structure/base/authorization
- https://marketplace.visualstudio.com/items?itemName=Integromat.apps-sdk

### Activepieces
- https://www.activepieces.com/docs/developers/misc/build-piece
- https://www.activepieces.com/docs/developers/piece-reference/authentication
- https://www.activepieces.com/pieces/graphql
- https://github.com/activepieces/activepieces

### Pipedream
- https://pipedream.com/blog/graphql-requests-with-node-js/
- https://pipedream.com/docs/integrations/connected-accounts/
- https://pipedream.com/docs/v1/workflows/steps/code/auth/

### Workato
- https://docs.workato.com/connectors/graphql.html
- https://docs.workato.com/developing-connectors/sdk.html

### Zapier
- https://docs.zapier.com/platform/quickstart/build-integration
- https://docs.zapier.com/platform/build/apikeyauth

### Tray.io
- https://docs.tray.ai/connectors/core/graphql/
- https://tray.io/pricing

---

## Open Questions

1. **Make.com Webhooks**: Would Starhunter benefit from instant triggers via webhooks? The GraphQL API would need to support subscriptions or webhook callbacks.

2. **Rate Limiting**: What are the Starhunter API rate limits? This affects pagination strategy in automation platforms.

3. **Schema Evolution**: How stable is the Starhunter GraphQL schema? Frequent changes would favor platforms with schema introspection (Workato).

4. **Trigger Requirements**: Does the use case need polling triggers (check for new records periodically) or is action-based sufficient?
