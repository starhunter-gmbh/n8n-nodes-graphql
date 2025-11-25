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
				default: 50,
				description: 'Max number of results to return',
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
