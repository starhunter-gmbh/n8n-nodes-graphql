# Starhunter Birthday Node - GraphQL Implementation Plan

## Overview

Convert the n8n Starhunter Birthdays node from declarative REST-style routing to a programmatic GraphQL implementation. The node will fetch persons with birthdays on a given date from the Starhunter GraphQL API, with centralized configuration for the API token and base URL.

## Current State Analysis

### Existing Implementation Issues

1. **Declarative REST routing** - Incompatible with GraphQL's POST-body-based queries
2. **Hardcoded base URL** - `https://release-current.starhunter.software/Api/graphql` in both node and credentials
3. **Invalid test request** - Points to non-existent REST endpoint `/v1/user`
4. **Placeholder resources** - User/Company resources are example code, not functional

### Key Files to Modify

| File | Current State | Required Change |
|------|---------------|-----------------|
| `credentials/StarhunterBirthdaysApi.credentials.ts` | Bearer token only | Add `baseUrl` field, fix test |
| `nodes/StarhunterBirthdays/StarhunterBirthdays.node.ts` | Declarative routing | Add `execute()` method |
| `nodes/StarhunterBirthdays/resources/` | REST-style examples | Remove entirely |

## Desired End State

After implementation:
- Node has a single "Person" resource with "Get Birthdays" operation
- Users can configure the Starhunter instance URL in credentials
- "Use Today's Date" toggle (default: true) for convenience
- Custom date input (MM-DD format) when toggle is off
- Each person returned as a separate n8n item for downstream processing
- GraphQL errors are properly surfaced as n8n errors

### Verification

```bash
# Build succeeds
npm run build

# Lint passes
npm run lint

# Manual test in n8n
# 1. Add credentials with base URL and token
# 2. Add node, select "Get Birthdays"
# 3. Execute - should return persons with today's birthday
```

## What We're NOT Doing

- Converting User/Company resources to GraphQL (will be removed)
- Adding timezone configuration (using server timezone)
- Implementing pagination (using fixed limit of 100)
- Adding other Starhunter operations (separate nodes will follow)

## Implementation Approach

1. Update credentials first (adds baseUrl, fixes test)
2. Rewrite node with programmatic execute() method
3. Remove unused resource files
4. Test build and lint

---

## Phase 1: Update Credentials

### Overview
Add configurable base URL and fix the credential test to use GraphQL introspection.

### Changes Required

#### 1. Credentials File
**File**: `credentials/StarhunterBirthdaysApi.credentials.ts`

**Replace entire file with:**

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

### Success Criteria

#### Automated Verification
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes

#### Manual Verification
- [ ] Credential form shows "Base URL" and "Access Token" fields
- [ ] "Test Credential" button works with valid token

---

## Phase 2: Rewrite Node with Programmatic Execute

### Overview
Replace declarative routing with a programmatic `execute()` method that performs GraphQL queries.

### Changes Required

#### 1. Main Node File
**File**: `nodes/StarhunterBirthdays/StarhunterBirthdays.node.ts`

**Replace entire file with:**

```typescript
import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IHttpRequestOptions,
	NodeApiError,
} from 'n8n-workflow';

export class StarhunterBirthdays implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Starhunter Birthdays',
		name: 'starhunterBirthdays',
		icon: { light: 'file:starhunterBirthdays.svg', dark: 'file:starhunterBirthdays.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Get persons with birthdays from Starhunter',
		defaults: {
			name: 'Starhunter Birthdays',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'starhunterBirthdaysApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Person',
						value: 'person',
					},
				],
				default: 'person',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['person'],
					},
				},
				options: [
					{
						name: 'Get Birthdays',
						value: 'getBirthdays',
						action: 'Get persons with birthdays on a date',
						description: 'Get all persons with birthdays on a specific date',
					},
				],
				default: 'getBirthdays',
			},
			{
				displayName: "Use Today's Date",
				name: 'useToday',
				type: 'boolean',
				default: true,
				description: "Whether to use today's date for the birthday search",
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('starhunterBirthdaysApi');
		const baseUrl = credentials.baseUrl as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'person' && operation === 'getBirthdays') {
					const useToday = this.getNodeParameter('useToday', i) as boolean;
					const limit = this.getNodeParameter('limit', i) as number;

					let birthDate: string;
					if (useToday) {
						birthDate = getTodayMMDD();
					} else {
						birthDate = this.getNodeParameter('date', i) as string;
					}

					const query = `
						query GetBirthdays($date: BirthDate, $limit: Int) {
							persons(birthDate: $date, limit: $limit) {
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

					const variables = { date: birthDate, limit };

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
							message: response.errors.map((e: { message: string }) => e.message).join(', '),
						});
					}

					// Return each person as a separate item
					const persons = response.data?.persons || [];
					for (const person of persons) {
						returnData.push({
							json: person,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
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

### Success Criteria

#### Automated Verification
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes

#### Manual Verification
- [ ] Node shows "Person" resource and "Get Birthdays" operation
- [ ] "Use Today's Date" toggle works (shows/hides date field)
- [ ] Execution returns persons as separate items
- [ ] GraphQL errors display properly in n8n

---

## Phase 3: Remove Unused Resources

### Overview
Delete the placeholder REST-style resource files that are no longer needed.

### Changes Required

#### 1. Delete Resource Directory
**Action**: Remove entire `nodes/StarhunterBirthdays/resources/` directory

```bash
rm -rf nodes/StarhunterBirthdays/resources/
```

**Files removed**:
- `resources/user/index.ts`
- `resources/user/get.ts`
- `resources/user/create.ts`
- `resources/company/index.ts`
- `resources/company/getAll.ts`

### Success Criteria

#### Automated Verification
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] No TypeScript errors about missing imports

---

## Phase 4: Final Verification

### Overview
Complete build and manual testing to ensure everything works.

### Success Criteria

#### Automated Verification
- [ ] `npm run build` - Clean build with no warnings
- [ ] `npm run lint` - No linting errors
- [ ] `ls dist/` - Contains compiled node and credentials

#### Manual Verification
- [ ] Install node in local n8n instance
- [ ] Create credentials with test Starhunter instance
- [ ] Add Starhunter Birthdays node to workflow
- [ ] Execute with "Use Today's Date" = true
- [ ] Execute with custom date (e.g., "11-25")
- [ ] Verify each person is returned as separate item
- [ ] Test with invalid credentials - error displays correctly
- [ ] Test with invalid date format - error displays correctly

---

## Testing Strategy

### Unit Tests
Not applicable for this initial implementation. Consider adding in future:
- `getTodayMMDD()` function formatting
- Date validation for MM-DD format

### Integration Tests
Manual testing against live Starhunter instance:
- Valid credentials + valid date → returns persons
- Valid credentials + date with no birthdays → returns empty array
- Invalid credentials → authentication error
- Invalid base URL → connection error

### Manual Testing Steps
1. Build the node: `npm run build`
2. Link to local n8n: Follow n8n community node development docs
3. Add Starhunter credentials in n8n
4. Create workflow with Starhunter Birthdays node
5. Test "Use Today's Date" toggle
6. Test custom date input
7. Verify output structure matches GraphQL response

---

## Performance Considerations

- **Limit parameter**: Default 100, max 1000 to prevent large response payloads
- **No pagination**: Single request per execution; implement if needed later
- **GraphQL field selection**: All Person fields included; could optimize if performance issues arise

---

## Migration Notes

- **Breaking change**: Existing credentials will need baseUrl added
- **Breaking change**: User/Company operations removed (were placeholder only)
- **Credential display name**: Changed from "Starhunter Birthdays API" to "Starhunter API" for future node compatibility

---

## References

- Research document: `docs/research-n8n-birthday-node.md`
- n8n Node Development: https://docs.n8n.io/integrations/creating-nodes/
- Starhunter GraphQL API: `https://release-current.starhunter.software/Api/graphql`

---

## Progress Tracking

- [ ] Phase 1: Update Credentials
- [ ] Phase 2: Rewrite Node with Programmatic Execute
- [ ] Phase 3: Remove Unused Resources
- [ ] Phase 4: Final Verification
