# One-time GCP / Firebase / GitHub setup

Everything in this file needs your own Google/GitHub login, so it's not something I can run for you. Do it whenever you're ready to deploy — it's **not required** to build or test Phase 1 locally, since local dev runs entirely against the Firebase emulators (`npm run emulators`) against a fake `demo-kaleido` project. You only need this before the first real deploy to Cloud Run.

Replace `YOUR_PROJECT_ID`, `YOUR_GITHUB_USERNAME`, and `REGION` (default suggestion: `us-central1`, cheapest/most free-tier-friendly) throughout.

## 1. Install CLIs (if you don't have them)

```bash
brew install --cask google-cloud-sdk   # gcloud
```

`firebase` CLI is already a project devDependency — use `npx firebase ...` for everything below, no global install needed.

## 2. Log in

```bash
gcloud auth login
gcloud auth application-default login   # so local tooling can use your creds too
npx firebase login
```

## 3. Create the GCP project and attach billing

Project IDs are globally unique, so pick something specific to you.

```bash
gcloud projects create YOUR_PROJECT_ID --name="Kaleido"
gcloud config set project YOUR_PROJECT_ID
```

Link a billing account (Console: [console.cloud.google.com/billing](https://console.cloud.google.com/billing) → link to `YOUR_PROJECT_ID`). This is required to use Cloud Run/Artifact Registry at all, even while usage stays inside the always-free tier — you won't be charged unless you exceed it.

## 4. Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com \
  iamcredentials.googleapis.com
```

## 5. Create the Firebase project and enable Auth/Firestore/Storage

```bash
npx firebase projects:addfirebase YOUR_PROJECT_ID
```

Then, in the [Firebase console](https://console.firebase.google.com/) for this project:

- **Authentication** → Sign-in method → enable **Email/Password**.
- **Firestore Database** → Create database → **Native mode**, pick `REGION`.
- **Storage** → Get started (accept default bucket).

## 6. Point this repo at the real project

```bash
npx firebase use --add   # pick YOUR_PROJECT_ID, alias it "production"
npx firebase deploy --only firestore:rules,firestore:indexes,storage:rules --project YOUR_PROJECT_ID
```

## 7. Get the web app config

Firebase console → Project settings → General → Your apps → Add app → **Web** → register "Kaleido" → copy the config object. You'll use these values twice:

- Locally: paste into `.env.local` (copy from `.env.local.example` first) with `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false` if you want to point local dev at the real project instead of emulators.
- CI: add as **GitHub repo Variables** (not Secrets — they're not sensitive, they just need to exist): Settings → Secrets and variables → Actions → Variables tab → add `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.

## 8. Create the Artifact Registry repo for container images

```bash
gcloud artifacts repositories create kaleido \
  --repository-format=docker \
  --location=REGION \
  --description="Kaleido container images"
```

## 9. Set up Workload Identity Federation (keyless GitHub Actions deploys)

This lets GitHub Actions deploy to Cloud Run without a stored service-account key.

```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Pool + OIDC provider trusting GitHub's token issuer
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" --workload-identity-pool="github-pool" \
  --display-name="GitHub provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Dedicated deploy service account, least-privilege
gcloud iam service-accounts create kaleido-deployer --display-name="Kaleido CI deployer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:kaleido-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:kaleido-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:kaleido-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Restrict: only THIS GitHub repo may impersonate the deploy service account
gcloud iam service-accounts add-iam-policy-binding \
  "kaleido-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/kaleido"

echo "GCP_WORKLOAD_IDENTITY_PROVIDER = projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
echo "GCP_SERVICE_ACCOUNT = kaleido-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com"
```

Add the two printed values, plus `GCP_PROJECT_ID`, as **GitHub repo Secrets** (Settings → Secrets and variables → Actions → Secrets tab).

## 10. Create the GitHub repo and push

```bash
gh repo create kaleido --public --source=. --push
```

(Or create it manually on github.com and `git remote add origin ...` + `git push -u origin main`.)

Once steps 7 (Variables) and 9 (Secrets) are set on the GitHub repo, the next push to `main` will build and deploy to Cloud Run automatically via `.github/workflows/deploy.yml`.
