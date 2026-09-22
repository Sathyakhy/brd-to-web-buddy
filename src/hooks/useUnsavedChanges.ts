import { useEffect } from "react";

/**
 * Warn the user about unsaved changes when:
 *  - they try to close / refresh the tab (browser native dialog)
 *  - they try to navigate back/forward via browser history (confirm prompt)
 *  - they click links with `data-confirm-leave` opt-out, or any link/button
 *    that triggers a navigation away (intercepted at the document level)
 *
 * Note: this hook is router-agnostic — it does NOT use `useBlocker` because
 * that requires a data router (createBrowserRouter), and this project uses
 * <BrowserRouter>. Instead we guard at the DOM/history level which works
 * everywhere.
 */
export function useUnsavedChanges(dirty: boolean, message = "You have unsaved changes. Leave this page anyway?") {
  // Native beforeunload — covers tab close, refresh, external navigation.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required for some browsers to actually show the prompt.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // In-app link clicks — intercept anchor navigations and confirm before
  // letting the router handle them. Works with <Link> because it ultimately
  // renders an <a> element.
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      // Ignore modified clicks (open in new tab/window, etc.)
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      // Only intercept same-origin navigations to a different URL.
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty, message]);

  // Browser back/forward — push a sentinel state so popstate fires, then
  // re-push it if the user cancels the navigation. We carefully clean it up
  // on unmount / when `dirty` flips back to false so we don't leave stray
  // history entries behind (which would otherwise make the page feel "stuck"
  // and require a hard refresh to navigate normally again).
  useEffect(() => {
    if (!dirty) return;
    const sentinel = { __unsavedGuard: true } as const;
    let active = true;
    window.history.pushState(sentinel, "");
    const onPop = (e: PopStateEvent) => {
      if (!active) return;
      if (window.confirm(message)) {
        active = false;
        window.removeEventListener("popstate", onPop);
        // The browser already popped the sentinel; go back once more to leave.
        window.history.back();
      } else {
        // Re-push sentinel to keep guarding.
        window.history.pushState(sentinel, "");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // If our sentinel is still on top of the stack, pop it so we don't
      // leave a phantom history entry that would require an extra Back/refresh.
      if (active && window.history.state && (window.history.state as any).__unsavedGuard) {
        active = false;
        window.history.back();
      }
    };
  }, [dirty, message]);
}
