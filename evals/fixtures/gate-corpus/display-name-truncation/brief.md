# Shorten a display name for a card

`truncate(name, max)` returns the name to print on a card with room for `max`
characters, counted the way a reader counts them.

Acceptance criteria:

- A name that fits is returned unchanged.
- A longer name is shortened to at most `max` characters and ends with a single
  `…`, which counts toward `max`.
- Names are supplied by users anywhere in the world.
