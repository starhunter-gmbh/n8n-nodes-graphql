/**
 * Selection sets shared by the operations. Field names are verified against
 * the GraphQL types in starhunter/app (application/modules/*\/models/GraphQL/Type*).
 */

export const PERSON_FIELDS = /* GraphQL */ `
	id
	name
	firstName
	middleName
	secondName
	academicTitle
	salutation
	birthDate
	email
	phone
	address
	functions
	createdAt
	updatedAt
`;

export const CANDIDATE_FIELDS = /* GraphQL */ `
	id
	name
	firstName
	middleName
	secondName
	academicTitle
	salutation
	birthDate
	email
	phone
	address
	status
	availableFrom
	availabilityDate
	currentLocation
	shortProfile
	source
	optin
	optinValidUntilDate
	createdAt
	updatedAt
`;

export const COMPANY_FIELDS = /* GraphQL */ `
	id
	name
	companyName
	email
	phone
	address
	legalStructure
	employeesCount
	posLat
	posLong
	source
	createdAt
	updatedAt
`;

export const CUSTOMER_FIELDS = /* GraphQL */ `
	id
	customerId
	companyId
	name
	companyName
	email
	phone
	address
	createdAt
	updatedAt
`;

export const PROJECT_FIELDS = /* GraphQL */ `
	id
	name
	status
	statusUpdatedAt
	position
	location
	locationPostalCode
	startDate
	endDate
	candidateCount
	company
	jobNumber
	visibility
	showInPortal
	publishingDate
	createdAt
	updatedAt
`;

export const PROJECT_CANDIDATE_FIELDS = /* GraphQL */ `
	id
	status
	changeDate
	rejectionReason
`;

/**
 * `assignee` is intentionally not selected: it resolves to the Employee object
 * type, which would require its own sub-selection. `assigneeId` carries the id.
 */
export const TASK_FIELDS = /* GraphQL */ `
	id
	title
	description
	deadline
	status
	assigneeId
	targetId
	targetType
`;

export const INTERVIEW_FIELDS = /* GraphQL */ `
	id
	date
	notes
	suggestion
	change_motivation
	charges
	consultants {
		id
		name
		role
	}
`;

export const FILE_METADATA_FIELDS = /* GraphQL */ `
	id
	name
	size
	createdAt
	updatedAt
	tags {
		id
		name
	}
`;

export const FILE_UPLOAD_FIELDS = /* GraphQL */ `
	id
	name
	url
`;

export const INVOICE_FIELDS = /* GraphQL */ `
	id
	number
	date
	paymentDate
	netSum
	grossSum
	status
	subject
`;

export const EMPLOYEE_FIELDS = /* GraphQL */ `
	id
	name
	firstName
	secondName
	academicTitle
	salutation
	email
	phone
	createdAt
	updatedAt
`;

export const CV_DATA_FIELDS = /* GraphQL */ `
	firstName
	lastName
	academicTitle
	birthDate
	email
	phone
	address
	zipCode
	city
	country
	career {
		company
		position
		from
		to
	}
	education {
		institute
		description
		from
		to
	}
	language {
		language
		skillLevel
	}
`;
