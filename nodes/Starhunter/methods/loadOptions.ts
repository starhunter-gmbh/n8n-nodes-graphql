import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

/**
 * The status enums are generated per instance from the attribute options of
 * the connected Starhunter, so their values differ between customers and the
 * generated type name is not stable either. The dropdowns therefore read the
 * values off the instance instead of hardcoding them: introspect the mutation
 * input type, follow the field to its enum and list its values.
 */
async function enumOptions(
	context: ILoadOptionsFunctions,
	inputTypeName: string,
	fieldName: string,
): Promise<INodePropertyOptions[]> {
	const credentials = await context.getCredentials('starhunterApi');
	const query = /* GraphQL */ `
		query EnumValues($name: String!) {
			__type(name: $name) {
				inputFields {
					name
					type {
						enumValues {
							name
							description
						}
						ofType {
							enumValues {
								name
								description
							}
						}
					}
				}
			}
		}
	`;

	const response = await context.helpers.httpRequestWithAuthentication.call(
		context,
		'starhunterApi',
		{
			method: 'POST',
			url: `${credentials.baseUrl}/Api/graphql`,
			body: { query, variables: { name: inputTypeName } },
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			json: true,
		},
	);

	type EnumValue = { name: string; description?: string | null };
	type InputField = {
		name: string;
		type?: { enumValues?: EnumValue[] | null; ofType?: { enumValues?: EnumValue[] | null } | null };
	};

	const fields = (response?.data?.__type?.inputFields ?? []) as InputField[];
	const field = fields.find((entry) => entry.name === fieldName);
	// Non-null wrapped fields carry the enum one level down, in ofType.
	const values = field?.type?.enumValues ?? field?.type?.ofType?.enumValues ?? [];

	return values.map((value) => ({
		name: value.description || value.name,
		value: value.name,
	}));
}

export async function getProjectStatuses(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return await enumOptions(this, 'ProjectUpdateInput', 'status');
}

export async function getCandidateStatuses(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return await enumOptions(this, 'CandidateUpdateInput', 'status');
}

export async function getPresentationStatuses(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return await enumOptions(this, 'PresentationSetStatusInput', 'status');
}
