import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
} from 'n8n-workflow';

/**
 * Sends a GraphQL request to the Starhunter API and returns the `data` payload.
 *
 * Used by the operations added on top of the initial 12 operations; those keep
 * their own inlined request handling so their request and response shape stays
 * byte-for-byte identical.
 */
export async function starhunterGraphqlRequest(
	context: IExecuteFunctions,
	baseUrl: string,
	query: string,
	variables: IDataObject,
): Promise<IDataObject> {
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

	return (response.data ?? {}) as IDataObject;
}

/**
 * Removes keys with `undefined`, `null` or empty-string values so optional node
 * parameters are not sent as explicit nulls to the entity-first mutations. The
 * mutations distinguish "key absent" from "key present with null".
 */
export function compactInput(input: IDataObject): IDataObject {
	const result: IDataObject = {};

	for (const [key, value] of Object.entries(input)) {
		if (value === undefined || value === null || value === '') {
			continue;
		}
		result[key] = value;
	}

	return result;
}

/** Splits a comma or semicolon separated list into trimmed, non-empty entries. */
export function splitList(value: string): string[] {
	return value
		.split(/[,;]/)
		.map((entry) => entry.trim())
		.filter((entry) => entry !== '');
}
