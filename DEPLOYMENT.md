# MM-ITS deployment (Railway)

This setup uses three Railway services: PostgreSQL, the FastAPI API, and the Next.js frontend.
The API and frontend domains are reachable from the internet, but application access is restricted
to accounts created by the administrator. Do not treat sign-in as network-level isolation.

## Create the services

1. Put this project in a **private repository dedicated to MM-ITS**. Do not upload it to the QEase
   repository. The local `.gitignore` excludes environment files and certificate/private-key files.
2. Create a Railway project and add a PostgreSQL service.
3. Add an API service from the private repository with the project root as its source directory.
   It uses the root `Dockerfile`; add a Railway public domain for HTTPS access.
4. Add a frontend service from the same repository with `/frontend` as its root directory.
   Use `npm ci` to build and `npm run start` to start it, then add a public domain.
5. Set the API's `DATABASE_URL` to the PostgreSQL service's `DATABASE_URL` reference. Wait for the
   API to become healthy at `/health` before completing the frontend configuration.

## API environment variables

Set these on the API service:

| Variable | Value |
| --- | --- |
| `MMITS_ENVIRONMENT` | `production` |
| `SECRET_KEY` | A unique random secret of at least 32 characters |
| `DATABASE_URL` | Railway reference to PostgreSQL's `DATABASE_URL` |
| `BOOTSTRAP_ADMIN_USERNAME` | The administrator's chosen username |
| `BOOTSTRAP_ADMIN_EMAIL` | The administrator's email |
| `BOOTSTRAP_ADMIN_PASSWORD` | A unique password of at least 12 characters |
| `ALLOW_PUBLIC_REGISTRATION` | `false` |
| `FRONTEND_URL` | The frontend's full `https://` origin, without a trailing slash |
| `API_PUBLIC_URL` | The API's full `https://` origin, without a trailing slash |

`CORS_ORIGINS` is optional; when set, use the same frontend origin. Do not put passwords or secret
values in this file or in source control.

## Frontend environment variables

Set these on the frontend service before its production build:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | The API's full `https://` origin |
| `NEXT_PUBLIC_ADMIN_USERNAME` | The same username as `BOOTSTRAP_ADMIN_USERNAME` |
| `NEXTAUTH_URL` | The frontend's full `https://` origin |
| `NEXTAUTH_SECRET` | A unique random secret of at least 32 characters, separate from the API's `SECRET_KEY` |

After both domains are configured, redeploy the API if its `FRONTEND_URL` was added or changed,
then redeploy the frontend so its public API URL is included in the build.

## First login and member access

On the first API startup, the configured bootstrap administrator is created if that username does
not already exist. Sign in with that account, open **Group accounts**, and create one account per
member. Public registration remains disabled; members cannot create their own accounts. Disabling
a member prevents future API and WebSocket authentication with that account.

Railway public domains remain reachable globally. The account gate prevents unauthorized use, but
it does not hide the login page or restrict connections by group network, VPN, or IP address.
Configure an additional private-network/VPN or access-proxy layer if network-level restriction is
required.

The baseline app can run without RabbitMQ; its startup records the broker as disconnected when no
broker is available. Features that publish ticket events require a separately configured,
reachable RabbitMQ service and the API's `RABBITMQ_URL` environment variable.
