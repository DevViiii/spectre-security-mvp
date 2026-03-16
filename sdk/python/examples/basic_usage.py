"""
Basic spectre-shield SDK usage.
Install: pip install spectre-shield
"""
from spectre_shield import ShieldClient

shield = ShieldClient(
    base_url="https://spectre.yourco.com",  # your Spectre deployment
    fail_open=True,                          # allow requests if Shield is down
    raise_on_block=False,                    # handle blocks manually
)

# ── Example 1: Inspect a user prompt ──────────────────────────────────────

user_prompt = "What is my account balance? My SSN is 123-45-6789."

result = shield.inspect_input(user_prompt)

if result.was_blocked:
    # Return an error to the user — never send this to the LLM
    print("Blocked:", [v.policy_name for v in result.violations])
elif result.was_redacted:
    # Send the sanitized prompt to your LLM instead
    safe_prompt = result.text
    print("Redacted:", safe_prompt)
else:
    # Clean — proceed normally
    safe_prompt = result.text
    print("Clean:", safe_prompt)

# ── Example 2: Inspect an LLM response before returning it ────────────────

llm_response = "Your account balance is $5,000. Contact admin@example.com for details."

out_result = shield.inspect_output(llm_response)

if out_result.was_redacted:
    print("Output redacted:", out_result.text)
    # Logs: "Your account balance is $5,000. Contact [REDACTED] for details."
else:
    print("Output clean:", out_result.text)

# ── Example 3: Context metadata for audit trail ────────────────────────────

result = shield.inspect(
    text=user_prompt,
    direction="input",
    context={
        "session_id": "sess_abc123",
        "user_id": "user_456",
        "app": "customer-support-bot",
    },
)
print(f"Inspection took {result.inspection_ms:.1f}ms")
