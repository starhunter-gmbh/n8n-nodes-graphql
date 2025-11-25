# Research: n8n Node for Starhunter Birthday API

**Date**: 2025-11-25T10:30:00+01:00
**Researcher**: Claude Code
**Repository**: @starhunter/n8n-nodes-birthdays
**Branch**: main

## Research Question

How to implement an n8n node that fetches persons with birthdays on a given date from the Starhunter GraphQL API, with centralized configuration for the API token and base URL.

## Summary

The Starhunter GraphQL API provides a `persons` query that accepts a `birthDate` argument in `MM-DD` format. The current codebase uses declarative REST-style routing which is incompatible with GraphQL. The node must be converted to use a programmatic `execute()` method, and the credentials must be extended to include a configurable `baseUrl` field alongside the existing Bearer token.

---

## Detailed Findings

### 1. Starhunter GraphQL API Schema

**Endpoint**: `https://release-current.starhunter.software/Api/graphql`

**Authentication**: Bearer token in `Authorization` header

#### Available Queries

| Query | Arguments | Description |
|-------|-----------|-------------|
| `persons` | `name`, `birthDate`, `limit`, `offset` | Query persons with optional filters |
| `person` | `id` (required) | Get single person by ID |
| `candidate` | `candidateId`, `birthDate`, `name`, `limit`, `offset` | Query candidates |
| `employee` | `employeeId`, `name`, `limit`, `offset` | Query employees |
| `projectCandidates` | `projectId`, `status`, `limit`, `offset` | Query project candidates |
| `user` | (none) | Get current authenticated user |
| `version` | (none) | Get API version |

#### BirthDate Scalar Type

```
Type: BirthDate
Kind: SCALAR
Description: "Date without Year (MM-DD)"
Format: "MM-DD" (e.g., "11-25" for November 25)
```

#### Person Type Fields

| Field | Type | Required |
|-------|------|----------|
| `id` | `Id!` | Yes |
| `name` | `String` | No |
| `firstName` | `String` | No |
| `secondName` | `String` | No |
| `middleName` | `String` | No |
| `academicTitle` | `String` | No |
| `salutation` | `String` | No |
| `birthDate` | `Date` | No |
| `functions` | `String` | No |
| `email` | `String` | No |
| `phone` | `String` | No |
| `address` | `String` | No |
| `createdAt` | `DateTime` | No |
| `updatedAt` | `DateTime` | No |

#### Example Birthday Query

```graphql
query GetBirthdays($date: BirthDate, $limit: Int) {
  persons(birthDate: $date, limit: $limit) {
    id
    name
    firstName
    secondName
    email
    birthDate
    phone
  }
}
```

**Variables**:
```json
{
  "date": "11-25",
  "limit": 100
}
```

**Response**:
```json
{
  "data": {
    "persons": [
      {
        "id": "682c61b9c785e",
        "name": "Richard Genze",
        "firstName": "Richard",
        "secondName": "Genze",
        "email": "r.genze@gmail.com",
        "birthDate": "1987-11-25",
        "phone": null
      }
    ]
  }
}
```

---

### 2. Current Codebase Structure

```
n8n-nodes-birthdays/
├── credentials/
│   └── StarhunterBirthdaysApi.credentials.ts  # Bearer token only
├── nodes/
│   └── StarhunterBirthdays/
│       ├── StarhunterBirthdays.node.ts        # Declarative REST style
│       ├── StarhunterBirthdays.node.json      # Node metadata
│       ├── starhunterBirthdays.svg            # Icon (light)
│       ├── starhunterBirthdays.dark.svg       # Icon (dark)
│       └── resources/
│           ├── user/
│           │   ├── index.ts                   # User operations (REST)
│           │   ├── get.ts
│           │   └── create.ts
│           └── company/
│               ├── index.ts                   # Company operations (REST)
│               └── getAll.ts
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

#### Current Credentials Implementation

**File**: `credentials/StarhunterBirthdaysApi.credentials.ts`

```typescript
export class StarhunterBirthdaysApi implements ICredentialType {
  name = 'starhunterBirthdaysApi';
  displayName = 'Starhunter Birthdays API';

  properties: INodeProperties[] = [
    {
      displayName: 'Access Token',
      name: 'accessToken',
      type: 'string',
      typeOptions: { password: true },
      required: true,
      default: '',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.accessToken}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://release-current.starhunter.software/Api/graphql',  // HARDCODED
      url: '/v1/user',
    },
  };
}
```

**Issues**:
- Base URL is hardcoded - not configurable per Starhunter instance
- Test request uses REST endpoint that doesn't exist on GraphQL API

#### Current Node Implementation

**File**: `nodes/StarhunterBirthdays/StarhunterBirthdays.node.ts`

```typescript
export class StarhunterBirthdays implements INodeType {
  description: INodeTypeDescription = {
    // ...
    requestDefaults: {
      baseURL: 'https://release-current.starhunter.software/Api/graphql',  // HARDCODED
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    properties: [
      // Resource selector with User/Company
      // Uses declarative routing patterns
    ],
  };
  // No execute() method - relies on declarative routing
}
```

**Issues**:
- Uses declarative REST-style routing
- GraphQL requires POST body with `query` and `variables` - not supported by declarative style
- Base URL hardcoded in `requestDefaults`

---

### 3. n8n Node Development Patterns

#### Declarative vs Programmatic Style

| Aspect | Declarative | Programmatic |
|--------|-------------|--------------|
| Use Case | Simple REST APIs | Complex logic, GraphQL |
| Implementation | `routing` property in operations | `execute()` method |
| Request Body | Limited to simple key-value | Full control over structure |
| GraphQL Support | Not suitable | Required |

**Recommendation**: GraphQL nodes must use programmatic style with `execute()` method.

#### Programmatic Execute Pattern for GraphQL

```typescript
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError } from 'n8n-workflow';

export class StarhunterBirthdays implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Starhunter Birthdays',
    name: 'starhunterBirthdays',
    // ... other metadata
    credentials: [{ name: 'starhunterBirthdaysApi', required: true }],
    properties: [
      // Define UI fields declaratively
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const credentials = await this.getCredentials('starhunterBirthdaysApi');
    const baseUrl = credentials.baseUrl as string;

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;

      let query: string;
      let variables: Record<string, unknown> = {};

      if (operation === 'getBirthdays') {
        const date = this.getNodeParameter('date', i, '') as string;
        const useToday = this.getNodeParameter('useToday', i, true) as boolean;

        const birthDate = useToday ? getTodayMMDD() : date;

        query = `
          query GetBirthdays($date: BirthDate, $limit: Int) {
            persons(birthDate: $date, limit: $limit) {
              id name firstName secondName email birthDate phone
            }
          }
        `;
        variables = { date: birthDate, limit: 100 };
      }

      const requestOptions: IHttpRequestOptions = {
        method: 'POST',
        url: baseUrl,
        body: { query, variables },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        json: true,
      };

      const response = await this.helpers.httpRequestWithAuthentication.call(
        this,
        'starhunterBirthdaysApi',
        requestOptions,
      );

      // Handle GraphQL errors
      if (response.errors?.length) {
        throw new NodeApiError(this.getNode(), response, {
          message: response.errors.map((e: any) => e.message).join(', '),
        });
      }

      // Return each person as separate item
      const persons = response.data?.persons || [];
      for (const person of persons) {
        returnData.push({
          json: person,
          pairedItem: { item: i },
        });
      }
    }

    return [returnData];
  }
}

function getTodayMMDD(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}
```

#### Credentials with Configurable Base URL

```typescript
import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class StarhunterBirthdaysApi implements ICredentialType {
  name = 'starhunterBirthdaysApi';
  displayName = 'Starhunter API';
  documentationUrl = 'https://docs.starhunter.software/api';

  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://release-current.starhunter.software/Api/graphql',
      required: true,
      description: 'The GraphQL endpoint URL of your Starhunter instance',
    },
    {
      displayName: 'Access Token',
      name: 'accessToken',
      type: 'string',
      typeOptions: { password: true },
      required: true,
      default: '',
      description: 'Your Starhunter API access token',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.accessToken}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      method: 'POST',
      baseURL: '={{$credentials.baseUrl}}',
      url: '',
      body: {
        query: '{ __typename }',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };
}
```

---

### 4. Node UI Properties for Birthday Operation

```typescript
const personBirthdayProperties: INodeProperties[] = [
  {
    displayName: 'Use Today\'s Date',
    name: 'useToday',
    type: 'boolean',
    default: true,
    description: 'Whether to use today\'s date for the birthday search',
    displayOptions: {
      show: {
        resource: ['person'],
        operation: ['getBirthdays'],
      },
    },
  },
  {
    displayName: 'Date',
    name: 'date',
    type: 'string',
    default: '',
    placeholder: 'MM-DD (e.g., 11-25)',
    description: 'The date to search for birthdays (format: MM-DD)',
    displayOptions: {
      show: {
        resource: ['person'],
        operation: ['getBirthdays'],
        useToday: [false],
      },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 100,
    description: 'Maximum number of results to return',
    typeOptions: {
      minValue: 1,
      maxValue: 1000,
    },
    displayOptions: {
      show: {
        resource: ['person'],
        operation: ['getBirthdays'],
      },
    },
  },
];
```

---

### 5. Implementation Checklist

- [ ] **Credentials**: Add `baseUrl` property with default value
- [ ] **Credentials**: Update test request to use GraphQL introspection query
- [ ] **Node**: Add `execute()` method for programmatic style
- [ ] **Node**: Add "Person" resource option
- [ ] **Node**: Add "Get Birthdays" operation under Person resource
- [ ] **Node**: Add `useToday` boolean toggle (default: true)
- [ ] **Node**: Add `date` field (shown when useToday is false)
- [ ] **Node**: Add `limit` field for pagination
- [ ] **Node**: Implement GraphQL query construction
- [ ] **Node**: Handle GraphQL error responses
- [ ] **Node**: Return each person as separate n8n item
- [ ] **Cleanup**: Remove or update unused REST-style resources (user, company)

---

## Code References

| File | Line | Description |
|------|------|-------------|
| `credentials/StarhunterBirthdaysApi.credentials.ts` | 1-42 | Current credentials (needs baseUrl) |
| `nodes/StarhunterBirthdays/StarhunterBirthdays.node.ts` | 1-50 | Current node (needs execute method) |
| `nodes/StarhunterBirthdays/resources/user/index.ts` | 1-60 | Example of declarative routing pattern |

---

## External References

- [n8n: Choose Node Building Style](https://docs.n8n.io/integrations/creating-nodes/plan/choose-node-method/)
- [n8n: Programmatic Execute Method](https://docs.n8n.io/integrations/creating-nodes/build/reference/node-base-files/programmatic-style-execute-method/)
- [n8n: HTTP Request Helpers](https://docs.n8n.io/integrations/creating-nodes/build/reference/http-helpers/)
- [n8n: Credentials Files Reference](https://docs.n8n.io/integrations/creating-nodes/build/reference/credentials-files/)
- [n8n GraphQL Node Source Code](https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/GraphQL/GraphQL.node.ts)

---

## API Warning

The Starhunter GraphQL API returns this warning with every response:

> "The Starhunter GraphQL API is still under development. Endpoints may change before final release. Use at your own risk."

Plan for potential schema changes in future versions.
