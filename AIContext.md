# AI Context — [PROJECT NAME]

## Stack

- Runtime: nodejs [20]
- Language: TypeScript
- Framework: Next.js
- Database: MongoDB + Mongoose
- Frontend: Nextjs (minimal involvement)
- OS: Windows

## Architecture - [Monolith]

## Auth

Managed by NextAuth (server-side session via cookies)
Token storage: [not implemented yet]

## Project Structure

```
.
├── app
│   ├── api
│   │   ├── auth
│   │   ├── interview
│   │   └── users
│   ├── auth
│   │   └── signin
│   ├── dashboard
│   │   └── [sessionId]
│   ├── login
│   ├── room
│   └── setup
├── components
├── context
├── hooks
├── lib
│   ├── client
│   ├── gemini
│   └── server
├── models
├── public
├── services
└── types
```

## DB Models - Shared Model managed from npm package, it's in a different repo i.e used in multiple projects

## Common Patterns Used

- [e.g., Async wrapper for try/catch]
- [e.g., All responses follow: { success, message, data } with proper statusCode]

## Environment Variables (keys only, no values)

```
MONGO_URI=
GEMINI_API_KEY=
NEXTAUTH_URL=
etc
```

## External Services / Integrations

- [Gemini API]

## Important Rules / Conventions

- [Always use async/await, no .then()]
- [Business logic validation is done at controller level]
- [Never return passwords in response, and unnecessary extra data]
- [Aways write controllers in such a way it's scalable]
- [Write understable code with comments to understand in every feature]
- [Use B&W themed for design, use tailwind css, motion etc for frontend design]

## Current Focus / Active Module

[Implement google Authentication]

## Known Issues / Constraints

- []

---

## Implement the given task.

Make sure you break the task in mutiple sub-task and work and resolve the errors and test them.

## Task To Implement

1. "/login" page is working but its 100% implemented. At "/" when user is not logged in show a btn at top-right corner "Login", if logged in user then show "Try it Out!"
2. "/login" page improve the current design of login, current is good but not so pretty.
   at "/dashboard" when user get 400 error code then show the page mentioning you have to create your account then only you can access /dashboard contents.
3. When user go from the avove popu to login or signup then after success full login it redirects to current page "/dashboard" with same sessionid in params

# Google Authentication with NextAuth (Next.js + TypeScript + App Router)

Production-ready Google OAuth implementation using **NextAuth** in a Next.js App Router project with full TypeScript support and a minimal black & white themed UI.

After successful authentication, users are redirected to:

# 1. NextAuth Configuration (TypeScript Safe)

### File:

```
app/api/auth/[...nextauth]/route.ts

Already there is a file and auth logic is there. No need to create a new file. you just have to check it is correct or not. and fix it if required.
```

# 2. Login Page (Black & White Theme)

### File:

```
app/login/page.tsx
```

Implement login page with google sign in button. use theme as black & white.

# 3. Test & Verification Checklist

### Development

```bash
npm run dev
```

### Verify:

- Visiting `/login` shows login UI
- Clicking Google opens OAuth screen
- After login → redirects to `/`
- Session persists on refresh
- Sign out clears session
- No TypeScript errors
- No runtime errors in console

---

# 4. Common Issues & Fixes

### 1. `NEXTAUTH_URL` mismatch

Ensure it matches your domain exactly.

### 2. Redirect URI mismatch

Check Google Console → Credentials.

### 3. `NEXTAUTH_SECRET` missing

Server will throw JWT error.

### 4. Session not updating

Restart server after env changes.

---

# 5. Production Deployment

Set production environment variables:

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=production_secret
GOOGLE_CLIENT_ID=prod_client_id
GOOGLE_CLIENT_SECRET=prod_client_secret
```

Update Google OAuth redirect URI to production domain.

---

# Result

- Fully typed
- Secure JWT session strategy
- App Router compatible
- Production-ready configuration
- Minimal black & white UI
