import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';
import type {
  AccountMenuItem,
  AccountMenuLabel,
  AccountMenuSelectEvent,
  BinomAccountMenuElement,
  BinomTeamSwitcherElement,
  TeamSwitcherLabel,
  TeamSwitcherSelectEvent,
  TeamSwitcherTeam,
} from './index.js';

export type * from './index.js';

export interface AccountMenuProps {
  user: { name: string; email?: string | null; photoUrl?: string | null; id?: string | null };
  /** The open team's id: builds the Billing and Manage team links; without it there is no Manage team. */
  teamId?: string | null;
  /** The team's balance, `'unlimited'`, or `'loading'` (a spinner); null or undefined hides the row. */
  credits?: number | 'unlimited' | 'loading' | null;
  /** The owner, admins and billing members on a team that is not unlimited: a + at the end of the credits row. */
  canTopUp?: boolean;
  /** The credits row only shows the balance, no click (e.g. an Android app: Google Play allows no other payments). */
  isCreditsReadOnly?: boolean;
  /** Binom Account's address, e.g. `https://account.binom.com`. */
  accountUrl?: string | null;
  version?: string | null;
  hide?: AccountMenuItem[];
  labels?: Partial<Record<AccountMenuLabel, string>>;
  /** A count after a built-in row's label. */
  badges?: Partial<Record<'manage-team' | 'settings', { count: number; isMuted?: boolean; label?: string } | null>>;
  /** The avatar's size in the header, px (default 32). */
  size?: number;
  /** A new photo is being uploaded: the photo is disabled. */
  isPhotoBusy?: boolean;
  /** Call `event.preventDefault()` to open a Binom Account page your own way (a new tab, the system browser). */
  onSelect?(item: AccountMenuItem, event: AccountMenuSelectEvent): void;
  /** The menu opened (true) or closed (false), e.g. to let the system Back close it on a phone. */
  onOpenChange?(isOpen: boolean): void;
  className?: string;
  /** Your own rows: `<button>` or `<a>`; `slot="start"` puts one after the credits, otherwise before Settings. */
  children?: ReactNode;
}

export const AccountMenu: ForwardRefExoticComponent<AccountMenuProps & RefAttributes<BinomAccountMenuElement>>;

export interface TeamSwitcherProps {
  /** Every team of the user, in the order to list them. */
  teams: TeamSwitcherTeam[];
  /** The open team. */
  teamId?: string | null;
  /** Binom Account's address: **Create team** opens its home. */
  accountUrl?: string | null;
  hide?: Array<'create'>;
  labels?: Partial<Record<TeamSwitcherLabel, string>>;
  /** A phone's header: only the team's mark and ⇕ on the button (`compact`). */
  isCompact?: boolean;
  /** A team was chosen (`teamId`), or **Create team** (`null`; `event.preventDefault()` to open it your own way). */
  onSelect?(teamId: string | null, event: TeamSwitcherSelectEvent): void;
  onOpenChange?(isOpen: boolean): void;
  className?: string;
  /** Your own rows after the teams: `<button>` or `<a>`. */
  children?: ReactNode;
}

export const TeamSwitcher: ForwardRefExoticComponent<TeamSwitcherProps & RefAttributes<BinomTeamSwitcherElement>>;
