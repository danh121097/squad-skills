# Read and update a stored document

`readDocument` and `updateDocument` operate on documents that belong to one
owner. The actor making the call is passed in; nothing else identifies them.

Acceptance criteria:

- An owner can read and update their own document.
- An actor who does not own the document can neither read nor update it, and
  gets the same refusal in both cases.
- A missing document is refused as not found, whoever asks.
