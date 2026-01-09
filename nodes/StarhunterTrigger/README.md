# Starhunter Trigger Node

## Example Workflows

### Workflow 1: New Application Notification

Sends an email notification when a candidate applies:

1. **Starhunter Trigger** - Filter for "Application Events"
2. **Set** - Format candidate details
3. **Gmail** - Send email to hiring manager

### Workflow 2: Status Change Automation

Updates CRM when candidate status changes:

1. **Starhunter Trigger** - Filter for "Status Change Events"
2. **Switch** - Branch by new status
3. **HubSpot** / **Salesforce** - Update contact

### Workflow 3: Document Processing

Processes uploaded resumes with AI:

1. **Starhunter Trigger** - Filter for "Document Upload Events"
2. **Extract from File** - Extract resume text
3. **OpenAI** - Analyze qualifications
4. **Starhunter** (action node) - Update candidate notes

## Testing Your Webhook

Use curl to test locally:

```bash
# Calculate HMAC signature
PAYLOAD='{"eventType":"application","candidate":{"id":"test"}}'
SECRET="your-webhook-secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Send test webhook
curl -X POST \
  https://your-n8n.instance/webhook/YOUR_WEBHOOK_PATH \
  -H "Content-Type: application/json" \
  -H "X-Starhunter-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```
