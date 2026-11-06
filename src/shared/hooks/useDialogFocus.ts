import { useEffect, useRef } from 'react';

export function useDialogFocus(
  ref: React.RefObject<HTMLElement | null>,
  close: () => void,
  enabled = true,
  lockScroll = true,
) {
  const closeRef = useRef(close);
  closeRef.current = close;
  // Capture the opener before React makes its surrounding content inert.
  // The effect retains this render's value until the dialog closes.
  const focusBeforeCommit =
    typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
  useEffect(() => {
    if (!enabled) return;
    const before = focusBeforeCommit,
      root = ref.current;
    const oldOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = 'hidden';
    (
      root?.querySelector<HTMLElement>('[data-dialog-focus]') ??
      root?.querySelector<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select, summary, [tabindex="0"]',
      )
    )?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== 'Tab' || !root) return;
      const items = [
        ...root.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select, summary, [tabindex="0"]',
        ),
      ].filter((el) => el.getClientRects().length > 0);
      const first = items[0],
        last = items[items.length - 1];
      if (!first) return;
      if (
        event.shiftKey &&
        (document.activeElement === first || !items.includes(document.activeElement as HTMLElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !root.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      if (lockScroll) document.body.style.overflow = oldOverflow;
      if (before?.isConnected) before.focus();
    };
  }, [ref, enabled, lockScroll]);
}
