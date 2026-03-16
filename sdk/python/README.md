# spectre-shield

Python SDK for Spectre Security's runtime AI-DLP inspection proxy.

Zero dependencies. Python 3.10+.

## Install

```bash
pip install spectre-shield
```

## Quick start

```python
from spectre_shield import ShieldClient

shield = ShieldClient(base_url="https://spectre.yourco.com")

# Inspect a prompt before sending to your LLM
result = shield.inspect_input(user_message)

if result.was_blocked:
    raise ValueError("Blocked by security policy")

# Send result.text (may be redacted) to your LLM
llm_response = your_llm_call(result.text)

# Inspect the response before returning to the user
out = shield.inspect_output(llm_response)
return out.text
```

## Configuration

```python
shield = ShieldClient(
    base_url="https://spectre.yourco.com",
    api_key="sk-spectre-...",   # optional for /inspect
    timeout_ms=5000,             # default 5s
    fail_open=True,              # allow traffic when Shield is unreachable
    raise_on_block=False,        # raise ShieldBlockedError on block actions
)
```

## OpenAI middleware

```python
from spectre_shield.middleware import wrap_openai
import openai

client = wrap_openai(openai.OpenAI(api_key="sk-..."), shield)
# Now every client.chat.completions.create() call is auto-inspected
```

## InspectionResult

| Attribute | Type | Description |
|---|---|---|
| `allowed` | bool | False if action=block |
| `action` | str | "allow", "alert", "redact", or "block" |
| `text` | str | Original or redacted text |
| `violations` | list | Matched policies |
| `inspection_ms` | float | Latency in milliseconds |
| `was_blocked` | bool | Shorthand for action == "block" |
| `was_redacted` | bool | Shorthand for action == "redact" |
| `is_clean` | bool | No violations found |
