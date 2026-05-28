@echo off
echo ==========================================================
echo  Deploying Sarkardada Public Account Platform to Cloud Run
echo ==========================================================
echo.
echo Target Project: autom8-n8n-483811
echo Target Region:  us-west1
echo Service Name:   sarkardada-platform
echo.
echo [1/2] Deploying source code using gcloud CLI...
echo This will take 2-4 minutes. Progress will print below.
echo.

gcloud run deploy sarkardada-platform ^
  --source . ^
  --project autom8-n8n-483811 ^
  --region us-west1 ^
  --allow-unauthenticated

if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Deployment failed!
  echo Please make sure the gcloud CLI is authenticated on your system.
  echo You can log in by running: gcloud auth login
  echo.
  pause
  exit /b %errorlevel%
)

echo.
echo ==========================================================
echo  [2/2] Deployment Completed Successfully!
echo ==========================================================
echo.
echo Your application is now hosted and live! Use the URL printed above.
echo.
echo IMPORTANT REMINDER:
echo Since we git-ignore local credentials, you must map your server-side keys
echo in the Google Cloud Run Console.
echo.
echo Go to: https://console.cloud.google.com/run/detail/us-west1/sarkardada-platform/revisions?project=autom8-n8n-483811
echo Click "EDIT & DEPLOY NEW REVISION" and add these environment variables:
echo   - GEMINI_API_KEY           = (your Gemini key)
echo   - NEXT_PUBLIC_SUPABASE_URL = %NEXT_PUBLIC_SUPABASE_URL%
echo   - NEXT_PUBLIC_SUPABASE_ANON_KEY = (your Supabase anon key)
echo.
echo Also set:
echo   - CPU Allocation: "CPU is always allocated" (No CPU Throttling)
echo     This keeps the server-side background thread active so ratings run continuously when you close your laptop!
echo.
pause
