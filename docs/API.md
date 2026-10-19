# REST API Documentation

## Base URL
`/api/v1`

## Authentication (`/auth`)

### POST `/auth/register`
Register a new user.
- **Body**: `{ name, email, password }`
- **Response**: `{ user, accessToken }`

### POST `/auth/login`
Login a user.
- **Body**: `{ email, password }`
- **Response**: `{ user, accessToken }`

### POST `/auth/refresh`
Refresh access token using HTTP-only cookie.
- **Response**: `{ accessToken }`

### POST `/auth/logout`
Logout user and clear cookies.

---

## SMTP Accounts (`/smtp`)
*Requires Bearer Token*

### GET `/smtp`
List all SMTP accounts.

### POST `/smtp`
Create a new SMTP account.
- **Body**: `{ name, host, port, username, password, encryption, fromEmail, fromName, provider }`

### POST `/smtp/:id/test`
Test connection for an SMTP account.

---

## Contacts (`/contacts`)
*Requires Bearer Token*

### GET `/contacts`
List contacts with pagination.
- **Query**: `page`, `limit`, `search`, `group`

### POST `/contacts`
Create a new contact.

### POST `/contacts/import`
Import contacts from CSV/Excel. (Multipart Form)

---

## Templates (`/templates`)
*Requires Bearer Token*

### GET `/templates`
List all templates.

### POST `/templates`
Create a new email template.

---

## Campaigns (`/campaigns`)
*Requires Bearer Token*

### GET `/campaigns`
List all campaigns.

### POST `/campaigns`
Create a new campaign.

### POST `/campaigns/:id/start`
Start a scheduled or draft campaign.

### POST `/campaigns/:id/pause`
Pause a running campaign.
