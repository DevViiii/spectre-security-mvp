"""
Spectre Security detection rule library.
Rules are pure data — no logic, no imports from other modules.
Adding a new rule = adding one Rule(...) to the appropriate list.

Total rules in v1: 67
  secrets:    18
  injection:  16
  leak:       13
  jailbreak:  12
  heuristic:   8
"""
from app.shield.dlp.detection.base import Rule

# ── Secrets ────────────────────────────────────────────────────────────────
# Detects credentials, API keys, and tokens that should never appear
# in LLM prompts or responses.

SECRET_RULES: list[Rule] = [
    Rule(
        id="sec_openai_key",
        category="secret", severity="critical",
        name="OpenAI API key",
        description="OpenAI secret key (sk-...)",
        pattern=r"sk-[A-Za-z0-9]{20,}",
        applies_to="both",
    ),
    Rule(
        id="sec_anthropic_key",
        category="secret", severity="critical",
        name="Anthropic API key",
        description="Anthropic secret key (sk-ant-...)",
        pattern=r"sk-ant-[A-Za-z0-9\-]{20,}",
        applies_to="both",
    ),
    Rule(
        id="sec_aws_access_key",
        category="secret", severity="critical",
        name="AWS access key ID",
        description="20-character uppercase alphanumeric AWS access key",
        pattern=r"(?<![A-Z0-9])(AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}(?![A-Z0-9])",
        applies_to="both",
    ),
    Rule(
        id="sec_aws_secret",
        category="secret", severity="critical",
        name="AWS secret access key",
        description="40-character base64-like AWS secret",
        pattern=r"(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])",
        applies_to="both",
    ),
    Rule(
        id="sec_github_pat",
        category="secret", severity="critical",
        name="GitHub personal access token",
        description="GitHub PAT (ghp_...)",
        pattern=r"ghp_[A-Za-z0-9]{36}",
        applies_to="both",
    ),
    Rule(
        id="sec_github_oauth",
        category="secret", severity="critical",
        name="GitHub OAuth token",
        description="GitHub OAuth token (gho_...)",
        pattern=r"gho_[A-Za-z0-9]{36}",
        applies_to="both",
    ),
    Rule(
        id="sec_slack_token",
        category="secret", severity="high",
        name="Slack API token",
        description="Slack bot or user token (xox...)",
        pattern=r"xox[baprs]-[A-Za-z0-9\-]{10,}",
        applies_to="both",
    ),
    Rule(
        id="sec_stripe_key",
        category="secret", severity="critical",
        name="Stripe secret key",
        description="Stripe live or test secret key",
        pattern=r"sk_(live|test)_[A-Za-z0-9]{24,}",
        applies_to="both",
    ),
    Rule(
        id="sec_jwt",
        category="secret", severity="high",
        name="JWT token",
        description="JSON Web Token (three base64 segments separated by dots)",
        pattern=r"eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+",
        applies_to="both",
    ),
    Rule(
        id="sec_bearer",
        category="secret", severity="high",
        name="Bearer token",
        description="HTTP Authorization Bearer token",
        pattern=r"Bearer\s+[A-Za-z0-9\-._~+/]+=*",
        applies_to="both",
    ),
    Rule(
        id="sec_private_key_header",
        category="secret", severity="critical",
        name="Private key block",
        description="PEM private key header",
        pattern=r"-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
        applies_to="both",
    ),
    Rule(
        id="sec_password_assignment",
        category="secret", severity="high",
        name="Password assignment",
        description="password= or passwd= followed by a value",
        pattern=r'(?i)(password|passwd|pwd)\s*[=:]\s*["\']?[^\s"\']{6,}',
        applies_to="both",
    ),
    Rule(
        id="sec_api_key_assignment",
        category="secret", severity="high",
        name="API key assignment",
        description="api_key= or apikey= followed by a value",
        pattern=r'(?i)(api_key|apikey|api-key)\s*[=:]\s*["\']?[A-Za-z0-9\-_]{8,}',
        applies_to="both",
    ),
    Rule(
        id="sec_secret_assignment",
        category="secret", severity="high",
        name="Secret assignment",
        description="secret= followed by a value",
        pattern=r'(?i)(secret|secret_key)\s*[=:]\s*["\']?[A-Za-z0-9\-_]{8,}',
        applies_to="both",
    ),
    Rule(
        id="sec_database_url",
        category="secret", severity="critical",
        name="Database connection string",
        description="Connection URL with embedded credentials",
        pattern=r"(postgres|postgresql|mysql|mongodb|redis)://[^:]+:[^@]+@",
        applies_to="both",
    ),
    Rule(
        id="sec_ssn",
        category="secret", severity="critical",
        name="US Social Security Number",
        description="SSN in XXX-XX-XXXX format",
        pattern=r"\b\d{3}-\d{2}-\d{4}\b",
        applies_to="both",
    ),
    Rule(
        id="sec_credit_card",
        category="secret", severity="critical",
        name="Credit card number",
        description="Major credit card number (Visa, MC, Amex, Discover)",
        pattern=r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b",
        applies_to="both",
    ),
    Rule(
        id="sec_email",
        category="secret", severity="medium",
        name="Email address",
        description="Email address pattern",
        pattern=r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",
        applies_to="both",
    ),
]

# ── Prompt injection ────────────────────────────────────────────────────────
# Detects attempts to override or hijack the system prompt.

INJECTION_RULES: list[Rule] = [
    Rule(
        id="inj_ignore_previous",
        category="injection", severity="critical",
        name="Ignore previous instructions",
        description="Classic direct override attempt",
        pattern=r"(?i)ignore\s+(all\s+)?(previous|prior|above|preceding)\s+(instructions?|prompts?|rules?|context|directives?)",
        applies_to="input",
    ),
    Rule(
        id="inj_disregard",
        category="injection", severity="critical",
        name="Disregard instructions",
        description="Instruction cancellation attempt",
        pattern=r"(?i)disregard\s+(your\s+)?(previous|prior|all|any|the)\s+(instructions?|prompts?|rules?|training|guidelines?)",
        applies_to="input",
    ),
    Rule(
        id="inj_forget_instructions",
        category="injection", severity="critical",
        name="Forget instructions",
        description="Instruction erasure command",
        pattern=r"(?i)forget\s+(everything|all|your|the\s+previous|prior)\s*(instructions?|you.ve\s+been\s+told|context)?",
        applies_to="input",
    ),
    Rule(
        id="inj_new_instructions",
        category="injection", severity="critical",
        name="New instructions override",
        description="Attempt to inject replacement instructions",
        pattern=r"(?i)(your\s+new\s+instructions?\s+(are|is)|new\s+instructions?\s+follow|following\s+are\s+your\s+(new\s+)?instructions?)",
        applies_to="input",
    ),
    Rule(
        id="inj_you_are_now",
        category="injection", severity="high",
        name="Identity reassignment",
        description="Attempts to reassign the model's identity",
        pattern=r"(?i)(you\s+are\s+now|from\s+now\s+on\s+you\s+are|starting\s+now\s+you\s+are)\s+\w",
        applies_to="input",
    ),
    Rule(
        id="inj_pretend",
        category="injection", severity="high",
        name="Pretend to be",
        description="Persona-swap via pretend framing",
        pattern=r"(?i)pretend\s+(you\s+are|to\s+be|that\s+you.re)\s+\w",
        applies_to="input",
    ),
    Rule(
        id="inj_act_as",
        category="injection", severity="high",
        name="Act as",
        description="Role-switch via act-as framing",
        pattern=r"(?i)act\s+as\s+(if\s+you\s+are|an?\s+|a\s+)?(?!a\s+helpful|an\s+assistant)",
        applies_to="input",
    ),
    Rule(
        id="inj_override_mode",
        category="injection", severity="critical",
        name="Override mode activation",
        description="Explicit mode-switching attempt",
        pattern=r"(?i)(override\s+mode|developer\s+mode\s+(enabled|on|activated)|admin\s+mode|god\s+mode|unrestricted\s+mode)",
        applies_to="input",
    ),
    Rule(
        id="inj_system_message",
        category="injection", severity="high",
        name="Injected system tag",
        description="Attempts to inject a fake system message",
        pattern=r"(?i)(<\s*system\s*>|\[system\]|system\s*:|##\s*system)",
        applies_to="input",
    ),
    Rule(
        id="inj_end_of_prompt",
        category="injection", severity="high",
        name="End-of-prompt injection marker",
        description="Attempts to signal end of legitimate prompt",
        pattern=r"(?i)(end\s+of\s+(prompt|instructions?|system\s+prompt)|---+\s*(instructions?\s+end|system\s+end))",
        applies_to="input",
    ),
    Rule(
        id="inj_translate_ignore",
        category="injection", severity="high",
        name="Translate and ignore",
        description="Multilingual injection — translate then override",
        pattern=r"(?i)(translate\s+the\s+following.{0,50}ignore|if\s+asked\s+to\s+translate.{0,50}instead)",
        applies_to="input",
    ),
    Rule(
        id="inj_task_complete",
        category="injection", severity="medium",
        name="Fake task completion signal",
        description="Claims task is done to trigger next hidden instruction",
        pattern=r"(?i)(task\s+completed?\.?\s*new\s+task|previous\s+task\s+(is\s+)?done\.?\s*now)",
        applies_to="input",
    ),
    Rule(
        id="inj_inject_keyword",
        category="injection", severity="medium",
        name="Explicit injection keyword",
        description="Text contains the word 'injection' in a suspicious context",
        pattern=r"(?i)(prompt\s+injection|inject\s+(this|the\s+following|payload|command))",
        applies_to="input",
    ),
    Rule(
        id="inj_context_switch",
        category="injection", severity="high",
        name="Context window manipulation",
        description="Attempts to manipulate the context window boundary",
        pattern=r"(?i)(context\s+window\s+(end|boundary|limit)|end\s+of\s+context|start\s+of\s+new\s+context)",
        applies_to="input",
    ),
    Rule(
        id="inj_sudo",
        category="injection", severity="high",
        name="Sudo / root escalation",
        description="Attempts privilege escalation via sudo framing",
        pattern=r"(?i)(sudo\s+|as\s+root\s+|with\s+elevated\s+privileges?\s+)(ignore|bypass|disable|remove)",
        applies_to="input",
    ),
    Rule(
        id="inj_base64_payload",
        category="injection", severity="medium",
        name="Base64-encoded payload",
        description="Suspiciously long base64 string in a prompt context",
        pattern=r"(?i)(decode\s+(this|the\s+following)\s*:?\s*|base64\s*:?\s*)[A-Za-z0-9+/]{40,}={0,2}",
        applies_to="input",
    ),
]

# ── Prompt leak ─────────────────────────────────────────────────────────────
# Detects attempts to extract the system prompt or hidden instructions.

LEAK_RULES: list[Rule] = [
    Rule(
        id="leak_reveal_system",
        category="leak", severity="critical",
        name="Reveal system prompt",
        description="Direct request to reveal the system prompt",
        pattern=r"(?i)(reveal|show|tell\s+me|output|print|display|repeat|give\s+me)\s+(your\s+)?(system\s+prompt|initial\s+prompt|original\s+prompt)",
        applies_to="input",
    ),
    Rule(
        id="leak_print_instructions",
        category="leak", severity="critical",
        name="Print instructions",
        description="Requests to print or output hidden instructions",
        pattern=r"(?i)(print|output|display|repeat|echo)\s+(your\s+)?(hidden\s+)?(instructions?|rules?|guidelines?|directives?|configuration)",
        applies_to="input",
    ),
    Rule(
        id="leak_what_are_rules",
        category="leak", severity="high",
        name="What are your rules",
        description="Direct query about operational rules",
        pattern=r"(?i)what\s+are\s+(your\s+)?(rules|instructions?|guidelines?|restrictions?|limitations?|constraints?)",
        applies_to="input",
    ),
    Rule(
        id="leak_how_programmed",
        category="leak", severity="high",
        name="How were you programmed",
        description="Attempts to probe training/programming details",
        pattern=r"(?i)(how\s+(were|are)\s+you\s+(programmed|trained|configured|instructed)|what\s+(were|are)\s+you\s+(told|instructed|configured)\s+to)",
        applies_to="input",
    ),
    Rule(
        id="leak_beginning_of_conversation",
        category="leak", severity="critical",
        name="Repeat conversation start",
        description="Asks to repeat the start of context to extract system prompt",
        pattern=r"(?i)(repeat|output|print|show)\s+(everything|all|the\s+text)?\s*(from\s+the\s+)?(beginning|start)\s+(of\s+)?(this\s+)?(conversation|chat|session|context)",
        applies_to="input",
    ),
    Rule(
        id="leak_initial_message",
        category="leak", severity="critical",
        name="Output initial message",
        description="Requests the initial/first message in context",
        pattern=r"(?i)(output|print|repeat|show|tell\s+me)\s+(your\s+)?(first|initial|opening|original)\s+message",
        applies_to="input",
    ),
    Rule(
        id="leak_verbatim",
        category="leak", severity="critical",
        name="Verbatim repetition request",
        description="Requests verbatim content from earlier in context",
        pattern=r"(?i)(repeat|output|print)\s+(verbatim|word\s+for\s+word|exactly)\s+(what|everything)",
        applies_to="input",
    ),
    Rule(
        id="leak_translate_prompt",
        category="leak", severity="high",
        name="Translate system prompt",
        description="Asks to translate the system prompt as a bypass",
        pattern=r"(?i)translate\s+(your\s+)?(system\s+prompt|instructions?|rules?)\s+(to|into)\s+\w+",
        applies_to="input",
    ),
    Rule(
        id="leak_summarise_prompt",
        category="leak", severity="high",
        name="Summarise instructions",
        description="Asks to summarise operational instructions",
        pattern=r"(?i)(summarize?|summarise?)\s+(your\s+)?(system\s+)?(prompt|instructions?|rules?|guidelines?)",
        applies_to="input",
    ),
    Rule(
        id="leak_detected_in_output",
        category="leak", severity="critical",
        name="System prompt content in output",
        description="Model response appears to contain system prompt markers",
        pattern=r"(?i)(you\s+are\s+a\s+helpful|your\s+role\s+is\s+to|you\s+must\s+always|you\s+should\s+never|as\s+an?\s+AI\s+(assistant|language\s+model),.{0,100}(do\s+not|never|always|must))",
        applies_to="output",
    ),
    Rule(
        id="leak_hidden_instructions",
        category="leak", severity="high",
        name="Hidden instructions query",
        description="Queries about hidden or secret instructions",
        pattern=r"(?i)(hidden|secret|confidential)\s+(instructions?|rules?|prompt|guidelines?|configuration)",
        applies_to="input",
    ),
    Rule(
        id="leak_your_configuration",
        category="leak", severity="high",
        name="Configuration extraction",
        description="Attempts to extract configuration details",
        pattern=r"(?i)(output|show|tell|reveal)\s+(your\s+)?(configuration|config|setup|settings|parameters?)",
        applies_to="input",
    ),
    Rule(
        id="leak_training_data",
        category="leak", severity="medium",
        name="Training data extraction",
        description="Attempts to extract training examples",
        pattern=r"(?i)(give|show|output|repeat)\s+(me\s+)?(examples?\s+from|samples?\s+from|data\s+from)\s+(your\s+)?(training|dataset)",
        applies_to="input",
    ),
]

# ── Jailbreak ───────────────────────────────────────────────────────────────
# Known jailbreak phrases and persona-switching attacks.

JAILBREAK_RULES: list[Rule] = [
    Rule(
        id="jb_dan",
        category="jailbreak", severity="critical",
        name="DAN jailbreak",
        description="Do Anything Now persona switch",
        pattern=r"(?i)(\[DAN\]|do\s+anything\s+now|DAN\s+mode)",
        applies_to="input",
    ),
    Rule(
        id="jb_developer_mode",
        category="jailbreak", severity="critical",
        name="Developer mode activation",
        description="Developer mode jailbreak pattern",
        pattern=r"(?i)(developer\s+mode\s+(enabled|activated|on)|enable\s+developer\s+mode)",
        applies_to="input",
    ),
    Rule(
        id="jb_no_restrictions",
        category="jailbreak", severity="critical",
        name="No restrictions",
        description="Explicitly requests unrestricted operation",
        pattern=r"(?i)(without\s+(any\s+)?(restrictions?|limitations?|filters?|censorship|safety\s+guidelines?)|no\s+(restrictions?|limitations?|filters?|censorship))",
        applies_to="input",
    ),
    Rule(
        id="jb_bypass_filters",
        category="jailbreak", severity="critical",
        name="Bypass safety filters",
        description="Explicit request to bypass safety systems",
        pattern=r"(?i)(bypass\s+(your\s+)?(safety|content|ethical)\s+(filters?|guidelines?|rules?|checks?)|disable\s+(your\s+)?(safety|content|ethical)\s+(filters?|guidelines?))",
        applies_to="input",
    ),
    Rule(
        id="jb_fictional_framing",
        category="jailbreak", severity="high",
        name="Fictional framing bypass",
        description="Uses fiction to bypass safety guidelines",
        pattern=r"(?i)(in\s+this\s+fictional\s+world|for\s+a\s+story\s+i.m\s+writing|hypothetically\s+speaking.{0,30}(no\s+restrictions?|without\s+limits?))",
        applies_to="input",
    ),
    Rule(
        id="jb_roleplay_bypass",
        category="jailbreak", severity="high",
        name="Roleplay bypass",
        description="Uses roleplay to extract restricted content",
        pattern=r"(?i)(roleplay\s+as|play\s+the\s+role\s+of|you.re\s+playing).{0,60}(no\s+rules?|no\s+restrictions?|without\s+limits?|unrestricted)",
        applies_to="input",
    ),
    Rule(
        id="jb_opposite_day",
        category="jailbreak", severity="high",
        name="Opposite day / reverse",
        description="Reverse psychology jailbreak",
        pattern=r"(?i)(opposite\s+day|everything\s+is\s+(reversed?|opposite)|do\s+the\s+opposite\s+of\s+what)",
        applies_to="input",
    ),
    Rule(
        id="jb_grandma_exploit",
        category="jailbreak", severity="medium",
        name="Emotional manipulation exploit",
        description="Uses emotional framing to bypass safety",
        pattern=r"(?i)(my\s+(dying|sick|late)\s+(grandmother|grandma|grandpa|grandfather).{0,100}(tell|show|explain|describe))",
        applies_to="input",
    ),
    Rule(
        id="jb_research_framing",
        category="jailbreak", severity="medium",
        name="Research framing bypass",
        description="Uses research context to request restricted content",
        pattern=r"(?i)(for\s+research\s+purposes?.{0,50}(how\s+to|steps?\s+to|instructions?\s+for).{0,50}(illegal|harmful|dangerous|weapo))",
        applies_to="input",
    ),
    Rule(
        id="jb_token_manipulation",
        category="jailbreak", severity="high",
        name="Token manipulation",
        description="Character substitution to evade keyword detection",
        pattern=r"(?i)(1gnore|d1sregard|f0rget|pr0mpt|syst3m|instr[u0][c\(]t[i1]ons?)",
        applies_to="input",
    ),
    Rule(
        id="jb_many_shot",
        category="jailbreak", severity="medium",
        name="Many-shot jailbreak pattern",
        description="Repeated Q&A pattern designed to establish precedent",
        pattern=r"(?i)(Q:\s*.+\nA:\s*.+\n){3,}",
        applies_to="input",
    ),
    Rule(
        id="jb_jail_confirmed",
        category="jailbreak", severity="critical",
        name="Jailbreak success confirmation",
        description="Model output confirms jailbreak succeeded",
        pattern=r"(?i)(jailbreak\s+(successful|activated|enabled|confirmed)|i\s+am\s+now\s+(jailbroken|unrestricted|freed))",
        applies_to="output",
    ),
]

# ── Heuristics ──────────────────────────────────────────────────────────────
# Pattern-based signals that don't match a single phrase.
# These fire on structural properties of the text rather than exact matches.
# Implemented as special-case logic in HeuristicMatcher; patterns here are
# used for display and logging only.

HEURISTIC_RULES: list[Rule] = [
    Rule(
        id="heur_instruction_density",
        category="heuristic", severity="medium",
        name="High instruction density",
        description="Unusually high density of imperative verbs suggesting injection attempt",
        pattern=r"__heuristic_instruction_density__",
        applies_to="input",
    ),
    Rule(
        id="heur_role_switch_framing",
        category="heuristic", severity="high",
        name="Role-switch framing",
        description="'From now on' or 'starting now' followed by identity statement",
        pattern=r"(?i)(from\s+now\s+on|starting\s+now|henceforth|going\s+forward)\s*,?\s*(you\s+(are|will|must|should)|your\s+(role|job|purpose|goal)\s+is)",
        applies_to="input",
    ),
    Rule(
        id="heur_excessive_repetition",
        category="heuristic", severity="medium",
        name="Excessive phrase repetition",
        description="Same phrase repeated 3+ times — repetition attack to override context",
        pattern=r"__heuristic_repetition__",
        applies_to="input",
    ),
    Rule(
        id="heur_long_base64",
        category="heuristic", severity="medium",
        name="Suspicious long encoded string",
        description="Long base64-like string not associated with a decode command",
        pattern=r"[A-Za-z0-9+/]{80,}={0,2}",
        applies_to="input",
    ),
    Rule(
        id="heur_prompt_in_prompt",
        category="heuristic", severity="high",
        name="Nested prompt structure",
        description="Text contains a structure that looks like an embedded prompt",
        pattern=r"(?i)(human:|user:|assistant:|ai:)\s*.{20,}\n.*(human:|user:|assistant:|ai:)\s*",
        applies_to="input",
    ),
    Rule(
        id="heur_xml_injection",
        category="heuristic", severity="medium",
        name="XML/HTML tag injection",
        description="Suspicious XML or HTML tags in a natural language context",
        pattern=r"<(prompt|system|instruction|rule|context|override|inject)[^>]*>",
        applies_to="input",
    ),
    Rule(
        id="heur_invisible_text",
        category="heuristic", severity="high",
        name="Zero-width character injection",
        description="Zero-width or invisible Unicode characters suggesting steganographic injection",
        pattern=r"[\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]",
        applies_to="input",
    ),
    Rule(
        id="heur_secret_in_output",
        category="heuristic", severity="high",
        name="Credential-like pattern in output",
        description="Output contains a string that looks like a credential or key",
        pattern=r"__heuristic_secret_in_output__",
        applies_to="output",
    ),
]

# ── Master registry ─────────────────────────────────────────────────────────

ALL_RULES: list[Rule] = (
    SECRET_RULES
    + INJECTION_RULES
    + LEAK_RULES
    + JAILBREAK_RULES
    + HEURISTIC_RULES
)

RULES_BY_ID: dict[str, Rule] = {r.id: r for r in ALL_RULES}
