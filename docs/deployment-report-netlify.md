# Netlify Deployment Report

## Overview
This report documents the configuration and steps taken to deploy the frontend of the Football Intelligence Platform to Netlify.

## Deployment Configuration

### Netlify Configuration (`netlify.toml`)
The deployment is configured via `netlify.toml` in the repository root using the `base` directory approach.

- **Base Directory**: `apps/web`
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Runtime**: 20.x
- **Next.js Plugin**: Automatically detected and managed by Netlify (Next.js Runtime v5).

### CI/CD Pipeline
- **Connection**: Integrated with GitHub.
- **Automatic Deploys**: Enabled for the `main` branch.
- **Deploy Previews**: Enabled for all Pull Requests.
- **Branch Deploys**: Enabled for the `develop` branch (staging).

## Environment Variables
The following environment variables must be configured in the Netlify UI (Site settings > Build & deploy > Environment):

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Public endpoint for the API Gateway | `https://api.football-intelligence.com` |
| `NEXTAUTH_URL` | Canonical URL of the web application | `https://platform.netlify.app` |
| `NEXTAUTH_SECRET` | Secure random string for session signing | `[SECRET_STRING]` |
| `ADMIN_ACCESS_TOKEN` | Secure token for administrative API access | `[SECRET_TOKEN]` |

## Performance Optimization
- **Static Site Generation (SSG)**: Leveraged where possible by Next.js.
- **Image Optimization**: Handled by Netlify's Image CDN through the Next.js plugin.
- **Global CDN**: Assets are served via Netlify's Edge network.
- **Caching**: Standard Next.js caching headers are applied.

## Security
Security headers can be implemented in `next.config.js` or `netlify.toml` once the initial deployment is stable. For the initial deployment, empty `_headers` and `_redirects` files are provided in `apps/web/public/` to satisfy Netlify's validation checks.

## Testing & Validation
1. **Build Test**: Run `npm run build --workspace=@football/web` locally to ensure no build regressions.
2. **API Connectivity**: Verify `NEXT_PUBLIC_API_URL` is correctly injected and reachable from the browser.
3. **Auth Flow**: Ensure `NEXTAUTH_URL` matches the Netlify site URL to prevent redirect issues.

## Troubleshooting
- **Build Failures**: Check if `turbo` is correctly resolving dependencies. Ensure all workspace packages are present.
- **Plugin Issues**: Ensure `@netlify/plugin-nextjs` is installed if not automatically detected.
- **Environment Variables**: Ensure `NEXT_PUBLIC_` prefix is used for variables intended for the browser.
