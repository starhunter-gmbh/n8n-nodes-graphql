import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import * as candidate from './candidate';
import * as company from './company';
import * as contactPerson from './contactPerson';
import * as customer from './customer';
import * as email from './email';
import * as employee from './employee';
import * as file from './file';
import * as interview from './interview';
import * as invoice from './invoice';
import * as person from './person';
import * as presentation from './presentation';
import * as project from './project';
import * as task from './task';

type ActionExecute = (
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
) => Promise<IDataObject | IDataObject[] | null>;

/**
 * Operations added on top of the 12 operations shipped up to v0.2.2. Those
 * keep their own dispatch branches in the node so their behavior stays
 * untouched; everything added later is routed through this table.
 */
const operations: Record<string, ActionExecute> = {
	'candidate:create': candidate.create.execute,
	'candidate:parseCv': candidate.parseCv.execute,
	'candidate:setResponsiblePerson': candidate.setResponsiblePerson.execute,
	'candidate:update': candidate.update.execute,
	'company:create': company.create.execute,
	'company:update': company.update.execute,
	'contactPerson:create': contactPerson.create.execute,
	'contactPerson:createContactable': contactPerson.createContactable.execute,
	'customer:create': customer.create.execute,
	'customer:update': customer.update.execute,
	'email:send': email.send.execute,
	'email:sendContact': email.sendContact.execute,
	'employee:create': employee.create.execute,
	'file:get': file.get.execute,
	'file:search': file.search.execute,
	'file:upload': file.upload.execute,
	'interview:create': interview.create.execute,
	'interview:search': interview.search.execute,
	'invoice:create': invoice.create.execute,
	'invoice:search': invoice.search.execute,
	'person:create': person.create.execute,
	'person:deleteContactData': person.deleteContactData.execute,
	'person:update': person.update.execute,
	'presentation:setStatus': presentation.setStatus.execute,
	'project:addContactPerson': project.addContactPerson.execute,
	'project:addTeamMember': project.addTeamMember.execute,
	'project:create': project.create.execute,
	'project:setCompany': project.setCompany.execute,
	'project:setPortalSettings': project.setPortalSettings.execute,
	'project:update': project.update.execute,
	'task:delete': task.remove.execute,
	'task:search': task.search.execute,
	'task:update': task.update.execute,
};

/**
 * Runs the requested operation and normalizes its result into a list of output
 * items. Returns `undefined` when the operation is not handled here.
 */
export async function executeOperation(
	context: IExecuteFunctions,
	itemIndex: number,
	baseUrl: string,
	resource: string,
	operation: string,
): Promise<IDataObject[] | undefined> {
	const handler = operations[`${resource}:${operation}`];
	if (!handler) {
		return undefined;
	}

	const result = await handler(context, itemIndex, baseUrl);
	if (result === null || result === undefined) {
		return [];
	}

	return Array.isArray(result) ? result : [result];
}

/** Node properties of every operation routed through this table. */
export const operationDescriptions = [
	...candidate.create.description,
	...candidate.parseCv.description,
	...candidate.setResponsiblePerson.description,
	...candidate.update.description,
	...company.create.description,
	...company.update.description,
	...contactPerson.create.description,
	...contactPerson.createContactable.description,
	...customer.create.description,
	...customer.update.description,
	...email.send.description,
	...email.sendContact.description,
	...employee.create.description,
	...file.get.description,
	...file.search.description,
	...file.upload.description,
	...interview.create.description,
	...interview.search.description,
	...invoice.create.description,
	...invoice.search.description,
	...person.create.description,
	...person.deleteContactData.description,
	...person.update.description,
	...presentation.setStatus.description,
	...project.addContactPerson.description,
	...project.addTeamMember.description,
	...project.create.description,
	...project.setCompany.description,
	...project.setPortalSettings.description,
	...project.update.description,
	...task.remove.description,
	...task.search.description,
	...task.update.description,
];
