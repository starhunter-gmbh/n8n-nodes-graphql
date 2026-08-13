import type { IDisplayOptions } from 'n8n-workflow';

/** Builds the `displayOptions` block that binds a property to one operation. */
export function showFor(resource: string, operation: string): IDisplayOptions {
	return {
		show: {
			resource: [resource],
			operation: [operation],
		},
	};
}
