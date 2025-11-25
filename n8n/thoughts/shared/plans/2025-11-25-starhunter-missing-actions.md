# Starhunter n8n Node - Missing Actions Implementation Plan

## Overview

This plan covers implementing the 6 missing GraphQL actions identified in the schema analysis. The Starhunter GraphQL API exposes 8 queries and 2 mutations, of which only 3 are currently implemented. This plan adds 5 queries and 1 mutation.

## Current State Analysis

**Implemented (3 actions):**
- `person.getBirthdays` - Query `persons(birthDate: $date)`
- `projectCandidate.getByStatusChangeDate` - Query `projectCandidates(status: $status)` with client-side date filtering
- `task.create` - Mutation `createTask`

**Missing (6 actions):**
1. `person.getById` - Query `person(id: $id)`
2. `person.search` - Query `persons(name: $name, limit: $limit, offset: $offset)`
3. `candidate.search` - Query `candidate(candidateId: $id, birthDate: $date, name: $name, limit: $limit, offset: $offset)`
4. `employee.search` - Query `employee(employeeId: $id, name: $name, limit: $limit, offset: $offset)`
5. `employee.getCurrent` - Query `user`
6. `email.log` - Mutation `logEmail(from: $from, to: $to, subject: $subject, body: $body)`

## Desired End State

All 9 actions are accessible via the n8n node:

```
Starhunter Node
├── Person
│   ├── Get by ID (NEW)
│   ├── Search (NEW)
│   └── Get Birthdays (existing)
├── Candidate
│   └── Search (NEW)
├── Employee
│   ├── Search (NEW)
│   └── Get Current User (NEW)
├── Project Candidate
│   └── Get By Status Change Date (existing)
├── Task
│   └── Create (existing)
└── Email
    └── Log Email (NEW)
```

**Verification**: After implementation, all new actions should be selectable in n8n's workflow editor and successfully execute GraphQL operations against the Starhunter API.

## What We're NOT Doing

- Adding `version` query (not needed)
- Adding `talentorangeFunctions` query (low priority reference data)
- Adding filtering by `projectId` to projectCandidates (confirmed not needed)
- Creating custom types files (existing pattern uses n8n-workflow types)
- Adding update/delete mutations (not available in API yet)

## Implementation Approach

Follow the established patterns exactly:
- Each action in its own file with `description` and `execute` exports
- Use `httpRequestWithAuthentication` for all requests
- Use `NodeApiError` for GraphQL error handling
- Array returns for queries, single object for mutations

---

## Phase 1: Person Resource - Add Get by ID and Search

### Overview
Extend the existing person resource with two new query operations.

### Changes Required:

#### 1. Create `nodes/Starhunter/actions/person/getById.ts`

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
		displayName: 'Person ID',
		name: 'personId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the person to retrieve',
		displayOptions: {
			show: {
				resource: ['person'],
				operation: ['getById'],
			},
		},
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const personId = context.getNodeParameter('personId', itemIndex) as string;

	const query = /* GraphQL */ `
		query GetPerson($id: Id!) {
			person(id: $id) {
				id
				name
				firstName
				secondName
				middleName
				academicTitle
				salutation
				email
				birthDate
				phone
				functions
				address
				createdAt
				updatedAt
			}
		}
	`;

	const variables = { id: personId };

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

	return response.data?.person || null;
}
```

#### 2. Create `nodes/Starhunter/actions/person/search.ts`

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
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Search by person name (partial match)',
		displayOptions: {
			show: {
				resource: ['person'],
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
				resource: ['person'],
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
				resource: ['person'],
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
	const name = context.getNodeParameter('name', itemIndex) as string;
	const limit = context.getNodeParameter('limit', itemIndex) as number;
	const offset = context.getNodeParameter('offset', itemIndex) as number;

	const query = /* GraphQL */ `
		query SearchPersons($name: String, $limit: Int, $offset: Int) {
			persons(name: $name, limit: $limit, offset: $offset) {
				id
				name
				firstName
				secondName
				middleName
				academicTitle
				salutation
				email
				birthDate
				phone
				functions
				address
				createdAt
				updatedAt
			}
		}
	`;

	const variables = {
		name: name || undefined,
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

	return response.data?.persons || [];
}
```

#### 3. Update `nodes/Starhunter/actions/person/index.ts`

```typescript
import * as getBirthdays from './getBirthdays';
import * as getById from './getById';
import * as search from './search';

export { getBirthdays, getById, search };
```

#### 4. Update `nodes/Starhunter/Starhunter.node.ts`

**Add operations to person resource options (around line 64):**
```typescript
options: [
	{
		name: 'Get Birthdays',
		value: 'getBirthdays',
		action: 'Get persons with birthdays on a date',
		description: 'Get all persons with birthdays on a specific date',
	},
	{
		name: 'Get by ID',
		value: 'getById',
		action: 'Get a person by ID',
		description: 'Retrieve a single person by their ID',
	},
	{
		name: 'Search',
		value: 'search',
		action: 'Search persons',
		description: 'Search for persons by name',
	},
],
```

**Spread description fields (around line 120):**
```typescript
...person.getBirthdays.description,
...person.getById.description,
...person.search.description,
```

**Add execution routing (around line 138):**
```typescript
} else if (resource === 'person' && operation === 'getById') {
	const result = await person.getById.execute(this, i, baseUrl);
	if (result) {
		returnData.push({
			json: result,
			pairedItem: { item: i },
		});
	}
} else if (resource === 'person' && operation === 'search') {
	const result = await person.search.execute(this, i, baseUrl);
	for (const item of result) {
		returnData.push({
			json: item,
			pairedItem: { item: i },
		});
	}
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Person > Get by ID returns correct person data when given valid ID
- [ ] Person > Search returns matching persons when searching by name
- [ ] Person > Search pagination works correctly with limit/offset

---

## Phase 2: Candidate Resource - Add Search

### Overview
Create new candidate resource with search operation.

### Changes Required:

#### 1. Create `nodes/Starhunter/actions/candidate/search.ts`

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
		displayName: 'Candidate ID',
		name: 'candidateId',
		type: 'string',
		default: '',
		description: 'Search by specific candidate ID',
		displayOptions: {
			show: {
				resource: ['candidate'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Search by candidate name (partial match)',
		displayOptions: {
			show: {
				resource: ['candidate'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Birth Date',
		name: 'birthDate',
		type: 'string',
		default: '',
		placeholder: 'MM-DD (e.g., 11-25)',
		description: 'Filter by birth date (format: MM-DD)',
		displayOptions: {
			show: {
				resource: ['candidate'],
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
				resource: ['candidate'],
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
				resource: ['candidate'],
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
	const candidateId = context.getNodeParameter('candidateId', itemIndex) as string;
	const name = context.getNodeParameter('name', itemIndex) as string;
	const birthDate = context.getNodeParameter('birthDate', itemIndex) as string;
	const limit = context.getNodeParameter('limit', itemIndex) as number;
	const offset = context.getNodeParameter('offset', itemIndex) as number;

	const query = /* GraphQL */ `
		query SearchCandidates($candidateId: Id, $birthDate: BirthDate, $name: String, $limit: Int, $offset: Int) {
			candidate(candidateId: $candidateId, birthDate: $birthDate, name: $name, limit: $limit, offset: $offset) {
				id
				name
				firstName
				secondName
				middleName
				academicTitle
				salutation
				email
				birthDate
				phone
				functions
				address
				createdAt
				updatedAt
				contactHistory {
					title
					type
					date
				}
			}
		}
	`;

	const variables = {
		candidateId: candidateId || undefined,
		name: name || undefined,
		birthDate: birthDate || undefined,
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

	return response.data?.candidate || [];
}
```

#### 2. Create `nodes/Starhunter/actions/candidate/index.ts`

```typescript
import * as search from './search';

export { search };
```

#### 3. Update `nodes/Starhunter/Starhunter.node.ts`

**Add import:**
```typescript
import * as candidate from './actions/candidate';
```

**Add to resource options:**
```typescript
{
	name: 'Candidate',
	value: 'candidate',
},
```

**Add operation selector for candidate:**
```typescript
{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['candidate'],
		},
	},
	options: [
		{
			name: 'Search',
			value: 'search',
			action: 'Search candidates',
			description: 'Search for candidates by ID, name, or birth date',
		},
	],
	default: 'search',
},
```

**Spread description fields:**
```typescript
...candidate.search.description,
```

**Add execution routing:**
```typescript
} else if (resource === 'candidate' && operation === 'search') {
	const result = await candidate.search.execute(this, i, baseUrl);
	for (const item of result) {
		returnData.push({
			json: item,
			pairedItem: { item: i },
		});
	}
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Candidate > Search returns results when searching by name
- [ ] Candidate > Search returns results when searching by candidate ID
- [ ] Candidate > Search returns results when filtering by birth date
- [ ] Contact history is included in results

---

## Phase 3: Employee Resource - Add Search and Get Current User

### Overview
Create new employee resource with search and get current user operations.

### Changes Required:

#### 1. Create `nodes/Starhunter/actions/employee/search.ts`

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
		displayName: 'Employee ID',
		name: 'employeeId',
		type: 'string',
		default: '',
		description: 'Search by specific employee ID',
		displayOptions: {
			show: {
				resource: ['employee'],
				operation: ['search'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Search by employee name (partial match)',
		displayOptions: {
			show: {
				resource: ['employee'],
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
				resource: ['employee'],
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
				resource: ['employee'],
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
	const employeeId = context.getNodeParameter('employeeId', itemIndex) as string;
	const name = context.getNodeParameter('name', itemIndex) as string;
	const limit = context.getNodeParameter('limit', itemIndex) as number;
	const offset = context.getNodeParameter('offset', itemIndex) as number;

	const query = /* GraphQL */ `
		query SearchEmployees($employeeId: Id, $name: String, $limit: Int, $offset: Int) {
			employee(employeeId: $employeeId, name: $name, limit: $limit, offset: $offset) {
				id
				name
				firstName
				secondName
				middleName
				academicTitle
				salutation
				email
				birthDate
				phone
				functions
				address
				createdAt
				updatedAt
				contactHistory {
					title
					type
					date
				}
			}
		}
	`;

	const variables = {
		employeeId: employeeId || undefined,
		name: name || undefined,
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

	return response.data?.employee || [];
}
```

#### 2. Create `nodes/Starhunter/actions/employee/getCurrent.ts`

```typescript
import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeProperties,
} from 'n8n-workflow';

export const description: INodeProperties[] = [];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject | null> {
	const query = /* GraphQL */ `
		query GetCurrentUser {
			user {
				id
				name
				firstName
				secondName
				middleName
				academicTitle
				salutation
				email
				birthDate
				phone
				functions
				address
				createdAt
				updatedAt
				contactHistory {
					title
					type
					date
				}
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

	return response.data?.user || null;
}
```

#### 3. Create `nodes/Starhunter/actions/employee/index.ts`

```typescript
import * as getCurrent from './getCurrent';
import * as search from './search';

export { getCurrent, search };
```

#### 4. Update `nodes/Starhunter/Starhunter.node.ts`

**Add import:**
```typescript
import * as employee from './actions/employee';
```

**Add to resource options:**
```typescript
{
	name: 'Employee',
	value: 'employee',
},
```

**Add operation selector for employee:**
```typescript
{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['employee'],
		},
	},
	options: [
		{
			name: 'Get Current User',
			value: 'getCurrent',
			action: 'Get current authenticated user',
			description: 'Get the employee record for the authenticated user',
		},
		{
			name: 'Search',
			value: 'search',
			action: 'Search employees',
			description: 'Search for employees by ID or name',
		},
	],
	default: 'search',
},
```

**Spread description fields:**
```typescript
...employee.getCurrent.description,
...employee.search.description,
```

**Add execution routing:**
```typescript
} else if (resource === 'employee' && operation === 'getCurrent') {
	const result = await employee.getCurrent.execute(this, i, baseUrl);
	if (result) {
		returnData.push({
			json: result,
			pairedItem: { item: i },
		});
	}
} else if (resource === 'employee' && operation === 'search') {
	const result = await employee.search.execute(this, i, baseUrl);
	for (const item of result) {
		returnData.push({
			json: item,
			pairedItem: { item: i },
		});
	}
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Employee > Get Current User returns the authenticated user's employee record
- [ ] Employee > Search returns results when searching by name
- [ ] Employee > Search returns results when searching by employee ID

---

## Phase 4: Email Resource - Add Log Email

### Overview
Create new email resource with log email mutation.

### Changes Required:

#### 1. Create `nodes/Starhunter/actions/email/log.ts`

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
		displayName: 'From',
		name: 'from',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'sender@example.com',
		description: 'Email address of the sender',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['log'],
			},
		},
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'recipient@example.com',
		description: 'Email address of the recipient',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['log'],
			},
		},
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		required: true,
		description: 'Subject line of the email',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['log'],
			},
		},
	},
	{
		displayName: 'Body',
		name: 'body',
		type: 'string',
		typeOptions: {
			rows: 6,
		},
		default: '',
		required: true,
		description: 'Body content of the email',
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['log'],
			},
		},
	},
];

export async function execute(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
): Promise<IDataObject> {
	const from = context.getNodeParameter('from', itemIndex) as string;
	const to = context.getNodeParameter('to', itemIndex) as string;
	const subject = context.getNodeParameter('subject', itemIndex) as string;
	const body = context.getNodeParameter('body', itemIndex) as string;

	const query = /* GraphQL */ `
		mutation LogEmail($from: String!, $to: String!, $subject: String!, $body: String!) {
			logEmail(from: $from, to: $to, subject: $subject, body: $body)
		}
	`;

	const variables = { from, to, subject, body };

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

	return {
		success: response.data?.logEmail ?? false,
		from,
		to,
		subject,
	};
}
```

#### 2. Create `nodes/Starhunter/actions/email/index.ts`

```typescript
import * as log from './log';

export { log };
```

#### 3. Update `nodes/Starhunter/Starhunter.node.ts`

**Add import:**
```typescript
import * as email from './actions/email';
```

**Add to resource options:**
```typescript
{
	name: 'Email',
	value: 'email',
},
```

**Add operation selector for email:**
```typescript
{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['email'],
		},
	},
	options: [
		{
			name: 'Log Email',
			value: 'log',
			action: 'Log an email activity',
			description: 'Log an email activity in Starhunter',
		},
	],
	default: 'log',
},
```

**Spread description fields:**
```typescript
...email.log.description,
```

**Add execution routing:**
```typescript
} else if (resource === 'email' && operation === 'log') {
	const result = await email.log.execute(this, i, baseUrl);
	returnData.push({
		json: result,
		pairedItem: { item: i },
	});
}
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles without errors: `npm run build`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] Email > Log Email successfully logs email activity
- [ ] Email > Log Email returns success: true on successful log
- [ ] Email > Log Email returns success: false on failure

---

## Testing Strategy

### Build Verification:
1. Run `npm run build` to verify TypeScript compilation
2. Run `npm run lint` to verify code style
3. Check for any missing imports or type errors

### Manual Testing Steps:
1. Load the node in n8n
2. Verify all 6 resources appear in dropdown
3. Verify all operations appear for each resource
4. Test each operation with valid inputs
5. Test error handling with invalid inputs

### Test Cases by Action:

| Action | Test Case |
|--------|-----------|
| Person > Get by ID | Valid ID returns person data |
| Person > Search | Empty name returns all (with limit) |
| Person > Search | Name filter returns matching persons |
| Candidate > Search | Search by name returns candidates with contactHistory |
| Employee > Search | Search by name returns employees |
| Employee > Get Current | Returns authenticated user's data |
| Email > Log | All required fields creates log entry |

---

## References

- Schema research: `docs/research/2025-11-25-starhunter-graphql-schema-analysis.md`
- Existing person action: `nodes/Starhunter/actions/person/getBirthdays.ts`
- Existing task action: `nodes/Starhunter/actions/task/create.ts`
- Main node: `nodes/Starhunter/Starhunter.node.ts`
