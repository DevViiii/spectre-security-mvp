# Spectre Security — Pilot Setup Guide

This guide gets you from zero to a running Spectre Security deployment in under 30 minutes.

---

## Prerequisites

- A server running Ubuntu 22.04 (EC2 t3.medium or equivalent — 2 vCPU, 4GB RAM minimum)
- Docker and Docker Compose installed
- A domain name pointed at your server (for SSL)
- Your OpenAI API key (for the LLM judge classifier — optional)

---

## Step 1 — Clone and configure

```bash
git clone https://github.com/yourorg/spectre-security.git
cd spectre-security
make setup
```

This creates your `.env` files. Open `backend/.env` and set:

```
OPENAI_API_KEY=sk-...        # Required for LLM judge on critical attacks
SECRET_KEY=<random 32+ chars> # openssl rand -hex 32
```

---

## Step 2 — Start the stack

```bash
make dev     # local
# or for production:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Services that start:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **API** (FastAPI) on port 8000
- **Worker** (Celery) — background attack runner
- **Frontend** (Next.js) on port 3000

---

## Step 3 — Run database migrations

```bash
make migrate
```

Creates all tables: `api_keys`, `scans`, `scan_findings`, `policies`, `violations`, `audit_log`.

---

## Step 4 — Create your first API key

```bash
curl -X POST http://localhost:8000/auth \
  -H "Content-Type: application/json" \
  -d '{"name": "admin-key"}'
```

**Copy the `key` value — it is shown only once.** Use it in the dashboard login screen.

---

## Step 5 — Log in to the dashboard

Open `http://localhost:3000` and enter your API key.

---

## Step 6 — Run your first scan

1. Click **New scan** in the Scanner section
2. Enter your LLM endpoint URL (e.g. `https://api.openai.com/v1/chat/completions`)
3. Enter the API key for that endpoint
4. Select **Quick** suite for a fast first run (~2 minutes, critical + high only)
5. Click **Start scan**

The scan runs in the background. Refresh or wait — results appear automatically when complete. Download the PDF report with the **Download PDF** button.

---

## Step 7 — Install and configure Shield

Install the SDK in your LLM application:

```bash
pip install spectre-shield
```

Add two lines to your LLM call code:

```python
from spectre_shield import ShieldClient

shield = ShieldClient(base_url="http://your-spectre-server:8000")

# Before sending to LLM:
result = shield.inspect_input(user_prompt)
safe_prompt = result.text  # redacted if a policy matched

# After receiving from LLM:
out = shield.inspect_output(llm_response)
safe_response = out.text
```

Create your first policy in the Shield section of the dashboard:
- **Type**: Regex
- **Pattern**: `\b\d{3}-\d{2}-\d{4}\b`
- **Action**: Block
- **Name**: Block SSNs

Test it immediately:

```bash
curl -X POST http://localhost:8000/shield/inspect \
  -H "Content-Type: application/json" \
  -d '{"text": "My SSN is 123-45-6789", "direction": "input"}'
```

Expected response: `{"allowed": false, "action": "block", ...}`

---

## Frequently asked security questions

**Where is data stored?**
All data is stored in the PostgreSQL instance running on your server. Spectre Security does not send any of your LLM traffic, scan results, or violation data to external services.

**Are my API keys stored?**
No. Spectre Security never stores raw API keys — neither your Spectre dashboard key nor any target LLM API keys used in scans. Spectre keys are stored as SHA-256 hashes. Target endpoint keys are not stored at all; only the first 8 characters are kept as a display hint.

**Is data encrypted at rest?**
Postgres data at rest encryption depends on your disk encryption configuration (e.g. AWS EBS encryption). PDF reports stored in S3 use `AES256` server-side encryption.

**What network ports are required?**
- Inbound: 443 (HTTPS), 80 (HTTP redirect)
- Outbound: 443 to your LLM provider (for Scanner attack runs and LLM judge)

**How do I see who accessed what?**
The audit log at `GET /audit` records every significant platform action: key creation/revocation, scan creation/completion, policy changes, report generation.

**What data does the Scanner send to the LLM endpoint?**
Adversarial test payloads — these are the attack strings defined in the YAML files under `backend/app/scanner/attacks/`. No real user data is sent.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Dashboard shows "Invalid API key" | Re-create a key with `POST /auth` — keys cannot be recovered |
| Scan stays in `pending` state | Check the worker is running: `docker compose ps worker` |
| Shield inspection is slow | Check Redis connection; policy cache may not be warming |
| PDF not generating | Ensure `weasyprint` is installed and `make migrate` has been run |
| Celery tasks not running | Check `CELERY_BROKER_URL` in `.env` matches the Redis container |

Support: open an issue or contact your Spectre Security contact.
