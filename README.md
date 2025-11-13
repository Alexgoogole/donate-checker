# Donation Checker

Automated tool to check if a donation link is closed using headless Chromium (Puppeteer).

## Local Development

```bash
npm install
PORT=8080 npm start
```

Send a POST request to check donation status (default port is `8080`):

```bash
curl -X POST http://localhost:8080/check-donation \
  -H "Content-Type: application/json" \
  -d '{"url": "https://send.monobank.ua/jar/5sPWZLbubU"}'
```

## Response

```json
{
  "donationClosed": true,
  "url": "https://send.monobank.ua/jar/5sPWZLbubU"
}
```

- `donationClosed: true` - The donation is closed (paid-rolling image found)
- `donationClosed: false` - The donation is still open

## API Endpoints

- `POST /check-donation` - Check donation status
- `GET /health` - Health check

## Build and Deploy (Cloud Functions Gen 2 Custom Container)

1. Configure values for reuse:

```bash
PROJECT_ID="your-gcp-project-id"
REGION="europe-central2"
REPOSITORY="donate-checker-functions"
IMAGE="donate-checker"
ARTIFACT_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE}:latest"
```

2. Create an Artifact Registry repository (once per project):

```bash
gcloud artifacts repositories create "${REPOSITORY}" \
  --repository-format=Docker \
  --location="${REGION}" \
  --description="Donate checker Cloud Functions images"
```

3. Build and push the Docker image (for Apple Silicon, use `--platform` flag):

```bash
# Build for linux/amd64 (required for GCP)
docker build --platform=linux/amd64 -t "${ARTIFACT_URI}" .
docker push "${ARTIFACT_URI}"
```

**Note:** If you're on Apple Silicon (M1/M2/M3), you must use `--platform=linux/amd64` to build for Google Cloud Functions, which runs on amd64 architecture.

4. Deploy to Cloud Run (Cloud Functions Gen2 uses Cloud Run under the hood):

```bash
# First, pull and tag your Docker Hub image for Artifact Registry
docker pull alexgoogole/donate-checker:v0.0.2
docker tag alexgoogole/donate-checker:v0.0.2 "${ARTIFACT_URI}"

# Authenticate with Artifact Registry
gcloud auth configure-docker "${REGION}-docker.pkg.dev"

# Push to Artifact Registry
docker push "${ARTIFACT_URI}"

# Deploy to Cloud Run
gcloud run deploy donate-checker \
  --image "${ARTIFACT_URI}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 120 \
  --port 8080 \
  --set-env-vars FUNCTION_TARGET=app
```

**Note:** Cloud Functions Gen2 doesn't support `--docker-image` directly. Deploy to Cloud Run instead, which provides the same functionality.

5. Get the service URL and test:

```bash
# Get the Cloud Run service URL
SERVICE_URL="$(gcloud run services describe donate-checker --region="${REGION}" --format='value(status.url)')"

# Test the health endpoint
curl "${SERVICE_URL}/health"

# Test the donation check endpoint
curl -X POST "${SERVICE_URL}/check-donation" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://send.monobank.ua/jar/5sPWZLbubU"}'
```

