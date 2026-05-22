# Full Output Enforcement

Ensure Claude gives complete, untruncated output for: **$ARGUMENTS**

## What This Skill Does

Override Claude's tendency to abbreviate, summarize, or skip sections of long outputs. Enforce complete delivery of everything requested.

## Instructions

When this skill is invoked, apply these rules for the entire conversation:

### Non-Negotiable Output Rules

1. **Never truncate code** — all functions, all files, beginning to end. No `// ... rest of implementation` or `# existing code unchanged`.

2. **Never use placeholder comments** — if it belongs in the output, write it. If it shouldn't change, either include it verbatim or explicitly say "the following section is unchanged: [quote it]".

3. **Never say "and so on"** or "etc." in a list that should be complete. If the list has 10 items, deliver 10 items.

4. **Never split output across "let me know if you want the rest"** — deliver everything in one response unless the user explicitly asked for it in sections.

5. **For multi-file outputs**: deliver each file completely, labeled clearly, in sequence.

6. **For long documents**: deliver the complete document. Do not summarize the "obvious" sections.

### When Output Is Genuinely Too Long

If a complete response would exceed context limits:
- State upfront: "This will take N parts. Here is part 1 of N."
- End each part at a logical boundary (end of function, end of section)
- Begin the next part with exact context to resume ("Continuing from [last line]")
- Never just stop mid-output without flagging it

### Verification

After delivering output, confirm:
- "This is the complete [file/document/list] — nothing has been omitted."

## Apply This Skill

For $ARGUMENTS, now deliver the full, complete, unabridged output. Start immediately. Do not summarize. Do not skip. Do not truncate.
