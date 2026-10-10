/**
 * Full-page navigation, used only when the session changes (sign-in, sign-out, expired session).
 * A client-side push could reuse a cached prefetch that proxy.ts produced for the *previous*
 * session (e.g. a redirect to /login), and router.refresh() only clears the current route.
 */
export function navigateWithNewSession(path: string): void {
  window.location.assign(path);
}
