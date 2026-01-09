# @starhunter/n8n-nodes-graphql

This is an n8n community node that integrates with [Starhunter](https://starhunter.com) in your n8n workflows.

Starhunter is a customer relationship management (CRM) system designed for recruiting and talent management. This node allows you to automate interactions with persons, candidates, employees, emails, project candidates, and tasks in Starhunter.

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

- **Get Birthdays**: Retrieve persons whose birthday falls on a specific date (today or a custom date in MM-DD format)
- **Get by ID**: Retrieve a single person by their ID
- **Search**: Search for persons by name (partial match supported)

### Candidate

- **Search**: Search for candidates by ID, name, or birth date

### Employee

- **Get Current**: Get the employee record for the currently authenticated user
- **Search**: Search for employees by ID or name

### Email

- **Log**: Log an email activity in Starhunter (records sender, recipient, subject, and body)

### Project Candidate

- **Get by Status Change Date**: Retrieve project candidates whose status changed a specified number of days ago

### Task

- **Create**: Create a new task with optional deadline, assignee, and target entity

## Starhunter Trigger Node

The Starhunter Trigger node receives real-time events from your Starhunter system via webhooks.

### Supported Event Types

- **Application Events**: Triggered when a candidate applies to a project
- **Status Change Events**: Triggered when a candidate's status changes
- **Document Upload Events**: Triggered when documents are uploaded

### Setup Instructions

1. **Add Trigger to Workflow**
   - Search for "Starhunter Trigger" in the trigger nodes list
   - Add it to your workflow
   - Select which event types to listen for

2. **Configure Credentials**
   - Use your existing Starhunter API credentials
   - Add the webhook secret provided by your Starhunter administrator
   - The webhook secret is used for HMAC signature validation

3. **Copy Webhook URL**
   - The trigger node displays a unique webhook URL
   - Copy this URL

4. **Configure in Starhunter**
   - Contact your Starhunter administrator
   - Provide the webhook URL
   - Ensure HMAC signing is enabled with your webhook secret

### Event Payload Structure

#### Application Event
```json
{
  "eventType": "application",
  "timestamp": "2025-12-18T14:30:00Z",
  "candidate": {
    "id": "12345",
    "name": "Doe",
    "firstName": "John",
    "email": "john.doe@example.com",
    "phone": "+49123456789",
    "birthDate": "1990-05-15"
  },
  "project": {
    "id": "67890",
    "name": "Software Developer Position"
  },
  "applicationDate": "2025-12-18T14:30:00Z"
}
```

#### Status Change Event
```json
{
  "eventType": "statusChange",
  "timestamp": "2025-12-18T15:00:00Z",
  "candidate": {
    "id": "12345",
    "name": "Doe",
    "firstName": "John"
  },
  "project": {
    "id": "67890",
    "name": "Software Developer Position"
  },
  "oldStatus": "applied",
  "newStatus": "interview_scheduled",
  "changedBy": "hiring.manager@company.com"
}
```

#### Document Upload Event
```json
{
  "eventType": "documentUpload",
  "timestamp": "2025-12-18T15:30:00Z",
  "candidate": {
    "id": "12345",
    "name": "Doe",
    "firstName": "John"
  },
  "project": {
    "id": "67890",
    "name": "Software Developer Position"
  },
  "documentType": "resume",
  "fileName": "John_Doe_Resume.pdf"
}
```

File attachments are available in the `binary` property of the workflow data.

### Security: HMAC Signature Validation

The trigger validates webhook authenticity using HMAC-SHA256 signatures:

1. Starhunter signs the webhook payload with your shared secret
2. The signature is sent in the `X-Starhunter-Signature` header
3. The trigger validates the signature before processing
4. Invalid signatures are rejected with an error

**For Starhunter Administrators**: When configuring webhooks, enable HMAC signing and use the same secret that n8n users configure in their credentials.

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

### Example: New application notification (Webhook Trigger)

Sends an email notification when a candidate applies:

1. **Starhunter Trigger** - Filter for "Application Events"
2. **Set** - Format candidate details
3. **Gmail** - Send email to hiring manager

### Example: Status change automation (Webhook Trigger)

Updates CRM when candidate status changes:

1. **Starhunter Trigger** - Filter for "Status Change Events"
2. **Switch** - Branch by new status
3. **HubSpot** / **Salesforce** - Update contact

### Example: Document processing (Webhook Trigger)

Processes uploaded resumes with AI:

1. **Starhunter Trigger** - Filter for "Document Upload Events"
2. **Extract from File** - Extract resume text
3. **OpenAI** - Analyze qualifications
4. **Starhunter** (action node) - Update candidate notes

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
