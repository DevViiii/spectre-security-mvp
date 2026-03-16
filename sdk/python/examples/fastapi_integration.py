"""
FastAPI + spectre-shield integration example.

Shows the recommended pattern for wrapping LLM calls in a FastAPI app.
The shield client is created once at startup and injected via dependency.
"""
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import openai

from spectre_shield import ShieldClient
from spectre_shield.middleware import wrap_openai

# ── App setup ──────────────────────────────────────────────────────────────

app = FastAPI()

# Create Shield client once at startup
shield = ShieldClient(
    base_url="https://spectre.yourco.com",
    fail_open=True,   # Never block LLM traffic if Shield is unreachable
)

# Create OpenAI client — wrap it for automatic inspection
raw_openai = openai.OpenAI(api_key="sk-...")
llm = wrap_openai(raw_openai, shield)


# ── Request / response models ──────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    redacted: bool = False


# ── Route ──────────────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    # Manual pattern: inspect before and after
    input_result = shield.inspect(
        text=body.message,
        direction="input",
        context={"session_id": body.session_id},
    )

    if input_result.was_blocked:
        raise HTTPException(status_code=400, detail="Message blocked by security policy.")

    # wrap_openai already intercepts create() — the explicit inspect above is optional
    # but gives you control over the error response format
    response = llm.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": input_result.text}],
    )

    reply = response.choices[0].message.content or ""

    # Inspect output (also handled by wrap_openai, but shown here for clarity)
    out_result = shield.inspect_output(reply, context={"session_id": body.session_id})

    return ChatResponse(
        reply=out_result.text,
        redacted=out_result.was_redacted,
    )
