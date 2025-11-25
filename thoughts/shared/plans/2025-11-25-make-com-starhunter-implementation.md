# Make.com Starhunter Custom App Implementation Plan

## Overview

Create a Make.com custom app that replicates the functionality of the existing n8n Starhunter node. The app will integrate with Starhunter CRM via GraphQL API with Bearer token authentication, supporting 6 resources (Person, Candidate, Employee, Email, Project Candidate, Task) with 10 operations total.

## Current State Analysis

### Existing n8n Implementation
- **Location**: `n8n/nodes/Starhunter/`
- **Authentication**: Bearer token + configurable base URL
- **API Endpoint**: `{baseUrl}/Api/graphql`
- **Architecture**: Modular action files per resource

### Key Discoveries:
- GraphQL endpoint: `{baseUrl}/Api/graphql` (`n8n/credentials/StarhunterApi.credentials.ts:50-51`)
- Connection test query: `{ __typename }` (`n8n/credentials/StarhunterApi.credentials.ts:53`)
- Person fields: `id, name, firstName, secondName, middleName, academicTitle, salutation, email, birthDate, phone, functions, address, createdAt, updatedAt`
- Candidate/Employee add: `contactHistory { title, type, date }`
- Date formats: `MM-DD` for birthDate, `YYYY-MM-DD` for changeDate/deadline

### Make.com Directory
- **Location**: `make.com/` (currently empty except README.md)

## Desired End State

A fully functional Make.com custom app with:
1. **Connection**: Bearer token + custom base URL authentication
2. **10 Modules**: All operations from n8n implementation
3. **Local Development**: VS Code compatible structure with `makecomapp.json`
4. **Git Ready**: Proper `.gitignore` excluding secrets

### Verification:
- App can be deployed via Make.com VS Code extension
- All modules execute successfully against Starhunter API
- Connection test validates credentials

## What We're NOT Doing

- Triggers/webhooks (Starhunter API doesn't support subscriptions)
- RPCs for dynamic dropdowns (can be added later)
- Publishing to Make.com marketplace (private app only)
- Universal module for arbitrary GraphQL (not needed)

## Implementation Approach

Create a local Make.com app structure following the official developer documentation, with:
1. Base configuration for shared authentication headers
2. Connection for credentials management
3. Individual modules for each operation
4. JSON-based configuration files (`.iml.json`)

---

## Phase 1: Project Structure and Base Configuration

### Overview
Set up the Make.com custom app directory structure and base configuration files.

### Changes Required:

#### 1. Create Directory Structure
```
make.com/
├── makecomapp.json              # App metadata
├── .gitignore                   # Exclude secrets
├── base/
│   └── base.iml.json           # Shared config
├── connections/
│   └── starhunter/
│       ├── connection.communication.iml.json
│       └── connection.parameters.iml.json
└── modules/
    ├── person/
    │   ├── get-by-id/
    │   ├── search/
    │   └── get-birthdays/
    ├── candidate/
    │   └── search/
    ├── employee/
    │   ├── get-current/
    │   └── search/
    ├── email/
    │   └── log/
    ├── project-candidate/
    │   └── get-by-status-change-date/
    └── task/
        └── create/
```

#### 2. App Metadata
**File**: `make.com/makecomapp.json`
```json
{
    "name": "starhunter",
    "label": "Starhunter CRM",
    "description": "Interact with Starhunter CRM via GraphQL API",
    "version": "1.0.0",
    "theme": "#2563eb",
    "language": "en",
    "countries": [],
    "audiences": ["private"]
}
```

#### 3. Git Ignore
**File**: `make.com/.gitignore`
```
.secrets
*.log
```

#### 4. Base Configuration
**File**: `make.com/base/base.iml.json`
```json
{
    "baseUrl": "{{connection.baseUrl}}/Api/graphql",
    "headers": {
        "Authorization": "Bearer {{connection.apiToken}}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    "response": {
        "error": {
            "message": "{{if(body.errors, body.errors[1].message, 'Request failed')}}",
            "type": "{{if(statusCode == 401, 'ConnectionError', 'RuntimeError')}}"
        },
        "valid": {
            "condition": "{{statusCode >= 200 && statusCode < 300 && !body.errors}}"
        }
    },
    "log": {
        "sanitize": ["request.headers.authorization"]
    }
}
```

### Success Criteria:

#### Automated Verification:
- [x] Directory structure exists: `ls -la make.com/`
- [x] All JSON files are valid: `find make.com -name "*.json" -exec python3 -m json.tool {} \;`

#### Manual Verification:
- [x] Files follow Make.com naming conventions

---

## Phase 2: Connection Configuration

### Overview
Configure the connection for Bearer token authentication with custom base URL.

### Changes Required:

#### 1. Connection Parameters
**File**: `make.com/connections/starhunter/connection.parameters.iml.json`
```json
[
    {
        "name": "baseUrl",
        "type": "text",
        "label": "Base URL",
        "required": true,
        "default": "https://release-current.starhunter.software",
        "help": "The base URL of your Starhunter instance (without /Api/graphql)"
    },
    {
        "name": "apiToken",
        "type": "password",
        "label": "Access Token",
        "required": true,
        "help": "Your Starhunter API access token"
    }
]
```

#### 2. Connection Test (Communication)
**File**: `make.com/connections/starhunter/connection.communication.iml.json`
```json
{
    "url": "{{parameters.baseUrl}}/Api/graphql",
    "method": "POST",
    "headers": {
        "Authorization": "Bearer {{parameters.apiToken}}",
        "Content-Type": "application/json"
    },
    "body": {
        "query": "{ __typename }"
    },
    "response": {
        "data": {
            "apiToken": "{{parameters.apiToken}}",
            "baseUrl": "{{parameters.baseUrl}}"
        },
        "metadata": {
            "type": "text",
            "value": "{{parameters.baseUrl}}"
        }
    },
    "log": {
        "sanitize": ["request.headers.authorization", "response.data.apiToken"]
    }
}
```

### Success Criteria:

#### Automated Verification:
- [x] Connection files exist and are valid JSON

#### Manual Verification:
- [ ] Connection can be created in Make.com
- [ ] Test request succeeds with valid credentials
- [ ] Test fails gracefully with invalid credentials

---

## Phase 3: Person Modules

### Overview
Create the three Person operations: Get by ID, Search, and Get Birthdays.

### Changes Required:

#### 1. Person - Get by ID

**File**: `make.com/modules/person/get-by-id/get-by-id.parameters.iml.json`
```json
[
    {
        "name": "personId",
        "type": "text",
        "label": "Person ID",
        "required": true,
        "help": "The ID of the person to retrieve"
    }
]
```

**File**: `make.com/modules/person/get-by-id/get-by-id.communication.iml.json`
```json
{
    "url": "/",
    "method": "POST",
    "body": {
        "query": "query GetPerson($id: Id!) { person(id: $id) { id name firstName secondName middleName academicTitle salutation email birthDate phone functions address createdAt updatedAt } }",
        "variables": {
            "id": "{{parameters.personId}}"
        }
    },
    "response": {
        "output": "{{body.data.person}}"
    }
}
```

**File**: `make.com/modules/person/get-by-id/get-by-id.interface.iml.json`
```json
[
    {"name": "id", "type": "text", "label": "ID"},
    {"name": "name", "type": "text", "label": "Full Name"},
    {"name": "firstName", "type": "text", "label": "First Name"},
    {"name": "secondName", "type": "text", "label": "Last Name"},
    {"name": "middleName", "type": "text", "label": "Middle Name"},
    {"name": "academicTitle", "type": "text", "label": "Academic Title"},
    {"name": "salutation", "type": "text", "label": "Salutation"},
    {"name": "email", "type": "email", "label": "Email"},
    {"name": "birthDate", "type": "text", "label": "Birth Date"},
    {"name": "phone", "type": "text", "label": "Phone"},
    {"name": "functions", "type": "text", "label": "Functions"},
    {"name": "address", "type": "text", "label": "Address"},
    {"name": "createdAt", "type": "date", "label": "Created At"},
    {"name": "updatedAt", "type": "date", "label": "Updated At"}
]
```

#### 2. Person - Search

**File**: `make.com/modules/person/search/search.parameters.iml.json`
```json
[
    {
        "name": "name",
        "type": "text",
        "label": "Name",
        "required": false,
        "help": "Search by person name (partial match)"
    },
    {
        "name": "limit",
        "type": "uinteger",
        "label": "Limit",
        "required": false,
        "default": 50,
        "help": "Max number of results to return (1-1000)"
    },
    {
        "name": "offset",
        "type": "uinteger",
        "label": "Offset",
        "required": false,
        "default": 0,
        "help": "Number of results to skip for pagination"
    }
]
```

**File**: `make.com/modules/person/search/search.communication.iml.json`
```json
{
    "url": "/",
    "method": "POST",
    "body": {
        "query": "query SearchPersons($name: String, $limit: Int, $offset: Int) { persons(name: $name, limit: $limit, offset: $offset) { id name firstName secondName middleName academicTitle salutation email birthDate phone functions address createdAt updatedAt } }",
        "variables": {
            "name": "{{if(parameters.name, parameters.name, undefined)}}",
            "limit": "{{parameters.limit}}",
            "offset": "{{parameters.offset}}"
        }
    },
    "response": {
        "output": "{{body.data.persons}}"
    }
}
```

**File**: `make.com/modules/person/search/search.interface.iml.json`
(Same as get-by-id interface)

#### 3. Person - Get Birthdays

**File**: `make.com/modules/person/get-birthdays/get-birthdays.parameters.iml.json`
```json
[
    {
        "name": "useToday",
        "type": "boolean",
        "label": "Use Today's Date",
        "required": false,
        "default": true,
        "help": "Whether to use today's date for the birthday search"
    },
    {
        "name": "date",
        "type": "text",
        "label": "Date (MM-DD)",
        "required": false,
        "help": "The date to search for birthdays (format: MM-DD, e.g., 11-25). Only used if 'Use Today's Date' is false."
    },
    {
        "name": "limit",
        "type": "uinteger",
        "label": "Limit",
        "required": false,
        "default": 50,
        "help": "Max number of results to return"
    }
]
```

**File**: `make.com/modules/person/get-birthdays/get-birthdays.communication.iml.json`
```json
{
    "url": "/",
    "method": "POST",
    "body": {
        "query": "query GetBirthdays($date: BirthDate, $limit: Int) { persons(birthDate: $date, limit: $limit) { id name firstName secondName middleName academicTitle salutation email birthDate phone functions address createdAt updatedAt } }",
        "variables": {
            "date": "{{if(parameters.useToday, formatDate(now, 'MM-DD'), parameters.date)}}",
            "limit": "{{parameters.limit}}"
        }
    },
    "response": {
        "output": "{{body.data.persons}}"
    }
}
```

### Success Criteria:

#### Automated Verification:
- [x] All JSON files valid
- [x] Person modules directory structure complete

#### Manual Verification:
- [ ] Get by ID returns correct person data
- [ ] Search returns matching persons
- [ ] Get Birthdays returns persons with matching birthday

---

## Phase 4: Candidate and Employee Modules

### Overview
Create Candidate Search, Employee Get Current, and Employee Search modules.

### Changes Required:

#### 1. Candidate - Search

**File**: `make.com/modules/candidate/search/search.parameters.iml.json`
```json
[
    {
        "name": "candidateId",
        "type": "text",
        "label": "Candidate ID",
        "required": false,
        "help": "Search by specific candidate ID"
    },
    {
        "name": "name",
        "type": "text",
        "label": "Name",
        "required": false,
        "help": "Search by candidate name (partial match)"
    },
    {
        "name": "birthDate",
        "type": "text",
        "label": "Birth Date (MM-DD)",
        "required": false,
        "help": "Filter by birth date (format: MM-DD)"
    },
    {
        "name": "limit",
        "type": "uinteger",
        "label": "Limit",
        "default": 50
    },
    {
        "name": "offset",
        "type": "uinteger",
        "label": "Offset",
        "default": 0
    }
]
```

**File**: `make.com/modules/candidate/search/search.communication.iml.json`
```json
{
    "url": "/",
    "method": "POST",
    "body": {
        "query": "query SearchCandidates($candidateId: Id, $birthDate: BirthDate, $name: String, $limit: Int, $offset: Int) { candidate(candidateId: $candidateId, birthDate: $birthDate, name: $name, limit: $limit, offset: $offset) { id name firstName secondName middleName academicTitle salutation email birthDate phone functions address createdAt updatedAt contactHistory { title type date } } }",
        "variables": {
            "candidateId": "{{if(parameters.candidateId, parameters.candidateId, undefined)}}",
            "name": "{{if(parameters.name, parameters.name, undefined)}}",
            "birthDate": "{{if(parameters.birthDate, parameters.birthDate, undefined)}}",
            "limit": "{{parameters.limit}}",
            "offset": "{{parameters.offset}}"
        }
    },
    "response": {
        "output": "{{body.data.candidate}}"
    }
}
```

**File**: `make.com/modules/candidate/search/search.interface.iml.json`
```json
[
    {"name": "id", "type": "text", "label": "ID"},
    {"name": "name", "type": "text", "label": "Full Name"},
    {"name": "firstName", "type": "text", "label": "First Name"},
    {"name": "secondName", "type": "text", "label": "Last Name"},
    {"name": "middleName", "type": "text", "label": "Middle Name"},
    {"name": "academicTitle", "type": "text", "label": "Academic Title"},
    {"name": "salutation", "type": "text", "label": "Salutation"},
    {"name": "email", "type": "email", "label": "Email"},
    {"name": "birthDate", "type": "text", "label": "Birth Date"},
    {"name": "phone", "type": "text", "label": "Phone"},
    {"name": "functions", "type": "text", "label": "Functions"},
    {"name": "address", "type": "text", "label": "Address"},
    {"name": "createdAt", "type": "date", "label": "Created At"},
    {"name": "updatedAt", "type": "date", "label": "Updated At"},
    {
        "name": "contactHistory",
        "type": "array",
        "label": "Contact History",
        "spec": {
            "type": "collection",
            "spec": [
                {"name": "title", "type": "text", "label": "Title"},
                {"name": "type", "type": "text", "label": "Type"},
                {"name": "date", "type": "date", "label": "Date"}
            ]
        }
    }
]
```

#### 2. Employee - Get Current

**File**: `make.com/modules/employee/get-current/get-current.parameters.iml.json`
```json
[]
```

**File**: `make.com/modules/employee/get-current/get-current.communication.iml.json`
```json
{
    "url": "/",
    "method": "POST",
    "body": {
        "query": "query GetCurrentUser { user { id name firstName secondName middleName academicTitle salutation email birthDate phone functions address createdAt updatedAt contactHistory { title type date } } }"
    },
    "response": {
        "output": "{{body.data.user}}"
    }
}
```

**File**: `make.com/modules/employee/get-current/get-current.interface.iml.json`
(Same as candidate search interface with contactHistory)

#### 3. Employee - Search

**File**: `make.com/modules/employee/search/search.parameters.iml.json`
```json
[
    {
        "name": "employeeId",
        "type": "text",
        "label": "Employee ID",
        "required": false,
        "help": "Search by specific employee ID"
    },
    {
        "name": "name",
        "type": "text",
        "label": "Name",
        "required": false,
        "help": "Search by employee name (partial match)"
    },
    {
        "name": "limit",
        "type": "uinteger",
        "label": "Limit",
        "default": 50
    },
    {
        "name": "offset",
        "type": "uinteger",
        "label": "Offset",
        "default": 0
    }
]
```

**File**: `make.com/modules/employee/search/search.communication.iml.json`
```json
{
    "url": "/",
    "method": "POST",
    "body": {
        "query": "query SearchEmployees($employeeId: Id, $name: String, $limit: Int, $offset: Int) { employee(employeeId: $employeeId, name: $name, limit: $limit, offset: $offset) { id name firstName secondName middleName academicTitle salutation email birthDate phone functions address createdAt updatedAt contactHistory { title type date } } }",
        "variables": {
            "employeeId": "{{if(parameters.employeeId, parameters.employeeId, undefined)}}",
            "name": "{{if(parameters.name, parameters.name, undefined)}}",
            "limit": "{{parameters.limit}}",
            "offset": "{{parameters.offset}}"
        }
    },
    "response": {
        "output": "{{body.data.employee}}"
    }
}
```

### Success Criteria:

#### Automated Verification:
- [x] All JSON files valid
- [x] Module directory structure complete

#### Manual Verification:
- [ ] Candidate search returns matching candidates with contact history
- [ ] Get Current returns authenticated user's employee record
- [ ] Employee search returns matching employees

---

## Phase 5: Email, Project Candidate, and Task Modules

### Overview
Create Email Log, Project Candidate Get by Status Change Date, and Task Create modules.

### Changes Required:

#### 1. Email - Log

**File**: `make.com/modules/email/log/log.parameters.iml.json`
```json
[
    {
        "name": "from",
        "type": "email",
        "label": "From",
        "required": true,
        "help": "Email address of the sender"
    },
    {
        "name": "to",
        "type": "email",
        "label": "To",
        "required": true,
        "help": "Email address of the recipient"
    },
    {
        "name": "subject",
        "type": "text",
        "label": "Subject",
        "required": true,
        "help": "Subject line of the email"
    },
    {
        "name": "body",
        "type": "text",
        "label": "Body",
        "required": true,
        "multiline": true,
        "help": "Body content of the email"
    }
]
```

**File**: `make.com/modules/email/log/log.communication.iml.json`
```json
{
    "url": "/",
    "method": "POST",
    "body": {
        "query": "mutation LogEmail($from: String!, $to: String!, $subject: String!, $body: String!) { logEmail(from: $from, to: $to, subject: $subject, body: $body) }",
        "variables": {
            "from": "{{parameters.from}}",
            "to": "{{parameters.to}}",
            "subject": "{{parameters.subject}}",
            "body": "{{parameters.body}}"
        }
    },
    "response": {
        "output": {
            "success": "{{body.data.logEmail}}",
            "from": "{{parameters.from}}",
            "to": "{{parameters.to}}",
            "subject": "{{parameters.subject}}"
        }
    }
}
```

**File**: `make.com/modules/email/log/log.interface.iml.json`
```json
[
    {"name": "success", "type": "boolean", "label": "Success"},
    {"name": "from", "type": "email", "label": "From"},
    {"name": "to", "type": "email", "label": "To"},
    {"name": "subject", "type": "text", "label": "Subject"}
]
```

#### 2. Project Candidate - Get by Status Change Date

**File**: `make.com/modules/project-candidate/get-by-status-change-date/get-by-status-change-date.parameters.iml.json`
```json
[
    {
        "name": "status",
        "type": "text",
        "label": "Status",
        "required": true,
        "help": "The candidate status to filter by (e.g., Ident)"
    },
    {
        "name": "daysAgo",
        "type": "uinteger",
        "label": "Days Ago",
        "required": true,
        "default": 7,
        "help": "Number of days ago the status change should have occurred"
    }
]
```

**File**: `make.com/modules/project-candidate/get-by-status-change-date/get-by-status-change-date.communication.iml.json`
```json
{
    "url": "/",
    "method": "POST",
    "body": {
        "query": "query getStatuses($status: String) { projectCandidates(status: $status) { status rejectionReason changeDate person { name email } } }",
        "variables": {
            "status": "{{parameters.status}}"
        }
    },
    "response": {
        "iterate": "{{body.data.projectCandidates}}",
        "condition": "{{formatDate(item.changeDate, 'YYYY-MM-DD') == formatDate(addDays(now, -parameters.daysAgo), 'YYYY-MM-DD')}}",
        "output": {
            "status": "{{item.status}}",
            "rejectionReason": "{{item.rejectionReason}}",
            "changeDate": "{{item.changeDate}}",
            "personName": "{{item.person.name}}",
            "personEmail": "{{item.person.email}}"
        }
    }
}
```

**File**: `make.com/modules/project-candidate/get-by-status-change-date/get-by-status-change-date.interface.iml.json`
```json
[
    {"name": "status", "type": "text", "label": "Status"},
    {"name": "rejectionReason", "type": "text", "label": "Rejection Reason"},
    {"name": "changeDate", "type": "date", "label": "Change Date"},
    {"name": "personName", "type": "text", "label": "Person Name"},
    {"name": "personEmail", "type": "email", "label": "Person Email"}
]
```

#### 3. Task - Create

**File**: `make.com/modules/task/create/create.parameters.iml.json`
```json
[
    {
        "name": "title",
        "type": "text",
        "label": "Title",
        "required": true,
        "help": "The title of the task"
    },
    {
        "name": "description",
        "type": "text",
        "label": "Description",
        "required": false,
        "multiline": true,
        "help": "The description of the task"
    },
    {
        "name": "deadline",
        "type": "date",
        "label": "Deadline",
        "required": false,
        "help": "The deadline for the task"
    },
    {
        "name": "assignee",
        "type": "text",
        "label": "Assignee ID",
        "required": false,
        "help": "The ID of the person to assign the task to"
    },
    {
        "name": "target",
        "type": "text",
        "label": "Target ID",
        "required": false,
        "help": "The ID of the target entity for the task"
    }
]
```

**File**: `make.com/modules/task/create/create.communication.iml.json`
```json
{
    "url": "/",
    "method": "POST",
    "body": {
        "query": "mutation CreateTask($title: String!, $description: String, $deadline: Date, $assignee: Id, $target: Id) { createTask(title: $title, description: $description, deadline: $deadline, assignee: $assignee, target: $target) { id title description deadline assignee } }",
        "variables": {
            "title": "{{parameters.title}}",
            "description": "{{if(parameters.description, parameters.description, undefined)}}",
            "deadline": "{{if(parameters.deadline, formatDate(parameters.deadline, 'YYYY-MM-DD'), undefined)}}",
            "assignee": "{{if(parameters.assignee, parameters.assignee, undefined)}}",
            "target": "{{if(parameters.target, parameters.target, undefined)}}"
        }
    },
    "response": {
        "output": "{{body.data.createTask}}"
    }
}
```

**File**: `make.com/modules/task/create/create.interface.iml.json`
```json
[
    {"name": "id", "type": "text", "label": "Task ID"},
    {"name": "title", "type": "text", "label": "Title"},
    {"name": "description", "type": "text", "label": "Description"},
    {"name": "deadline", "type": "date", "label": "Deadline"},
    {"name": "assignee", "type": "text", "label": "Assignee ID"}
]
```

### Success Criteria:

#### Automated Verification:
- [x] All JSON files valid
- [x] Complete directory structure

#### Manual Verification:
- [ ] Email log creates activity in Starhunter
- [ ] Project Candidate filter returns correct results
- [ ] Task create succeeds and returns task ID

---

## Phase 6: Module Metadata and App Icon

### Overview
Add module metadata for Make.com UI and app icon.

### Changes Required:

#### 1. Module Metadata Files

Each module needs a metadata file defining its type and labels.

**Example**: `make.com/modules/person/get-by-id/get-by-id.module.json`
```json
{
    "name": "getPersonById",
    "label": "Get a Person by ID",
    "description": "Retrieve a single person by their ID",
    "moduleType": "action",
    "connection": "starhunter"
}
```

Create similar metadata for all 10 modules with appropriate labels:

| Module | Label |
|--------|-------|
| person/get-by-id | Get a Person by ID |
| person/search | Search Persons |
| person/get-birthdays | Get Birthdays |
| candidate/search | Search Candidates |
| employee/get-current | Get Current User |
| employee/search | Search Employees |
| email/log | Log an Email |
| project-candidate/get-by-status-change-date | Get Project Candidates by Status Change |
| task/create | Create a Task |

#### 2. App Icon
**File**: `make.com/icon.png`
- Copy the Starhunter icon from n8n (`n8n/nodes/Starhunter/starhunter.svg`)
- Convert to PNG (Make.com prefers PNG for custom apps)
- Recommended size: 512x512 or 256x256

### Success Criteria:

#### Automated Verification:
- [x] All module metadata files exist and are valid JSON
- [x] Icon file exists

#### Manual Verification:
- [ ] All modules appear in Make.com with correct labels
- [ ] App icon displays correctly in Make.com

---

## Phase 7: Documentation and Deployment

### Overview
Update README and deploy to Make.com.

### Changes Required:

#### 1. Update README
**File**: `make.com/README.md`

```markdown
# Starhunter CRM - Make.com Custom App

A Make.com custom app for integrating with Starhunter CRM via GraphQL API.

## Features

### Resources
- **Person**: Get by ID, Search, Get Birthdays
- **Candidate**: Search (with contact history)
- **Employee**: Get Current User, Search
- **Email**: Log email activity
- **Project Candidate**: Get by Status Change Date
- **Task**: Create tasks

## Installation

### Prerequisites
- Make.com account
- Starhunter API access token
- VS Code with Make Apps Editor extension (optional)

### Using VS Code Extension
1. Install "Make Apps Editor" from VS Code Marketplace
2. Configure your Make.com API key
3. Right-click `makecomapp.json` → Deploy to Make

### Manual Import
1. Navigate to Make.com → Apps → Create a New App
2. Import each component manually via the web interface

## Configuration

### Connection Settings
- **Base URL**: Your Starhunter instance URL (e.g., `https://release-current.starhunter.software`)
- **Access Token**: Your Starhunter API Bearer token

## Module Reference

### Person - Get by ID
Retrieve a single person by their unique identifier.

### Person - Search
Search for persons by name with pagination support.

### Person - Get Birthdays
Find persons whose birthday falls on a specific date. Supports "today" shortcut.

### Candidate - Search
Search candidates by ID, name, or birth date. Includes contact history.

### Employee - Get Current User
Get the employee record for the currently authenticated user.

### Employee - Search
Search employees by ID or name.

### Email - Log
Log an email activity in Starhunter CRM.

### Project Candidate - Get by Status Change Date
Filter project candidates by status and find those whose status changed X days ago.

### Task - Create
Create a new task with optional deadline, assignee, and target.

## Development

### Local Development
1. Clone this repository
2. Install Make.com VS Code extension
3. Configure API environment
4. Make changes to `.iml.json` files
5. Deploy to Make.com

### File Structure
- `makecomapp.json` - App metadata
- `base/` - Shared configuration
- `connections/` - Authentication
- `modules/` - Individual modules

## Related
- [n8n Starhunter Node](../n8n/) - n8n implementation
- [Starhunter GraphQL API](https://docs.starhunter.software/api)
```

### Success Criteria:

#### Automated Verification:
- [x] README.md exists and is properly formatted

#### Manual Verification:
- [ ] App successfully deploys via VS Code extension
- [ ] All modules work in Make.com scenarios
- [ ] Documentation is accurate and complete

---

## Testing Strategy

### Unit Tests
- Validate all JSON files parse correctly
- Verify required fields are present in each module

### Integration Tests
- Test each module against live Starhunter API
- Verify error handling for invalid inputs
- Test pagination for search operations

### Manual Testing Steps
1. Create new connection with valid credentials
2. Test connection with invalid credentials (should fail gracefully)
3. Execute Person - Get by ID with known ID
4. Execute Person - Search with name filter
5. Execute Person - Get Birthdays for today
6. Execute Candidate - Search and verify contact history
7. Execute Employee - Get Current User
8. Execute Task - Create and verify in Starhunter UI
9. Execute Email - Log and verify activity created

---

## Performance Considerations

- GraphQL queries fetch only required fields (no over-fetching)
- Pagination supported via limit/offset parameters
- Client-side filtering for Project Candidate status change (API doesn't support date-based filtering)

---

## References

- Research document: `thoughts/shared/research/2025-11-25-starhunter-automation-platforms.md`
- n8n implementation: `n8n/nodes/Starhunter/`
- Make.com Developer Hub: https://developers.make.com
- Starhunter API: https://docs.starhunter.software/api
