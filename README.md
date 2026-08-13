# @starhunter/n8n-nodes-graphql

This is an n8n community node that integrates with [Starhunter](https://starhunter.com) in your n8n workflows.

Starhunter is a customer relationship management (CRM) system designed for recruiting and talent management. This node allows you to automate interactions with persons, candidates, companies, customers, contact persons, employees, emails, files, interviews, invoices, presentations, projects, project candidates, and tasks in Starhunter.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Person

- **Create**: Create a new person with optional contact data
- **Delete Contact Data**: Delete an email, phone, URL, postal address or social contact data value of a contactable by its value
- **Get Birthdays**: Retrieve persons whose birthday falls on a specific date (today or a custom date in MM-DD format)
- **Get by ID**: Retrieve a single person by their ID
- **Search**: Search for persons by name (partial match supported)
- **Update**: Update the master data of an existing person

### Candidate

- **Create**: Create a candidate including the linked person
- **Parse CV**: Extract candidate data from a CV file (binary property or base64 string) without storing it
- **Search**: Search for candidates by ID, name, or birth date
- **Set Responsible Person**: Assign an employee as responsible for a candidate
- **Update**: Update curated candidate fields (compensation, ratings and internal fields are not writable)

### Company

- **Create**: Create a company with optional contact data
- **Update**: Update curated company master data (financial fields are not writable)

### Customer

- **Create**: Turn an existing company into a customer
- **Update**: Update the company name behind an existing customer

### Contact Person

- **Create**: Create a person tagged as a contact person
- **Create Contactable**: Create a person without assigning the contact person tag

### Employee

- **Create**: Create an employee including the linked person
- **Get Current**: Get the employee record for the currently authenticated user
- **Search**: Search for employees by ID or name

### Email

- **Log**: Log an email activity in Starhunter (records sender, recipient, subject, and body)
- **Send**: Send an email through a user or system mailbox, optionally filed on a target record
- **Send Contact**: Send an email to the contacts of a record and link the activity to that record

### File

- **Get**: Get the metadata of a single file by ID
- **Search**: Search files by name, extracted content and tags (the API caps the page size at 100)
- **Upload**: Upload a file and optionally link it to a company, customer or contact person

### Interview

- **Create**: Create an interview for a candidate in a project
- **Search**: Search interviews by candidate or project

### Invoice

- **Create**: Create an invoice draft with positions (requires the Finance.Accounting module)
- **Search**: Search invoices by project, company or status

### Presentation

- **Set Status**: Set the presentation status and write a comment into the status history

### Project

- **Add Contact Person**: Link a contact person to a project
- **Add Team Member**: Link an employee to a project with a role
- **Create**: Create a new project
- **Search**: Search for projects by status
- **Set Company**: Link the client company to a project
- **Set Portal Settings**: Control the job portal publication of a project
- **Update**: Update curated project fields (billing and controlling fields are not writable)

### Project Candidate

- **Add to Project**: Add a candidate to a project and create the presentation
- **Get by Status Change Date**: Retrieve project candidates whose status changed a specified number of days ago
- **Update Status**: Update the status of a presentation with an optional comment

### Task

- **Create**: Create a new task with optional deadline, assignee, and target entity
- **Delete**: Delete an existing task
- **Search**: Search tasks by target, assignee or status
- **Update**: Update an existing task, for example to mark it as done

### Notes on statuses and modules

- Status fields (candidate, project, presentation) are backed by customer-specific GraphQL enums. Pass one of the values configured on your instance, not a free text.
- Invoice operations depend on the `Finance.Accounting` module. If the module is not active on the target instance, the API rejects the request with an unknown field error.

## Credentials

To use this node, you need to authenticate with your Starhunter instance using an API access token.

### Prerequisites

1. Access to a Starhunter instance
2. A valid API access token from your Starhunter account settings

### Setting up credentials in n8n

1. In n8n, go to **Credentials** and click **Add Credential**
2. Search for **Starhunter API**
3. Enter the following:
   - **Base URL**: The base URL of your Starhunter instance (e.g., `https://your-company.starhunter.software`).
   - **Access Token**: Your Starhunter API access token
4. Click **Save** to test the connection

For API documentation, refer to your instance's built-in docs at `https://<your-instance>.starhunter.software/Api/docs`.

## Compatibility

- **Minimum n8n version**: 1.0.0
- **n8n Nodes API version**: 1
- **AI Tool compatible**: Yes (can be used as a tool in n8n AI workflows)

Tested with n8n version 1.x.

## Usage

### Example: Birthday notifications

Create a workflow that runs daily to fetch persons with birthdays today and send notification emails or Slack messages to your team.

1. Add a **Schedule Trigger** node set to run daily
2. Add the **Starhunter** node with:
   - Resource: Person
   - Operation: Get Birthdays
   - Use Today: enabled
3. Connect to an **Email** or **Slack** node to send notifications

### Example: Log emails to CRM

Automatically log emails sent through your workflow back to Starhunter for tracking purposes.

1. After sending an email in your workflow, add the **Starhunter** node
2. Configure with:
   - Resource: Email
   - Operation: Log
   - Map the from, to, subject, and body fields from your email node

### Example: Track candidate status changes

Monitor candidates who changed status a specific number of days ago for follow-up actions.

1. Add a **Schedule Trigger** node
2. Add the **Starhunter** node with:
   - Resource: Project Candidate
   - Operation: Get by Status Change Date
   - Status: Your target status (e.g., "Ident")
   - Days Ago: Number of days to look back

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Starhunter](https://starhunter.software)

## Version history

### 0.1.1

- Initial public release
- Added publishConfig for npm public access

### 0.1.0

- Initial release with support for:
  - Person operations (Get Birthdays, Get by ID, Search)
  - Candidate operations (Search)
  - Employee operations (Get Current, Search)
  - Email operations (Log)
  - Project Candidate operations (Get by Status Change Date)
  - Task operations (Create)
