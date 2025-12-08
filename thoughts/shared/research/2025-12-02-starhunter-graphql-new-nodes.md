---
date: 2025-12-02T18:13:47+01:00
researcher: cschreiner
git_commit: 659c1259c96e7e0185b8611e36bb985cfe00b5a8
branch: main
repository: automation-nodes
topic: "Extended GraphQL API - New Nodes Required"
tags: [research, codebase, starhunter, graphql, n8n, automation-nodes]
status: complete
last_updated: 2025-12-02
last_updated_by: cschreiner
---

# Research: Extended GraphQL API - New Nodes Required

**Date**: 2025-12-02T18:13:47+01:00
**Researcher**: cschreiner
**Git Commit**: 659c1259c96e7e0185b8611e36bb985cfe00b5a8
**Branch**: main
**Repository**: automation-nodes

## Research Question

The GraphQL API at `https://sh.php.local/Api/graphql` has been extended with new operations. What new automation nodes are needed to support these new GraphQL operations?

## Summary

The Starhunter GraphQL API has been extended with **5 new operations** that are not currently implemented in the n8n automation nodes:

**New Queries (3):**
1. `version` - Returns API version string
2. `projects` - Search and list projects with status filtering
3. `talentorangeFunctions` - Get available job function categories

**New Mutations (2):**
1. `addCandidateToProject` - Add a candidate to a project with optional status
2. `updatePresentationStatus` - Update presentation status with comment

These require implementing new action handlers following the existing codebase patterns. The current implementation covers 8 operations across 6 resources (Person, Candidate, Employee, Email, ProjectCandidate, Task).

## Current Implementation Status

### Already Implemented Operations (8 total)

**Person Resource** (3 operations):
- `person/getById.ts` - Query `person(id: Id!)` - Get person by ID
- `person/search.ts` - Query `persons(name, birthDate, limit, offset)` - Search persons
- `person/getBirthdays.ts` - Query `persons(birthDate)` - Get birthdays on specific date

**Candidate Resource** (1 operation):
- `candidate/search.ts` - Query `candidate(candidateId, birthDate, name, limit, offset)` - Search candidates

**Employee Resource** (2 operations):
- `employee/getCurrent.ts` - Query `user` - Get current authenticated user
- `employee/search.ts` - Query `employee(employeeId, name, limit, offset)` - Search employees

**ProjectCandidate Resource** (1 operation):
- `projectCandidate/getByStatusChangeDate.ts` - Query `projectCandidates(projectId, status, limit, offset)` - Get candidates by status change date

**Task Resource** (1 operation):
- `task/create.ts` - Mutation `createTask(title!, description, deadline, assignee, target)` - Create new task

**Email Resource** (1 operation):
- `email/log.ts` - Mutation `logEmail(from!, to!, subject!, body!)` - Log email activity

## Detailed Findings

### New Operation 1: API Version Query

**GraphQL Operation**: `version`

**Type**: Query (no parameters)

**Returns**: String (e.g., "0.1")

**Purpose**: Get the current API version for compatibility checking

**Implementation Requirements**:
- Resource: Could be standalone or under a new "System" resource
- Operation: `getVersion`
- Parameters: None (empty `description` array)
- Return type: `IDataObject | null` (single result)

**Example GraphQL Query**:
```graphql
query GetVersion {
  version
}
```

**Example Response**:
```json
{
  "data": {
    "version": "0.1"
  }
}
```

**Implementation Location**:
- Create new directory: `nodes/Starhunter/actions/system/`
- Create file: `nodes/Starhunter/actions/system/getVersion.ts`

---

### New Operation 2: Projects Search Query

**GraphQL Operation**: `projects`

**Type**: Query

**Parameters**:
- `status` (String, optional) - Filter by project status (e.g., "Suche")
- `limit` (Int, optional) - Maximum number of results
- `offset` (Int, optional) - Pagination offset

**Returns**: Array of Project objects

**Project Type Fields**:
```typescript
{
  id: Id!           // Required
  name: String      // e.g., "ACME Ltd. - Chief of Finance (7 Kandidaten)"
  createdAt: DateTime
  updatedAt: DateTime
  status: String    // e.g., "Suche"
  position: String  // e.g., "Chief of Finance"
  startDate: Date
  endDate: Date
  candidateCount: Int
  company: String   // e.g., "ACME Ltd."
  candidates: [ProjectCandidate]  // Nested relation
}
```

**Purpose**: Search and list projects with filtering by status, useful for project management workflows

**Implementation Requirements**:
- Resource: New "Project" resource or add to existing resources
- Operation: `search`
- Parameters: status (string), limit (number, default 50), offset (number, default 0)
- Return type: `IDataObject[]` (array result)
- Pattern: Follow `candidate/search.ts` pattern (search with multiple filters)

**Example GraphQL Query**:
```graphql
query SearchProjects($status: String, $limit: Int, $offset: Int) {
  projects(status: $status, limit: $limit, offset: $offset) {
    id
    name
    status
    position
    company
    startDate
    endDate
    candidateCount
  }
}
```

**Example Response**:
```json
{
  "data": {
    "projects": [
      {
        "id": "64ecc0d347083",
        "name": "ACME Ltd. - Chief of Finance (7 Kandidaten)",
        "status": "Suche",
        "position": "Chief of Finance",
        "company": "ACME Ltd.",
        "startDate": "-0001-11-30",
        "endDate": "-0001-11-30",
        "candidateCount": 7
      }
    ]
  }
}
```

**Implementation Location**:
- Create new directory: `nodes/Starhunter/actions/project/`
- Create file: `nodes/Starhunter/actions/project/search.ts`
- Create barrel export: `nodes/Starhunter/actions/project/index.ts`

---

### New Operation 3: TalentOrange Functions Query

**GraphQL Operation**: `talentorangeFunctions`

**Type**: Query (no parameters)

**Returns**: Array of Function objects

**Function Type Fields**:
```typescript
{
  value: String   // e.g., "59301748c19b2"
  label: String   // e.g., "Administration"
}
```

**Purpose**: Get list of available job function categories (23 total), used for categorizing positions and candidates

**Available Functions**:
- Administration, Betriebliche Gesundheit, Business Development, Consulting
- Design und Kunst, Einkauf, Finanz, Geschäftsführung
- Ingenieurswesen, IT, Logistik & Produktion, Management
- Marketing, Operations, Personal & Recht, PR und Kommunikation
- Produkt Management, Projektmanagement, Qualitätssicherung
- Rechtswesen, Sales, Support, Weiterbildung

**Implementation Requirements**:
- Resource: Could be under "System" or standalone "Function" resource
- Operation: `getAll` or `list`
- Parameters: None (empty `description` array)
- Return type: `IDataObject[]` (array result)
- Pattern: Follow `employee/getCurrent.ts` pattern (no parameters, but array return)

**Example GraphQL Query**:
```graphql
query GetTalentOrangeFunctions {
  talentorangeFunctions {
    value
    label
  }
}
```

**Example Response** (truncated):
```json
{
  "data": {
    "talentorangeFunctions": [
      {
        "value": "59301748c19b2",
        "label": "Administration"
      },
      {
        "value": "54c7ccde1263b",
        "label": "Geschäftsführung"
      },
      {
        "value": "593019d77f08f",
        "label": "IT"
      }
    ]
  }
}
```

**Implementation Location**:
- Add to system directory: `nodes/Starhunter/actions/system/getFunctions.ts`

---

### New Operation 4: Add Candidate to Project Mutation

**GraphQL Operation**: `addCandidateToProject`

**Type**: Mutation

**Parameters**:
- `projectId` (Id!, required) - The project ID
- `candidateId` (Id!, required) - The candidate ID
- `status` (String, optional) - Initial status for the project candidate

**Returns**: ProjectCandidate object (or success indicator)

**ProjectCandidate Type Fields**:
```typescript
{
  id: Id
  status: String
  changeDate: Date
  rejectionReason: String
  candidate: Candidate    // Nested relation
  project: Project        // Nested relation
}
```

**Purpose**: Associate a candidate with a project, commonly used in recruitment workflows to track which candidates are being considered for which positions

**Implementation Requirements**:
- Resource: "ProjectCandidate" resource (already exists)
- Operation: `add` or `create`
- Parameters: projectId (string, required), candidateId (string, required), status (string, optional)
- Return type: `IDataObject | null` (single result)
- Pattern: Follow `task/create.ts` pattern (mutation with required and optional parameters)

**Example GraphQL Mutation**:
```graphql
mutation AddCandidateToProject($projectId: Id!, $candidateId: Id!, $status: String) {
  addCandidateToProject(
    projectId: $projectId
    candidateId: $candidateId
    status: $status
  ) {
    id
    status
    changeDate
    candidate {
      id
      name
    }
    project {
      id
      name
    }
  }
}
```

**Implementation Location**:
- Add to existing directory: `nodes/Starhunter/actions/projectCandidate/add.ts`

---

### New Operation 5: Update Presentation Status Mutation

**GraphQL Operation**: `updatePresentationStatus`

**Type**: Mutation

**Parameters**:
- `presentationId` (Id!, required) - The presentation ID
- `status` (String!, required) - New status value
- `comment` (String, optional) - Optional comment about the status change

**Returns**: Success indicator or updated presentation object

**Purpose**: Update the status of a candidate presentation (likely when presenting candidates to clients), with optional comment for tracking feedback

**Implementation Requirements**:
- Resource: New "Presentation" resource
- Operation: `updateStatus`
- Parameters: presentationId (string, required), status (string, required), comment (string, optional, multiline)
- Return type: `IDataObject | null` (single result)
- Pattern: Follow `task/create.ts` pattern (mutation with required and optional parameters)

**Example GraphQL Mutation**:
```graphql
mutation UpdatePresentationStatus($presentationId: Id!, $status: String!, $comment: String) {
  updatePresentationStatus(
    presentationId: $presentationId
    status: $status
    comment: $comment
  ) {
    id
    status
    updatedAt
  }
}
```

**Implementation Location**:
- Create new directory: `nodes/Starhunter/actions/presentation/`
- Create file: `nodes/Starhunter/actions/presentation/updateStatus.ts`
- Create barrel export: `nodes/Starhunter/actions/presentation/index.ts`

---

## Implementation Patterns

All new nodes should follow the established patterns documented in the codebase:

### Pattern: Query with No Parameters (version, talentorangeFunctions)

Reference: `/home/cschreiner/projects/starhunter-utils/automation-nodes/nodes/Starhunter/actions/employee/getCurrent.ts`

```typescript
export const description: INodeProperties[] = [];  // No parameters

export async function execute(
  context: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
): Promise<IDataObject | IDataObject[]> {
  const query = /* GraphQL */ `
    query GetData {
      fieldName {
        field1
        field2
      }
    }
  `;

  const requestOptions: IHttpRequestOptions = {
    method: 'POST',
    url: baseUrl,
    body: { query },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    json: true,
  };

  const response = await context.helpers.httpRequestWithAuthentication.call(
    context,
    'starhunterApi',
    requestOptions,
  );

  if (response.errors?.length) {
    throw new NodeApiError(context.getNode(), response, {
      message: response.errors.map((e: { message: string }) => e.message).join(', '),
    });
  }

  return response.data?.fieldName || null;
}
```

### Pattern: Query with Search/Filter Parameters (projects)

Reference: `/home/cschreiner/projects/starhunter-utils/automation-nodes/nodes/Starhunter/actions/candidate/search.ts`

```typescript
export const description: INodeProperties[] = [
  {
    displayName: 'Status',
    name: 'status',
    type: 'string',
    default: '',
    description: 'Filter by project status',
    displayOptions: {
      show: {
        resource: ['project'],
        operation: ['search'],
      },
    },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    typeOptions: { minValue: 1, maxValue: 1000 },
    displayOptions: {
      show: { resource: ['project'], operation: ['search'] },
    },
  },
  // ... more parameters
];

export async function execute(
  context: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
): Promise<IDataObject[]> {
  const status = context.getNodeParameter('status', itemIndex) as string;
  const limit = context.getNodeParameter('limit', itemIndex) as number;
  const offset = context.getNodeParameter('offset', itemIndex) as number;

  const query = /* GraphQL */ `
    query SearchProjects($status: String, $limit: Int, $offset: Int) {
      projects(status: $status, limit: $limit, offset: $offset) {
        id
        name
        status
        # ... more fields
      }
    }
  `;

  const variables = {
    status: status || undefined,  // undefined values are filtered out
    limit,
    offset,
  };

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

  const response = await context.helpers.httpRequestWithAuthentication.call(
    context,
    'starhunterApi',
    requestOptions,
  );

  if (response.errors?.length) {
    throw new NodeApiError(context.getNode(), response, {
      message: response.errors.map((e: { message: string }) => e.message).join(', '),
    });
  }

  return response.data?.projects || [];
}
```

### Pattern: Mutation with Required and Optional Parameters

Reference: `/home/cschreiner/projects/starhunter-utils/automation-nodes/nodes/Starhunter/actions/task/create.ts`

```typescript
export const description: INodeProperties[] = [
  {
    displayName: 'Project ID',
    name: 'projectId',
    type: 'string',
    default: '',
    required: true,
    description: 'The project ID',
    displayOptions: {
      show: {
        resource: ['projectCandidate'],
        operation: ['add'],
      },
    },
  },
  {
    displayName: 'Candidate ID',
    name: 'candidateId',
    type: 'string',
    default: '',
    required: true,
    description: 'The candidate ID',
    displayOptions: {
      show: {
        resource: ['projectCandidate'],
        operation: ['add'],
      },
    },
  },
  {
    displayName: 'Status',
    name: 'status',
    type: 'string',
    default: '',
    description: 'Initial status for the project candidate',
    displayOptions: {
      show: { resource: ['projectCandidate'], operation: ['add'] },
    },
  },
];

export async function execute(
  context: IExecuteFunctions,
  itemIndex: number,
  baseUrl: string,
): Promise<IDataObject | null> {
  const projectId = context.getNodeParameter('projectId', itemIndex) as string;
  const candidateId = context.getNodeParameter('candidateId', itemIndex) as string;
  const status = context.getNodeParameter('status', itemIndex) as string;

  const query = /* GraphQL */ `
    mutation AddCandidateToProject(
      $projectId: Id!
      $candidateId: Id!
      $status: String
    ) {
      addCandidateToProject(
        projectId: $projectId
        candidateId: $candidateId
        status: $status
      ) {
        id
        status
        changeDate
      }
    }
  `;

  const variables: Record<string, string | undefined> = {
    projectId,
    candidateId,
    status: status || undefined,
  };

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

  const response = await context.helpers.httpRequestWithAuthentication.call(
    context,
    'starhunterApi',
    requestOptions,
  );

  if (response.errors?.length) {
    throw new NodeApiError(context.getNode(), response, {
      message: response.errors.map((e: { message: string }) => e.message).join(', '),
    });
  }

  return response.data?.addCandidateToProject || null;
}
```

---

## File Structure Changes Required

### New Resources

**System Resource** (for version and functions):
```
nodes/Starhunter/actions/system/
├── index.ts                    # Barrel export
├── getVersion.ts              # Query: version
└── getFunctions.ts            # Query: talentorangeFunctions
```

**Project Resource** (for project search):
```
nodes/Starhunter/actions/project/
├── index.ts                    # Barrel export
└── search.ts                  # Query: projects
```

**Presentation Resource** (for status updates):
```
nodes/Starhunter/actions/presentation/
├── index.ts                    # Barrel export
└── updateStatus.ts            # Mutation: updatePresentationStatus
```

### Extended Resources

**ProjectCandidate Resource** (add to existing):
```
nodes/Starhunter/actions/projectCandidate/
├── index.ts                           # Update barrel export
├── getByStatusChangeDate.ts          # Existing
└── add.ts                            # NEW: Mutation: addCandidateToProject
```

### Main Node Updates

Update `/home/cschreiner/projects/starhunter-utils/automation-nodes/nodes/Starhunter/Starhunter.node.ts`:

1. **Import new resources**:
```typescript
import * as system from './actions/system';
import * as project from './actions/project';
import * as presentation from './actions/presentation';
```

2. **Add resource options** (lines ~73-105):
```typescript
{
  displayName: 'Resource',
  name: 'resource',
  type: 'options',
  options: [
    // ... existing resources
    { name: 'Presentation', value: 'presentation' },
    { name: 'Project', value: 'project' },
    { name: 'System', value: 'system' },
  ],
}
```

3. **Add operation selectors** for each new resource:
```typescript
// System operations
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  displayOptions: {
    show: { resource: ['system'] },
  },
  options: [
    { name: 'Get Version', value: 'getVersion' },
    { name: 'Get Functions', value: 'getFunctions' },
  ],
},

// Project operations
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  displayOptions: {
    show: { resource: ['project'] },
  },
  options: [
    { name: 'Search', value: 'search' },
  ],
},

// Presentation operations
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  displayOptions: {
    show: { resource: ['presentation'] },
  },
  options: [
    { name: 'Update Status', value: 'updateStatus' },
  ],
},

// Update ProjectCandidate operations
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  displayOptions: {
    show: { resource: ['projectCandidate'] },
  },
  options: [
    { name: 'Get by Status Change Date', value: 'getByStatusChangeDate' },
    { name: 'Add to Project', value: 'add' },  // NEW
  ],
},
```

4. **Spread property descriptions** for each operation:
```typescript
// System
...system.getVersion.description,
...system.getFunctions.description,

// Project
...project.search.description,

// Presentation
...presentation.updateStatus.description,

// ProjectCandidate (add to existing)
...projectCandidate.add.description,
```

5. **Add routing in execute()** (lines ~231-327):
```typescript
// System operations
if (resource === 'system' && operation === 'getVersion') {
  const result = await system.getVersion.execute(this, i, baseUrl);
  returnData.push({
    json: result,
    pairedItem: { item: i },
  });
}

if (resource === 'system' && operation === 'getFunctions') {
  const result = await system.getFunctions.execute(this, i, baseUrl);
  for (const item of result) {
    returnData.push({
      json: item,
      pairedItem: { item: i },
    });
  }
}

// Project operations
if (resource === 'project' && operation === 'search') {
  const result = await project.search.execute(this, i, baseUrl);
  for (const item of result) {
    returnData.push({
      json: item,
      pairedItem: { item: i },
    });
  }
}

// Presentation operations
if (resource === 'presentation' && operation === 'updateStatus') {
  const result = await presentation.updateStatus.execute(this, i, baseUrl);
  returnData.push({
    json: result,
    pairedItem: { item: i },
  });
}

// ProjectCandidate add operation (add to existing)
if (resource === 'projectCandidate' && operation === 'add') {
  const result = await projectCandidate.add.execute(this, i, baseUrl);
  returnData.push({
    json: result,
    pairedItem: { item: i },
  });
}
```

---

## Implementation Checklist

### New System Resource
- [ ] Create `nodes/Starhunter/actions/system/` directory
- [ ] Implement `system/getVersion.ts` (query, no params, returns string)
- [ ] Implement `system/getFunctions.ts` (query, no params, returns array)
- [ ] Create `system/index.ts` barrel export

### New Project Resource
- [ ] Create `nodes/Starhunter/actions/project/` directory
- [ ] Implement `project/search.ts` (query with status/limit/offset)
- [ ] Create `project/index.ts` barrel export

### New Presentation Resource
- [ ] Create `nodes/Starhunter/actions/presentation/` directory
- [ ] Implement `presentation/updateStatus.ts` (mutation with required presentationId/status, optional comment)
- [ ] Create `presentation/index.ts` barrel export

### Extend ProjectCandidate Resource
- [ ] Implement `projectCandidate/add.ts` (mutation with required projectId/candidateId, optional status)
- [ ] Update `projectCandidate/index.ts` to export add

### Update Main Node
- [ ] Import new resource modules (system, project, presentation)
- [ ] Add resource options (System, Project, Presentation)
- [ ] Add operation selectors for new resources
- [ ] Update ProjectCandidate operation selector with "Add to Project"
- [ ] Spread property descriptions for all new operations
- [ ] Add routing logic in execute() for all new operations

### Testing
- [ ] Build project: `npm run build`
- [ ] Test each new operation in n8n
- [ ] Verify error handling for missing required parameters
- [ ] Verify optional parameters work correctly
- [ ] Update README.md with new operations

---

## Summary of Changes

**Statistics**:
- **New resources**: 3 (System, Project, Presentation)
- **Extended resources**: 1 (ProjectCandidate)
- **New operation files**: 5
- **Total operations after changes**: 13 (currently 8)
- **Lines of code estimate**: ~800-1000 lines (following existing patterns)

**Resources After Implementation**:
1. Person (3 operations) - existing
2. Candidate (1 operation) - existing
3. Employee (2 operations) - existing
4. Email (1 operation) - existing
5. Task (1 operation) - existing
6. ProjectCandidate (2 operations) - 1 existing + 1 new
7. System (2 operations) - new
8. Project (1 operation) - new
9. Presentation (1 operation) - new

**Total**: 9 resources, 13 operations

---

## GraphQL API Warning

The API includes this warning in all responses:
```json
{
  "extensions": {
    "warning": "The Starhunter GraphQL API is still under development. Endpoints may change before final release. Use at your own risk."
  }
}
```

This indicates the API is not yet stable. Consider:
- Implementing version detection to handle API changes
- Adding more robust error handling for schema changes
- Documenting the API version this implementation targets (0.1)
- Planning for future updates when API stabilizes

---

## Code References

**Key Implementation Files**:
- Main node: `nodes/Starhunter/Starhunter.node.ts:16-328`
- Query pattern (no params): `nodes/Starhunter/actions/employee/getCurrent.ts:1-66`
- Query pattern (with filters): `nodes/Starhunter/actions/candidate/search.ts:1-154`
- Mutation pattern: `nodes/Starhunter/actions/task/create.ts:1-148`
- Credentials: `credentials/StarhunterApi.credentials.ts:1-57`

**Documentation**:
- Package config: `package.json:33-41` (n8n configuration)
- Usage examples: `README.md`
