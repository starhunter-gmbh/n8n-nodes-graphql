import {
	NodeOperationError,
	tryToParseDateTime,
	type IDataObject,
	type IExecuteFunctions,
} from 'n8n-workflow';

/**
 * The API's `Date` and `DateTime` scalars only accept `YYYY-MM-DD`, optionally
 * followed by `THH:MM:SS` plus `Z` or a positive offset (`patternDateISO` in
 * Api_Model_GraphQL_Type) — so no milliseconds, no negative offset, and no
 * timezone-less timestamp, which is exactly what a `dateTime` parameter filled
 * from an expression usually carries.
 *
 * Values are therefore parsed in the workflow timezone (values that already
 * carry an offset or a `Z` keep their instant) and re-serialized in the shape
 * the scalar expects: the plain calendar date for `Date`, and a UTC timestamp
 * for `DateTime`, which sidesteps both the millisecond and the negative-offset
 * restriction. The API converts it back into the instance timezone.
 */
function parse(
	context: IExecuteFunctions,
	itemIndex: number,
	key: string,
	value: unknown,
): ReturnType<typeof tryToParseDateTime> {
	try {
		return tryToParseDateTime(value as string, context.getTimezone());
	} catch {
		throw new NodeOperationError(
			context.getNode(),
			`The value "${String(value)}" in "${key}" is not a valid date`,
			{ itemIndex },
		);
	}
}

function isFilled(value: unknown): boolean {
	return value !== undefined && value !== null && value !== '';
}

/**
 * Returns a copy of `input` with the listed keys normalized for the API
 * scalars. Keys that are absent or empty are left untouched, so an optional
 * field stays absent instead of turning into a bogus date.
 */
export function normalizeDates(
	context: IExecuteFunctions,
	itemIndex: number,
	input: IDataObject,
	keys: { date?: string[]; dateTime?: string[] },
): IDataObject {
	const result: IDataObject = { ...input };

	for (const key of keys.date ?? []) {
		if (isFilled(result[key])) {
			result[key] = parse(context, itemIndex, key, result[key]).toISODate();
		}
	}

	for (const key of keys.dateTime ?? []) {
		if (isFilled(result[key])) {
			result[key] = parse(context, itemIndex, key, result[key])
				.toUTC()
				.set({ millisecond: 0 })
				.toISO({ suppressMilliseconds: true });
		}
	}

	return result;
}
