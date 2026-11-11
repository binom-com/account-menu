// React wrapper of <binom-account-menu>: typed props instead of attributes, and `onSelect` for the select event
// (React 18 passes no custom events to JSX). The element itself is in ./account-menu.js.
import { createElement, forwardRef, useEffect, useRef } from 'react';
import './account-menu.js';

const SELECT_EVENT = 'binom-account-menu-select';
const OPEN_EVENT = 'binom-account-menu-open';
const CLOSE_EVENT = 'binom-account-menu-close';

/** `credits`: a number, `'unlimited'` or `'loading'`; null or undefined hides the row. */
function creditsAttribute(credits) {
  return credits === null || credits === undefined ? undefined : String(credits);
}

/** `badges`: `{ 'switch-account': { count, isMuted, label } }` → `badge-switch-account`, `-muted`, `-label`. */
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

function labelAttributes(labels) {
  const attributes = {};
  for (const [id, text] of Object.entries(labels ?? {})) attributes[`label-${id}`] = text;
  return attributes;
}

/**
 * The Binom account menu for React apps. Extra items are its children: plain `<button>`s or `<a>`s,
 * `slot="start"` for those right after the credits, no slot for those after Settings. `ref` is the element
 * (`open()`, `close()`, `isOpen`).
 */
export const AccountMenu = forwardRef(function AccountMenu({
  user,
  team,
  credits,
  canTopUp,
  accountUrl,
  version,
  hide,
  labels,
  badges,
  size,
  isPhotoBusy,
  onSelect,
  onOpenChange,
  className,
  children,
}, forwardedRef) {
  const ref = useRef(null);
  const handlers = useRef({ onSelect, onOpenChange });
  handlers.current = { onSelect, onOpenChange };

  useEffect(() => {
    const element = ref.current;
    const select = (event) => handlers.current.onSelect?.(event.detail.item, event);
    const opened = () => handlers.current.onOpenChange?.(true);
    const closed = () => handlers.current.onOpenChange?.(false);
    element.addEventListener(SELECT_EVENT, select);
    element.addEventListener(OPEN_EVENT, opened);
    element.addEventListener(CLOSE_EVENT, closed);
    return () => {
      element.removeEventListener(SELECT_EVENT, select);
      element.removeEventListener(OPEN_EVENT, opened);
      element.removeEventListener(CLOSE_EVENT, closed);
    };
  }, []);

  const setRef = (element) => {
    ref.current = element;
    if (typeof forwardedRef === 'function') forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  };

  return createElement(
    'binom-account-menu',
    {
      ref: setRef,
      class: className,
      'user-name': user.name,
      'user-email': user.email ?? undefined,
      'user-photo': user.photoUrl ?? undefined,
      'user-id': user.id ?? undefined,
      'team-name': team?.name ?? undefined,
      'team-logo': team?.logoUrl ?? undefined,
      'team-id': team?.id ?? undefined,
      credits: creditsAttribute(credits),
      'can-top-up': canTopUp ? '' : undefined,
      'account-url': accountUrl ?? undefined,
      version: version ?? undefined,
      hide: hide?.length ? hide.join(' ') : undefined,
      size: size === undefined ? undefined : String(size),
      'photo-busy': isPhotoBusy ? '' : undefined,
      ...labelAttributes(labels),
      ...badgeAttributes(badges),
    },
    children,
  );
});
