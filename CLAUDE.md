# Nestling — working agreement

A PWA that compares fetal size, week by week, to seeds, eggs, and birds.

Architecture decisions live in `docs/decisions/`. Read the relevant ADR before
changing anything it governs — images (ADR-003), facts (ADR-004), skins
(ADR-007) all encode constraints that are not obvious from the code.

## Scheduling and background work

Do not schedule check-ins, reminders, or wake-ups for yourself. That includes
`send_later`, `create_trigger`, and any equivalent. If a task needs to be
picked up later, say so at the end of your turn and stop; the user will start
the next session.

Do not subscribe to pull request activity, CI events, or review comments
unless the user asks you to in that session. Opening a PR is not a request to
watch it. Watching one PR is not a standing grant to watch the next.

When the user does ask you to watch something, watch it for what they asked
and stop when that is done. Do not re-arm a check-in on your own judgment
that the work "isn't finished yet."

## Asking before acting

An unanswered question is a no. If you ask whether to do something and the
user's reply does not address it, you did not get permission — carry on with
the work you were already asked to do, and raise the question again only if
it becomes blocking. "Low-cost and reversible" is not a reason to proceed
without an answer; the cost of an unwanted background process is paid in the
user's usage, not yours.

Ask clarifying questions when the answer would change the work. Do not ask
about things you can determine yourself from the repository.

## Verification

Claims about what external services do must be tested the way the app uses
them — a browser, not `curl` or a fetch tool. Non-JS clients get different
responses from bot-challenge systems, and a probe from this container is not
evidence about a user's browser. If you cannot test it properly, say the
question is open rather than recording a conclusion.

When you write a conclusion into an ADR or a doc, record how it was reached,
including reasoning that turned out to be wrong. The next session cannot tell
a lucky guess from a verified finding.

## Prose

Flag any prose you compose for the user's own documents so they can review it
for voice. This file is Claude-authored; edit freely.
