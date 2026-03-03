# Automatically Scheduled Weekly Performance Report

This edge function aggregates ReliabilityIQ task data from the past 7 days, generates an executive summary using Clawbolt AI, and sends a professional HTML email report to all managers via Resend.

## Setup Requirements

Before deploying this function, you **must** configure the following secrets in your Supabase project:

```bash
# Set your API keys
npx supabase secrets set CLAWBOLT_API_KEY=your_clawbolt_key
npx supabase secrets set RESEND_API_KEY=your_resend_key
```

*Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically injected by the Supabase runtime.*

**Important Resend Configuration:**
In `supabase/functions/weekly-report/index.ts`, ensure the `from:` email address matches the verified sender domain configured in your Resend account (currently set to `reports@reliabilityiq.com`).

## Deployment

Deploy the function to your live Supabase project:

```bash
npx supabase functions deploy weekly-report --no-verify-jwt
```
*Note: `--no-verify-jwt` is required if triggering this automatically via cron, as there won't be an active user session token.*

## Scheduling Execution (Cron)

To have this report email sent out automatically every week (e.g., every Friday at 5:00 PM), navigate to your Supabase Dashboard:
1. Go to **Edge Functions** -> **Cron**
2. Create a new trigger:
   - Name: `Weekly Report Email`
   - Schedule: `0 17 * * 5` (Cron syntax for Friday 5 PM)
   - Action: **Edge Function**
   - Function: `weekly-report`
   - Method: `POST`

### Local Testing

To test this function locally, create a `.env.local` file in the `supabase/functions/weekly-report` directory with your API keys, and run:

```bash
npx supabase functions serve --env-file ./supabase/functions/weekly-report/.env.local weekly-report
```
