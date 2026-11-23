---
status: superseded by ADR-0033
date: 2025-04-19
---
# Turn the knowledge-base Q&A command-line app into a syllabus generator

## Context and Problem Statement
The first code (from 2025-03-27, d374bbb) was a Python command-line Q&A loop. Answers came from a hand-written knowledge-base dictionary (0e3e590, 7c4e32a), a similarity check caught typos in the question (0ec17cb, 433071e; Jaccard, per `a9157c2:readme.md:16`), and a local LLM was called through the Ollama API (e3e3fd0, 46aac92). The question was what the program should produce for the user.

## Considered Options
* Keep the Q&A loop over the knowledge base, with the LLM as a fallback
* Generate a syllabus from the user's own information

## Decision Outcome
Chosen option: "Generate a syllabus from the user's own information". Syllabus generation became its own module on 2025-04-19 (f570ad4), driven by questions to the user and an LLM prompt built from the answers (0ceb56c, 38533e1, 3e7d8cf). The Q&A version was kept on the branch `v.01_q&a_(frozen-branch)` in `alitahir6001/pocket_professor`, and the command-line code was moved out of the main app into `snippets.py` on 2025-06-15 (b03ff20, 2459e14). The reason is not recorded. A README TODO from 2025-06-16 still planned a polished version of the Q&A loop (`a9157c2:readme.md:16`), so it was set aside rather than rejected (inferred from that TODO).

### Consequences
* Good, because it gave the web prototype its one feature, the `/generate-curriculum` endpoint ([ADR-0001](0001-prototype-local-llm-ollama-behind-fastapi.md); 6955414).
* Bad, because the knowledge base and typo check were never brought back; they were deleted with the rest of the v1 code on 2026-04-05 (08602c6).

## More Information
Evidence: d374bbb, 0e3e590, 7c4e32a, 0ec17cb, 433071e, e3e3fd0, 46aac92, f570ad4, 0ceb56c, 38533e1, 3e7d8cf, 55d6a2a (head of the frozen branch), b03ff20, 2459e14, `a9157c2:readme.md:16`, 08602c6. Every commit cited is also in this repo ([ADR-0041](0041-continue-in-pock-prof-playground.md)). Followed by [ADR-0001](0001-prototype-local-llm-ollama-behind-fastapi.md), the web prototype of the same generator. Superseded by [ADR-0033](0033-rebuild-v2-from-behavioral-spec-in-phases.md).
