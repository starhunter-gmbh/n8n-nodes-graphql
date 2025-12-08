# Starhunter GraphQL New Nodes Implementation Plan

## Overview

Implement 3 new GraphQL operations for the Starhunter n8n node package to support extended API functionality: project search, adding candidates to projects, and updating presentation status.

## Current State Analysis

### Existing Implementation
- **Main Node**: `nodes/Starhunter/Starhunter.node.ts:1-329`
- **Credentials**: `credentials/StarhunterApi.credentials.ts:1-57`
- **Current Resources**: 6 (Person, Candidate, Employee, Email, ProjectCandidate, Task)
- **Current Operations**: 8 total
- **AI Agent Support**: Already enabled via `usableAsTool: true` on line 28

### Key Discoveries
- Node follows consistent pattern: resource directories with operation files
- Each operation exports `description` (INodeProperties[]) and `execute` function
- Barrel exports via `index.ts` in each resource directory
- Main node file routes operations in execute() method (lines 231-327)
- GraphQL queries use typed template literals with `/* GraphQL */` tag
- Error handling via NodeApiError with response.errors mapping

### Current Resources Structure
```
nodes/Starhunter/actions/
├── candidate/
│   ├── index.ts
│   └── search.ts (query with filters)
├── email/
│   ├── index.ts
│   └── log.ts (mutation)
├── employee/
│   ├── index.ts
│   ├── getCurrent.ts (query, no params)
│   └── search.ts (query with filters)
├── person/
│   ├── index.ts
│   ├── getBirthdays.ts (query)
│   ├── getById.ts (query)
│   └── search.ts (query with filters)
├── projectCandidate/
│   ├── index.ts
│   └── getByStatusChangeDate.ts (query)
└── task/
    ├── index.ts
    └── create.ts (mutation)
```

## Desired End State

After implementation, the Starhunter node will support 11 total operations across 8 resources:

**New Resources:**
- **Project** (1 operation): Search projects by status
- **Presentation** (1 operation): Update presentation status

**Extended Resources:**
- **ProjectCandidate** (2 operations): Existing getByStatusChangeDate + new add operation

### Verification
- Build succeeds: `npm run build`
- All operations appear in n8n UI with proper resource/operation selectors
- GraphQL queries execute successfully against test API
- Node remains compatible with AI Agents (usableAsTool: true)

## What We're NOT Doing

- NOT implementing `version` query (user confirmed to omit)
- NOT implementing `talentorangeFunctions` query (user confirmed to omit)
- NOT including nested relations in GraphQL responses (basic fields only)
- NOT adding dynamic field selection (fixed field lists per operation)
- NOT implementing batch operations or bulk mutations
- NOT adding caching or rate limiting
- NOT creating separate credentials for different environments
- NOT updating API version compatibility checking

## Implementation Approach

Follow existing patterns for consistency:
1. Create new resource directories with operation files
2. Export operations via barrel exports (index.ts)
3. Update main node file with resource options, operation selectors, and routing
4. Use GraphQL template literals with proper TypeScript types
5. Follow error handling pattern from existing operations

**Pattern References:**
- Query with filters: `nodes/Starhunter/actions/candidate/search.ts:1-155`
- Mutation with required/optional params: `nodes/Starhunter/actions/task/create.ts:1-149`
- Query without params: `nodes/Starhunter/actions/employee/getCurrent.ts:1-66`

## Phase 1: Create Project Resource

### Overview
Implement new Project resource with search operation supporting status filtering and pagination.

### Changes Required

#### 1. Create Project Resource Directory Structure
**Action**: Create new directory and files

```bash
mkdir -p nodes/Starhunter/actions/project
```

#### 2. Implement Project Search Operation
**File**: `nodes/Starhunter/actions/project/search.ts`

```typescript
import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		default: '',
		description: 'Filter by project status (e.g., "Suche")',
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
		description: 'Max number of results to return',
		typeOptions: {
			minValue: 1,
			maxValue: 1000,
		},
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		default: 0,
		description: 'Number of results to skip for pagination',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['search'],
			},
		},
	},
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
				createdAt
				updatedAt
				status
				position
				startDate
				endDate
				candidateCount
				company
			}
		}
	`;

	const variables = {
		status: status || undefined,
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

#### 3. Create Project Barrel Export
**File**: `nodes/Starhunter/actions/project/index.ts`

```typescript
import * as search from './search';

export { search };
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Project resource files exist at correct paths
- [ ] Barrel export properly exports search operation

#### Manual Verification
- [ ] Project resource appears in n8n resource selector dropdown
- [ ] Search operation appears when Project resource is selected
- [ ] Status, Limit, and Offset fields appear in node UI
- [ ] Search with no filters returns project list
- [ ] Search with status filter (e.g., "Suche") returns filtered results
- [ ] Pagination works correctly with limit/offset parameters

---

## Phase 2: Extend ProjectCandidate Resource

### Overview
Add new "Add to Project" operation to existing ProjectCandidate resource.

### Changes Required

#### 1. Implement Add Candidate to Project Operation
**File**: `nodes/Starhunter/actions/projectCandidate/add.ts`

```typescript
import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the project',
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
		description: 'The ID of the candidate',
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
			show: {
				resource: ['projectCandidate'],
				operation: ['add'],
			},
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
				rejectionReason
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

#### 2. Update ProjectCandidate Barrel Export
**File**: `nodes/Starhunter/actions/projectCandidate/index.ts`

```typescript
import * as add from './add';
import * as getByStatusChangeDate from './getByStatusChangeDate';

export { add, getByStatusChangeDate };
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Add operation file exists at correct path
- [ ] Barrel export includes both operations

#### Manual Verification
- [ ] "Add to Project" operation appears in ProjectCandidate operation selector
- [ ] Project ID and Candidate ID fields are marked as required
- [ ] Status field appears as optional
- [ ] Mutation successfully adds candidate to project with valid IDs
- [ ] Mutation works with optional status parameter
- [ ] Mutation works without status parameter
- [ ] Error handling works for invalid project/candidate IDs

---

## Phase 3: Create Presentation Resource

### Overview
Implement new Presentation resource with updateStatus operation.

### Changes Required

#### 1. Create Presentation Resource Directory Structure
**Action**: Create new directory and files

```bash
mkdir -p nodes/Starhunter/actions/presentation
```

#### 2. Implement Update Presentation Status Operation
**File**: `nodes/Starhunter/actions/presentation/updateStatus.ts`

```typescript
import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Presentation ID',
		name: 'presentationId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the presentation',
		displayOptions: {
			show: {
				resource: ['presentation'],
				operation: ['updateStatus'],
			},
		},
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		default: '',
		required: true,
		description: 'The new status value',
		displayOptions: {
			show: {
				resource: ['presentation'],
				operation: ['updateStatus'],
			},
		},
	},
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Optional comment about the status change',
		displayOptions: {
			show: {
				resource: ['presentation'],
				operation: ['updateStatus'],
			},
		},
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const presentationId = context.getNodeParameter('presentationId', itemIndex) as string;
	const status = context.getNodeParameter('status', itemIndex) as string;
	const comment = context.getNodeParameter('comment', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation UpdatePresentationStatus(
			$presentationId: Id!
			$status: String!
			$comment: String
		) {
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
	`;

	const variables: Record<string, string | undefined> = {
		presentationId,
		status,
		comment: comment || undefined,
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

	return response.data?.updatePresentationStatus || null;
}
```

#### 3. Create Presentation Barrel Export
**File**: `nodes/Starhunter/actions/presentation/index.ts`

```typescript
import * as updateStatus from './updateStatus';

export { updateStatus };
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Presentation resource files exist at correct paths
- [ ] Barrel export properly exports updateStatus operation

#### Manual Verification
- [ ] Presentation resource appears in n8n resource selector dropdown
- [ ] Update Status operation appears when Presentation resource is selected
- [ ] Presentation ID and Status fields are marked as required
- [ ] Comment field appears as optional with multiline text area (4 rows)
- [ ] Mutation successfully updates presentation status with valid ID
- [ ] Mutation works with optional comment parameter
- [ ] Mutation works without comment parameter
- [ ] Error handling works for invalid presentation ID

---

## Phase 4: Update Main Node File

### Overview
Wire all new resources and operations into the main Starhunter node file.

### Changes Required

#### 1. Add Resource Imports
**File**: `nodes/Starhunter/Starhunter.node.ts`
**Location**: After line 14 (after existing imports)

```typescript
import * as presentation from './actions/presentation';
import * as project from './actions/project';
```

#### 2. Add Resource Options
**File**: `nodes/Starhunter/Starhunter.node.ts`
**Location**: Lines 39-64 (in resource selector options array)

Add to the `options` array in alphabetical order:

```typescript
{
	name: 'Presentation',
	value: 'presentation',
},
{
	name: 'Project',
	value: 'project',
},
```

#### 3. Add Project Operation Selector
**File**: `nodes/Starhunter/Starhunter.node.ts`
**Location**: After line 216 (after Task operations block)

```typescript
// Project operations
{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['project'],
		},
	},
	options: [
		{
			name: 'Search',
			value: 'search',
			action: 'Search projects',
			description: 'Search for projects by status',
		},
	],
	default: 'search',
},
```

#### 4. Add Presentation Operation Selector
**File**: `nodes/Starhunter/Starhunter.node.ts`
**Location**: After the new Project operations block

```typescript
// Presentation operations
{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['presentation'],
		},
	},
	options: [
		{
			name: 'Update Status',
			value: 'updateStatus',
			action: 'Update presentation status',
			description: 'Update the status of a presentation with optional comment',
		},
	],
	default: 'updateStatus',
},
```

#### 5. Update ProjectCandidate Operation Selector
**File**: `nodes/Starhunter/Starhunter.node.ts`
**Location**: Lines 174-194 (ProjectCandidate operations)

Update the `options` array to include the new add operation:

```typescript
options: [
	{
		name: 'Add to Project',
		value: 'add',
		action: 'Add candidate to project',
		description: 'Add a candidate to a project with optional status',
	},
	{
		name: 'Get By Status Change Date',
		value: 'getByStatusChangeDate',
		action: 'Get candidates by status change date',
		description: 'Get project candidates whose status changed X days ago',
	},
],
```

#### 6. Spread Property Descriptions
**File**: `nodes/Starhunter/Starhunter.node.ts`
**Location**: After line 227 (in properties array)

Add after existing property spreads:

```typescript
...presentation.updateStatus.description,
...project.search.description,
...projectCandidate.add.description,
```

#### 7. Add Routing Logic in execute()
**File**: `nodes/Starhunter/Starhunter.node.ts`
**Location**: In the execute() method, after line 313 (before the catch block)

Add routing for new operations:

```typescript
// Project operations
else if (resource === 'project' && operation === 'search') {
	const result = await project.search.execute(this, i, baseUrl);
	for (const item of result) {
		returnData.push({
			json: item,
			pairedItem: { item: i },
		});
	}
}
// Presentation operations
else if (resource === 'presentation' && operation === 'updateStatus') {
	const result = await presentation.updateStatus.execute(this, i, baseUrl);
	if (result) {
		returnData.push({
			json: result,
			pairedItem: { item: i },
		});
	}
}
// ProjectCandidate add operation
else if (resource === 'projectCandidate' && operation === 'add') {
	const result = await projectCandidate.add.execute(this, i, baseUrl);
	if (result) {
		returnData.push({
			json: result,
			pairedItem: { item: i },
		});
	}
}
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Dist folder contains compiled JavaScript files for all new operations
- [ ] Package builds successfully for npm publishing: `npm run prepublishOnly`

#### Manual Verification
- [ ] All 8 resources appear in resource selector (alphabetically ordered)
- [ ] Project resource shows Search operation
- [ ] Presentation resource shows Update Status operation
- [ ] ProjectCandidate resource shows both Add to Project and Get By Status Change Date
- [ ] All new operations execute successfully with valid test data
- [ ] Node still works with AI Agents (verify in n8n AI Agent workflow)
- [ ] Error messages are clear and helpful for invalid inputs
- [ ] All operations respect continueOnFail() setting

---

## Testing Strategy

### Unit Tests
Not currently implemented in this package. Future consideration: Add Jest tests for each operation's execute function.

### Integration Tests

#### Test Environment Setup
1. Ensure access to Starhunter test instance at `https://sh.php.local/Api/graphql`
2. Create valid test credentials in n8n
3. Prepare test data: valid project IDs, candidate IDs, presentation IDs

#### Test Scenarios

**Project Search:**
1. Search with no filters (should return all projects)
2. Search with status filter "Suche" (should return filtered projects)
3. Test pagination with limit=10, offset=0 and offset=10
4. Test invalid status (should return empty array or error)

**Add Candidate to Project:**
1. Add candidate with valid IDs and status
2. Add candidate with valid IDs, no status
3. Test with invalid project ID (should error)
4. Test with invalid candidate ID (should error)
5. Test adding same candidate twice (check API behavior)

**Update Presentation Status:**
1. Update status with valid ID, status, and comment
2. Update status with valid ID and status, no comment
3. Test with invalid presentation ID (should error)
4. Test with empty status (should error due to required field)

**AI Agent Integration:**
1. Create new AI Agent workflow in n8n
2. Add Starhunter node as a tool
3. Verify all 11 operations are available to the agent
4. Test agent can successfully call Project Search
5. Test agent can successfully call Add Candidate to Project
6. Test agent can successfully call Update Presentation Status

### Manual Testing Steps

1. **Build and Install:**
   ```bash
   npm run build
   # Link locally for testing
   npm link
   # In n8n instance
   npm link @starhunter/n8n-nodes-graphql
   ```

2. **Test Each Operation:**
   - Create test workflow for each new operation
   - Verify parameter validation (required fields)
   - Test with valid data
   - Test error handling with invalid data
   - Check output data structure

3. **Test AI Agent Integration:**
   - Create AI Agent workflow
   - Add Starhunter as tool
   - Prompt agent to search for projects
   - Prompt agent to add candidate to project
   - Prompt agent to update presentation status
   - Verify agent receives and processes responses correctly

4. **Regression Testing:**
   - Verify all 8 existing operations still work
   - Check that no existing functionality broke
   - Verify credential testing still works

## Performance Considerations

- GraphQL queries return only requested fields (no over-fetching)
- Pagination implemented on Project search to handle large datasets
- Error responses are lightweight (mapped messages only)
- No client-side caching (stateless operations)
- Each operation is independent (no shared state issues)

## Migration Notes

- No breaking changes to existing operations
- Existing workflows will continue to work unchanged
- New operations are additive only
- API version targeting: 0.1 (per research document line 74)
- API is still in development per warning (research document lines 863-876)

## API Stability Warning

Per the research document, the Starhunter GraphQL API includes this warning:

```json
{
  "extensions": {
    "warning": "The Starhunter GraphQL API is still under development. Endpoints may change before final release. Use at your own risk."
  }
}
```

**Implications:**
- Field names or types may change in future API versions
- Operations may be renamed or restructured
- Response structure may evolve
- Consider implementing version checking in future iterations
- Document the API version this implementation targets (0.1)

## References

- Original research: `/home/cschreiner/thoughts/shared/research/2025-12-02-starhunter-graphql-new-nodes.md`
- Main node: `nodes/Starhunter/Starhunter.node.ts:1-329`
- Query pattern (with filters): `nodes/Starhunter/actions/candidate/search.ts:1-155`
- Mutation pattern: `nodes/Starhunter/actions/task/create.ts:1-149`
- Credentials: `credentials/StarhunterApi.credentials.ts:1-57`
- Package config: `package.json:1-57`

## Post-Implementation Tasks

After all phases are complete:

1. **Update README.md** with new operations
2. **Version bump** to 0.1.7 in package.json
3. **Test in real n8n instance** before publishing
4. **Create git commit** with descriptive message
5. **Publish to npm**: `npm run release`
6. **Update internal documentation** with new capabilities
7. **Notify users** of new operations available
