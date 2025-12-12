# n8n Workflow Setup Guide - PhishGuard AI

This guide walks you through setting up n8n.cloud to automatically fetch Gmail emails and send them to your backend for phishing detection.

---

## Prerequisites

- Gmail account for testing
- n8n.cloud account (free tier)
- Backend API URL (we'll use a placeholder for now)

---

## Step 1: Create n8n.cloud Account

1. Go to **[n8n.cloud](https://app.n8n.cloud/register)**
2. Sign up with email or Google
3. Choose the **Free** plan (Starter)
4. Your instance will be created at `https://your-name.app.n8n.cloud`

---

## Step 2: Set Up Google OAuth Credentials

Before connecting Gmail to n8n, you need Google Cloud credentials.

### 2.1 Create Google Cloud Project

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**
2. Click **Select a Project** → **New Project**
3. Name: `PhishGuard-n8n`
4. Click **Create**

### 2.2 Enable Gmail API

1. Go to **APIs & Services** → **Library**
2. Search for **Gmail API**
3. Click **Enable**

### 2.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** → Click **Create**
3. Fill in:
   - App name: `PhishGuard Email Scanner`
   - User support email: Your email
   - Developer contact: Your email
4. Click **Save and Continue**
5. **Scopes**: Click **Add or Remove Scopes**
   - Add: `https://www.googleapis.com/auth/gmail.readonly`
   - Click **Update** → **Save and Continue**
6. **Test users**: Add your Gmail address
7. Click **Save and Continue** → **Back to Dashboard**

### 2.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `n8n-gmail-integration`
5. **Authorized redirect URIs**: Add:
   ```
   https://your-instance.app.n8n.cloud/rest/oauth2-credential/callback
   ```
   (Replace `your-instance` with your actual n8n subdomain)
6. Click **Create**
7. **Copy and save** the Client ID and Client Secret

---

## Step 3: Import Workflow in n8n

### 3.1 Create New Workflow

1. In n8n, click **+ Add Workflow**
2. Name it: `PhishGuard Gmail Scanner`

### 3.2 Add Gmail Trigger Node

1. Click **+** to add a node
2. Search for **Gmail Trigger**
3. Click on it to configure:

   **Credential Setup:**
   - Click **Create New Credential**
   - Choose **Gmail OAuth2 API**
   - Enter your **Client ID** and **Client Secret** from Google Cloud
   - Click **Sign in with Google**
   - Authorize access to your Gmail

   **Node Settings:**
   - **Poll Times**: Every 5 minutes (or as needed)
   - **Mailbox**: `INBOX`
   - **Labels**: Leave empty (monitor all) or specify a label

### 3.3 Add Function Node (Extract Email Data)

1. Add a new node after Gmail Trigger
2. Search for **Code** (Function node)
3. Add this code:

```javascript
// Extract email data for phishing analysis
const emails = [];

for (const item of $input.all()) {
  const email = item.json;
  
  // Extract URLs from body
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
  const bodyText = email.textPlain || email.snippet || '';
  const htmlBody = email.textHtml || '';
  
  const textUrls = bodyText.match(urlRegex) || [];
  const htmlUrls = htmlBody.match(urlRegex) || [];
  const allUrls = [...new Set([...textUrls, ...htmlUrls])];
  
  // Extract sender info
  const fromHeader = email.from || '';
  const senderEmail = fromHeader.match(/<(.+?)>/) 
    ? fromHeader.match(/<(.+?)>/)[1] 
    : fromHeader;
  
  emails.push({
    json: {
      messageId: email.id || email.messageId,
      subject: email.subject || '(No Subject)',
      sender: senderEmail,
      senderName: fromHeader.replace(/<.+?>/, '').trim(),
      body: bodyText.substring(0, 5000), // Limit body size
      htmlBody: htmlBody.substring(0, 10000),
      urls: allUrls,
      receivedAt: email.internalDate 
        ? new Date(parseInt(email.internalDate)).toISOString()
        : new Date().toISOString(),
      labels: email.labelIds || [],
      snippet: email.snippet || ''
    }
  });
}

return emails;
```

4. Click **Execute Node** to test

### 3.4 Add HTTP Request Node

1. Add a new node after the Function node
2. Search for **HTTP Request**
3. Configure:

   **Method**: `POST`
   
   **URL**: 
   ```
   https://your-backend.onrender.com/api/process-email
   ```
   (We'll update this URL after deploying the backend)
   
   **Authentication**: 
   - Type: **Header Auth**
   - Name: `X-API-Key`
   - Value: `your-api-key-here` (we'll set this later)
   
   **Body Content Type**: `JSON`
   
   **Body**:
   ```json
   {
     "messageId": "{{ $json.messageId }}",
     "subject": "{{ $json.subject }}",
     "sender": "{{ $json.sender }}",
     "senderName": "{{ $json.senderName }}",
     "body": "{{ $json.body }}",
     "urls": {{ $json.urls }},
     "receivedAt": "{{ $json.receivedAt }}"
   }
   ```

   **Options**:
   - **Timeout**: 30000 (30 seconds)
   - **Response Format**: JSON

### 3.5 Add Error Handler (Optional)

1. Add a **Set** node for error handling
2. Connect it to the HTTP Request node's error output
3. Configure to log failed emails

---

## Step 4: Workflow Configuration

### Complete Workflow Structure

```
[Gmail Trigger] → [Code/Function] → [HTTP Request] → [Success]
                                           ↓
                                    [Error Handler]
```

### Workflow Settings

1. Click the **gear icon** (Workflow Settings)
2. Configure:
   - **Error Workflow**: Create a separate workflow for notifications (optional)
   - **Timezone**: Set to your timezone
   - **Save Data**: Error Workflow

---

## Step 5: Testing the Workflow

### Manual Test

1. Click **Execute Workflow** (play button)
2. Send a test email to your Gmail
3. Check if the email appears in the Gmail Trigger output
4. Verify the Function node extracts data correctly

### Expected Output from Function Node

```json
{
  "messageId": "18c1234567890abc",
  "subject": "Test Email Subject",
  "sender": "sender@example.com",
  "senderName": "John Doe",
  "body": "This is the email body content...",
  "urls": ["https://example.com/link1", "https://example.com/link2"],
  "receivedAt": "2024-01-15T10:30:00.000Z",
  "labels": ["INBOX", "UNREAD"],
  "snippet": "This is the email body..."
}
```

---

## Step 6: Activate the Workflow

1. Once testing is complete, click **Active** toggle (top right)
2. The workflow will now run automatically based on your Poll Times setting
3. Monitor executions in the **Executions** tab

---

## Troubleshooting

### Gmail Trigger Not Working

- Ensure OAuth credentials are correct
- Check that test user is added in Google Cloud Console
- Verify Gmail API is enabled

### HTTP Request Failing

- Backend not deployed yet (expected at this stage)
- Check API URL is correct
- Verify API key header is set

### No Emails Detected

- Check Poll Time settings
- Ensure emails are in the correct mailbox/label
- Try sending a fresh email while workflow is active

---

## Next Steps

After completing this n8n setup:

1. ✅ n8n workflow created and tested
2. ⏳ Build the backend API (`/api/process-email`)
3. ⏳ Deploy backend to Render
4. ⏳ Update HTTP Request URL in n8n
5. ⏳ Test end-to-end flow

---

## Workflow Export JSON

See the file `n8n-workflow.json` in this directory for a complete workflow that you can import directly.

To import:
1. In n8n, click **+** → **Import from File**
2. Select `n8n-workflow.json`
3. Update credentials and backend URL
