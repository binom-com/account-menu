# Changelog

## 0.1.0 — 2026-11-11

First version, built from Chat's header.

- `<binom-account-menu>`, the account menu at the right of the header, has:
  - the profile card: photo with a camera badge, name and email (the team is in the team switcher, a logo that fails to load dropped there);
  - credits: a click opens the team's Billing page for every member (as in Meet), a + for those who may pay, `credits-readonly` for store apps;
  - Manage team, the app's own rows, Settings, Switch account (sign in as another Binom account) and Sign out;
  - the app's own rows in two slots (after the credits; before Settings);
  - the app's version;
  - `badge-<id>` counts.
- `<binom-team-switcher>`, the open team beside the app's name, shows:
  - the user's teams, with their role and unread count, and a ✓ on the open team;
  - the other teams' unread total on its button;
  - **Create team**, which opens Binom Account;
  - a `compact` look for a phone.
- Both elements:
  - build the Binom Account links themselves; the `-select` events can be cancelled, so the app can open those links its own way;
  - turn into a bottom sheet under 800px;
  - support keyboard navigation and fire open and close events;
  - take their look, light and dark, from the `@binom/ui` tokens.
- `@binom/account-menu/react`: the typed `AccountMenu` and `TeamSwitcher` wrappers, with `ref` and `onOpenChange`.
- `docs/INTEGRATION.md`: the full contract and a checklist for adding the menus to an app.
