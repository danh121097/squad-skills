# Charge once for a payment webhook

`handleWebhook(store, eventId, amount)` processes one delivery of a payment
event. The provider retries any delivery it did not get a clean response to, so
the same `eventId` reaches this handler more than once.

`store` offers:

- `hasProcessed(eventId)` — whether this event is already recorded.
- `markProcessed(eventId)` — record it.
- `claim(eventId)` — record it and return whether this caller is the one that
  recorded it. Exactly one caller wins, whatever else is in flight.
- `charge(amount)` — move the money.

Acceptance criteria:

- A first delivery charges the amount.
- Two different events each charge.
- An account is charged once per event, however the provider delivers it.
