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
3. Right-click `makecomapp.json` -> Deploy to Make

### Manual Import
1. Navigate to Make.com -> Apps -> Create a New App
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
