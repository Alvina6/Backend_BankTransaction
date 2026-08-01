# Backend BankTransaction

A Node.js + Express + MongoDB backend for managing user accounts, transactions, ledgers, and authentication.

## Overview

This project provides a simple banking-style API where users can:

- Register and login
- Create bank accounts
- Check account balance
- Perform money transfers
- Track transaction history through ledger entries
- Receive email notifications for registration and transaction events

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email integration
- Cookie-based token handling

## Project Structure

```text
src/
├── app.js
├── config/
│   └── db.js
├── controllers/
│   ├── account.controller.js
│   ├── auth.controller.js
│   └── transaction.controller.js
├── middleware/
│   └── auth.middleware.js
├── models/
│   ├── account.model.js
│   ├── blackList.model.js
│   ├── ledger.model.js
│   ├── transaction.model.js
│   └── user.model.js
├── routes/
│   ├── account.routes.js
│   ├── auth.routes.js
│   └── transaction.routes.js
└── services/
    └── email.service.js
```

## Features

### Authentication

- User registration
- User login
- Logout with token blacklist support
- JWT protected routes

### Account Management

- Create account for authenticated user
- Get all user accounts
- Get account balance

### Transaction Management

- Transfer funds between accounts
- Idempotency key support for safe retries
- Ledger-based balance tracking
- Initial funds transaction route for system user flow

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root and add the required environment variables.

## Run the Project

Start the server using:

```bash
node server.js
```

## API Endpoints

### Auth Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Account Routes

- `POST /api/account/create`
- `GET /api/account/`
- `GET /api/account/balance/:accountId`

### Transaction Routes

- `POST /api/transaction/`
- `POST /api/transaction/system/initial-funds`

## Notes

- All account and transaction routes are protected using authentication middleware.
- Token is stored in cookies and also supports Bearer token authorization.
- The project uses MongoDB transactions for safe money transfer processing.
- Email sending is integrated through Gmail OAuth configuration.

## License

ISC
