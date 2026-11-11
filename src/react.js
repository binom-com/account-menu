// React wrappers of <binom-account-menu> and <binom-team-switcher>: typed props instead of attributes, and
// `onSelect` / `onOpenChange` for their events (React 18 passes no custom events to JSX). The elements are in
// ./account-menu.js and ./team-switcher.js.
import { createElement, forwardRef, useEffect, useRef } from 'react';
import './account-menu.js';
import './team-switcher.js';

/** The element's ref for the wrapper and the app, and its select/open/close events as callbacks. */
function useElement(prefix, forwardedRef, onSelect, onOpenChange) {
  const ref = useRef(null);
  const handlers = useRef({ onSelect, onOpenChange });
  handlers.current = { onSelect, onOpenChange };

  useEffect(() => {
    const element = ref.current;
    const listeners = {
      [`${prefix}-select`]: (event) => handlers.current.onSelect?.(event.detail, event),
      [`${prefix}-open`]: () => handlers.current.onOpenChange?.(true),
      [`${prefix}-close`]: () => handlers.current.onOpenChange?.(false),
    };
    for (const [name, listener] of Object.entries(listeners)) element.addEventListener(name, listener);
    return () => {
      for (const [name, listener] of Object.entries(listeners)) element.removeEventListener(name, listener);
    };
  }, [prefix]);

  return (element) => {
    ref.current = element;
    if (typeof forwardedRef === 'function') forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  };
}

/** `labels` → `label-<id>` attributes. */
function labelAttributes(labels) {
  const attributes = {};
  for (const [id, text] of Object.entries(labels ?? {})) attributes[`label-${id}`] = text;
  return attributes;
}

/** `badges`: `{ settings: { count, isMuted, label } }` → `badge-settings`, `-muted`, `-label`. */
function badgeAttributes(badges) {
  const attributes = {};
  for (const [id, badge] of Object.entries(badges ?? {})) {
    if (!badge) continue;
    attributes[`badge-${id}`] = String(badge.count);
    if (badge.isMuted) attributes[`badge-${id}-muted`] = '';
    if (badge.label) attributes[`badge-${id}-label`] = badge.label;
  }
  return attributes;
}

const flag = (value) => (value ? '' : undefined);
const hideAttribute = (hide) => (hide?.length ? hide.join(' ') : undefined);

/**
 * The Binom account menu for React apps. Extra rows are its children: plain `<button>`s or `<a>`s,
 * `slot="start"` for those right after the credits, no slot for those before Settings. `ref` is the element
 * (`open()`, `close()`, `isOpen`). `onSelect(item, event)`.
 */
export const AccountMenu = forwardRef(function AccountMenu(
  { user, teamId, credits, canTopUp, isCreditsReadOnly, accountUrl, version, hide, labels, badges, size, isPhotoBusy, onSelect, onOpenChange, className, children },
  forwardedRef,
) {
  const setRef = useElement('binom-account-menu', forwardedRef, (detail, event) => onSelect?.(detail.item, event), onOpenChange);
  return createElement(
    'binom-account-menu',
    {
      ref: setRef,
      class: className,
      'user-name': user.name,
      'user-email': user.email ?? undefined,
      'user-photo': user.photoUrl ?? undefined,
      'user-id': user.id ?? undefined,
      'team-id': teamId ?? undefined,
      credits: credits === null || credits === undefined ? undefined : String(credits),
      'can-top-up': flag(canTopUp),
      'credits-readonly': flag(isCreditsReadOnly),
      'account-url': accountUrl ?? undefined,
      version: version ?? undefined,
      hide: hideAttribute(hide),
      size: size === undefined ? undefined : String(size),
      'photo-busy': flag(isPhotoBusy),
      ...labelAttributes(labels),
      ...badgeAttributes(badges),
    },
    children,
  );
});

/**
 * The Binom team switcher for React apps, beside the app's name. `onSelect(teamId, event)` for a team (null and
 * `event.detail.item === 'manage-team'` for **Manage team**). Extra rows are its children, after the teams.
 */
export const TeamSwitcher = forwardRef(function TeamSwitcher(
  { teams, teamId, accountUrl, hide, labels, isCompact, onSelect, onOpenChange, className, children },
  forwardedRef,
) {
  const setRef = useElement('binom-team-switcher', forwardedRef, (detail, event) => onSelect?.(detail.item === 'team' ? detail.teamId : null, event), onOpenChange);
  return createElement(
    'binom-team-switcher',
    {
      ref: setRef,
      class: className,
      teams: JSON.stringify(teams),
      'team-id': teamId ?? undefined,
      'account-url': accountUrl ?? undefined,
      hide: hideAttribute(hide),
      compact: flag(isCompact),
      ...labelAttributes(labels),
    },
    children,
  );
});
