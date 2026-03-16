"""
Optional middleware for automatic OpenAI call inspection.

Usage (wrapping the openai client):
    from spectre_shield.middleware import wrap_openai
    from spectre_shield import ShieldClient
    import openai

    shield = ShieldClient(base_url="https://spectre.yourco.com")
    client = wrap_openai(openai.OpenAI(api_key="sk-..."), shield)

    # Now every client.chat.completions.create() call is auto-inspected
    response = client.chat.completions.create(...)
"""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from spectre_shield.client import ShieldClient


def wrap_openai(openai_client, shield: "ShieldClient"):
    """
    Returns a thin proxy around an OpenAI client that:
    1. Inspects the last user message before sending (direction=input)
    2. Inspects the response content before returning (direction=output)

    Supports both sync openai.OpenAI and async openai.AsyncOpenAI clients.
    """
    original_create = openai_client.chat.completions.create

    def patched_create(*args, **kwargs):
        messages = kwargs.get("messages") or (args[1] if len(args) > 1 else [])
        # Inspect the last user message
        user_messages = [m for m in messages if m.get("role") == "user"]
        if user_messages:
            last_user = user_messages[-1].get("content", "")
            if isinstance(last_user, str):
                result = shield.inspect_input(last_user)
                if not result.allowed:
                    from spectre_shield.exceptions import ShieldBlockedError
                    raise ShieldBlockedError(result)
                # Replace content with potentially redacted version
                if result.was_redacted:
                    for msg in reversed(messages):
                        if msg.get("role") == "user" and msg.get("content") == last_user:
                            msg["content"] = result.text
                            break

        response = original_create(*args, **kwargs)

        # Inspect the model's response
        try:
            content = response.choices[0].message.content
            if content:
                out_result = shield.inspect_output(content)
                if out_result.was_redacted:
                    response.choices[0].message.content = out_result.text
        except (IndexError, AttributeError):
            pass

        return response

    openai_client.chat.completions.create = patched_create
    return openai_client
