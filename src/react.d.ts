import type { ReactNode } from 'react';
import type { AccountMenuItem, AccountMenuLabel, AccountMenuSelectEvent } from './account-menu.js';

export type { AccountMenuItem, AccountMenuLabel, AccountMenuSelectEvent } from './account-menu.js';

export interface AccountMenuProps {
  user: { name: string; email?: string | null; photoUrl?: string | null; id?: string | null };
  /** The open team; `id` builds the Billing and Manage team links to Binom Account. */
  team?: { name: string; id?: string | null; logoUrl?: string | null } | null;
  /** The team's balance, `'unlimited'`, or `'loading'` (a spinner); null or undefined hides the row. */
  credits?: number | 'unlimited' | 'loading' | null;
  /** The owner, admins and billing members: the credits row opens Billing. */
  canTopUp?: boolean;
  /** Binom Account's address, e.g. `https://account.binom.com`. */
  accountUrl?: string | null;
  version?: string | null;
  hide?: AccountMenuItem[];
  labels?: Partial<Record<AccountMenuLabel, string>>;
  /** A count after a built-in row's label, e.g. unread messages of other teams on Switch account. */
  badges?: Partial<Record<'manage-team' | 'settings' | 'switch-account', { count: number; isMuted?: boolean; label?: string } | null>>;
  /** The avatar's size in the header, px (default 32). */
  size?: number;
  /** A new photo is being uploaded: the photo is disabled. */
  isPhotoBusy?: boolean;
  /** Call `event.preventDefault()` to open a Binom Account page your own way (a new tab, the system browser). */
  onSelect?(item: AccountMenuItem, event: AccountMenuSelectEvent): void;
  className?: string;
  /** Your own items: `<button>` or `<a>`; `slot="start"` puts one after the credits, otherwise after Settings. */
  children?: ReactNode;
}

export function AccountMenu(props: AccountMenuProps): ReactNode;
