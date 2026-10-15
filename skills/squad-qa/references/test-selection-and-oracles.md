# Test selection

Existing repository runners and patterns win.

Choose the lowest level that can fail for the real reason; add a higher-level journey only when the
integration risk warrants it.

## Selection output

Map risk → boundary → test type → environment → fixture/data → oracle/assertion → failure artifact.
Derive the oracle from the requirement, contract or acceptance criterion, not from what the implementation
currently returns: an expected value read off the code under test passes on the defect. State
why omitted test levels add little confidence or require unavailable infrastructure.
