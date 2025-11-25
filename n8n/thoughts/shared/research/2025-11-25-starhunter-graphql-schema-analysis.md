---
date: 2025-11-25T14:30:00+01:00
researcher: Claude Code
git_commit: 5b901d014c1bd0bedd70b294c2ab0e8543af86a7
branch: main
repository: starhunter-utils/automation-nodes/n8n
topic: "Starhunter GraphQL Schema Analysis - Implemented vs Missing Actions"
tags: [research, graphql, starhunter, n8n-node, api]
status: complete
last_updated: 2025-11-25
last_updated_by: Claude Code
---

# Research: Starhunter GraphQL Schema Analysis

**Date**: 2025-11-25T14:30:00+01:00
**Researcher**: Claude Code
**Git Commit**: 5b901d014c1bd0bedd70b294c2ab0e8543af86a7
**Branch**: main
**Repository**: starhunter-utils/automation-nodes/n8n

## Research Question

Analyze the Starhunter GraphQL schema to identify all available endpoints and determine which actions are currently implemented in the n8n node vs. which are missing.

## Summary

The Starhunter GraphQL API exposes **8 queries** and **2 mutations**. Currently, the n8n node implements **3 actions** (2 queries, 1 mutation), leaving **6 queries** and **1 mutation** unimplemented.

**API Endpoint**: `https://<instance>/Api/graphql`

**Note from API**: "The Starhunter GraphQL API is still under development. Endpoints may change before final release. Use at your own risk."

## Detailed Findings

### GraphQL Schema Overview

#### Queries (8 total)

| Query | Arguments | Return Type | Description |
|-------|-----------|-------------|-------------|
| `version` | none | `String` | Get API version |
| `persons` | `name: String`, `birthDate: BirthDate`, `limit: Int`, `offset: Int` | `[Person]` | Search persons |
| `person` | `id: Id!` | `Person` | Get single person by ID |
| `projectCandidates` | `projectId: Id`, `status: String`, `limit: Int`, `offset: Int` | `[ProjectCandidate]` | Get project candidates |
| `candidate` | `candidateId: Id`, `birthDate: BirthDate`, `name: String`, `limit: Int`, `offset: Int` | `[Candidate]` | Search candidates |
| `employee` | `employeeId: Id`, `name: String`, `limit: Int`, `offset: Int` | `[Employee]` | Search employees |
| `user` | none | `Employee` | Get current authenticated user |
| `talentorangeFunctions` | none | `[Function]` | Get available job functions |

#### Mutations (2 total)

| Mutation | Arguments | Return Type | Description |
|----------|-----------|-------------|-------------|
| `createTask` | `title: String!`, `description: String`, `deadline: Date`, `assignee: Id`, `target: Id` | `Task` | Create a new task |
| `logEmail` | `from: String!`, `to: String!`, `subject: String!`, `body: String!` | `Boolean` | Log an email activity |

### Return Types

#### Person
```graphql
type Person {
  id: Id!
  name: String
  firstName: String
  middleName: String
  secondName: String
  academicTitle: String
  salutation: String
  birthDate: Date
  functions: String
  email: String
  phone: String
  address: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Candidate (extends Person)
```graphql
type Candidate {
  # All Person fields plus:
  contactHistory: [Activity]
}
```

#### Employee (extends Person)
```graphql
type Employee {
  # All Person fields plus:
  contactHistory: [Activity]
}
```

#### ProjectCandidate
```graphql
type ProjectCandidate {
  id: Id
  status: String
  changeDate: Date
  rejectionReason: String
  person: Person!
}
```

#### Task
```graphql
type Task {
  id: Id
  title: String
  description: String
  deadline: Date
  assignee: Id
}
```

#### Activity
```graphql
type Activity {
  title: String
  type: String
  date: DateTime
}
```

#### Function
```graphql
type Function {
  value: String
  label: String
}
```

### Scalar Types

| Scalar | Description |
|--------|-------------|
| `Id` | Unique identifier |
| `String` | Text value |
| `Int` | Integer number |
| `Boolean` | True/false |
| `Date` | Date value (YYYY-MM-DD) |
| `DateTime` | Date and time |
| `BirthDate` | Birth date format (MM-DD) |

## Implementation Status

### Currently Implemented Actions (3)

| Resource | Operation | File | GraphQL Endpoint Used |
|----------|-----------|------|----------------------|
| Person | Get Birthdays | `actions/person/getBirthdays.ts` | `persons(birthDate: $date)` |
| Project Candidate | Get By Status Change Date | `actions/projectCandidate/getByStatusChangeDate.ts` | `projectCandidates(status: $status)` + client-side date filtering |
| Task | Create | `actions/task/create.ts` | `createTask` mutation |

### Missing Actions (7)

#### High Priority (Core CRUD operations)

| Resource | Suggested Operation | GraphQL Endpoint | Arguments |
|----------|---------------------|------------------|-----------|
| Person | Get by ID | `person` | `id: Id!` |
| Person | Search | `persons` | `name: String`, `limit: Int`, `offset: Int` |
| Candidate | Search | `candidate` | `candidateId: Id`, `birthDate: BirthDate`, `name: String`, `limit: Int`, `offset: Int` |
| Employee | Search | `employee` | `employeeId: Id`, `name: String`, `limit: Int`, `offset: Int` |

#### Medium Priority (Utility operations)

| Resource | Suggested Operation | GraphQL Endpoint | Arguments |
|----------|---------------------|------------------|-----------|
| User | Get Current | `user` | none |
| Email | Log Email | `logEmail` | `from: String!`, `to: String!`, `subject: String!`, `body: String!` |

#### Low Priority (Reference data)

| Resource | Suggested Operation | GraphQL Endpoint | Arguments |
|----------|---------------------|------------------|-----------|
| System | Get Version | `version` | none |
| Functions | Get All | `talentorangeFunctions` | none |

## Suggested n8n Node Structure

```
Starhunter Node
├── Resources
│   ├── Person
│   │   ├── Get by ID
│   │   ├── Search (by name)
│   │   └── Get Birthdays (existing)
│   ├── Candidate
│   │   └── Search
│   ├── Employee
│   │   ├── Search
│   │   └── Get Current User
│   ├── Project Candidate
│   │   └── Get By Status Change Date (existing)
│   ├── Task
│   │   └── Create (existing)
│   ├── Email
│   │   └── Log Email
│   └── System
│       ├── Get Version
│       └── Get Functions
```

## Code References

- `nodes/Starhunter/Starhunter.node.ts` - Main node definition
- `nodes/Starhunter/actions/person/getBirthdays.ts` - Birthday query implementation
- `nodes/Starhunter/actions/projectCandidate/getByStatusChangeDate.ts` - Project candidate query
- `nodes/Starhunter/actions/task/create.ts` - Task creation mutation

## GraphQL Introspection Query Used

```graphql
{
  __schema {
    queryType {
      fields {
        name
        description
        args {
          name
          type { name kind ofType { name kind } }
        }
      }
    }
    mutationType {
      fields {
        name
        description
        args {
          name
          type { name kind ofType { name kind } }
        }
      }
    }
  }
}
```

## Resolved Questions

1. **What fields should be returned for each query by default?**
   - **Answer**: Return all fields available for each type.

2. **Should `projectCandidates` also support filtering by `projectId` in addition to status?**
   - **Answer**: No, filtering by status is sufficient for now.

3. **Are there any additional mutations planned for the API (update, delete operations)?**
   - **Answer**: Yes, mutations are planned but not in the near future.

4. **What is the format expected for the `logEmail` mutation's `from`/`to` fields?**
   - **Answer**: Simple email address as a string (e.g., `"user@example.com"`).

## Related Research

- `docs/research/2025-11-25-research-n8n-birthday-node.md` - Initial birthday node research
