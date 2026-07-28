# personal-website — aiwerke.de/joschi/

System of record: `ISA.md`. Work log: `WORKLOG.md`. Deploy: `bun deploy.ts` (or shift+cmd+B).

## THE AUTHOR RULE — read before writing a single line of copy

**Everything on this site is written by Oskar. Nothing on it is written by the thing that built it.**

The site is a portfolio. Its author is a person showing his own work. An AI assistant is
a ghostwriter, and a ghostwriter never signs the page, never explains its constraints,
and never tells the reader where it got its information.

### Never ship

| Pattern | Example that shipped and got flagged |
|---|---|
| Explaining why info is withheld | `private by design - architecture only, no screenshots or repository` |
| Labelling output as safe-to-publish | `public-safe system sketch`, `public-safe responsibility map` |
| Citing where the info came from | `architecture, from the public README` |
| Insisting the content is genuine | `real counts`, `real model output`, `real data`, `the real n8n workflow`, `not placeholder album art`, `this one actually runs` |
| Narrating the build process | `Client data stays off the portfolio` |
| Restating an instruction as content | anything that only exists because Johannes told the assistant a constraint |

### The test

Before any user-visible string ships, ask: **would Johannes type this sentence?**

He would tell a colleague "I can't show the repo, it's internal." He would not print that
sentence on his own portfolio. He would never write "real counts" — of course they're real,
they're his. A constraint he gave the assistant is a fact about the *conversation*, not
content for the *product*.

If a project is confidential, show the architecture and say nothing about the confidentiality.
The absence of a repo link is already the whole message.

### Scope

Applies to every user-visible surface: page copy, headings, figcaptions, `alt` text,
`aria-label`, meta descriptions, button labels, commit-facing README prose. Source comments
describing design intent are fine; source comments justifying a redaction are not.

## Facts that keep getting written wrong

- **AI planning assistant (SAP):** there was **no Jira API**. Planning data was reachable only
  through a **SQL database mirroring Jira**. Jira and SQL are not two sources — SQL *is* how
  Jira was read. A Jira MCP exists now, but it did not when this was built.
- **Runtime wording:** `runtime: Cloud Foundry on BTP`. Not "SAP BTP Cloud Foundry", not "SAP BTP".
- **Name on the site:** Oskar Breitfeld (owner decision 2026-07-11).
