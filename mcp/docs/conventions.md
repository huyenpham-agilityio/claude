# Conventions

## Money
Amounts are whole numbers in the currency's smallest unit (VND by default), so
sums never drift. Format and parse them with the helpers in the client.

## Text
Every visible string is a translation key. Add it to both language files; the
type check fails if Vietnamese is missing a key.

## Errors
The server sends a stable error code plus an English message. The client turns
the code into text in the current language.

## Never
- Use floats for money.
- Show raw server messages to people.
- Query data without the signed-in user's id.
