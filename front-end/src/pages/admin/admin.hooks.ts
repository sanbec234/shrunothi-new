import { useEffect } from "react";

const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const USER_ACTIVITY_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

export function useIdleLogout(idleTimeoutMs: number = DEFAULT_IDLE_TIMEOUT_MS) {
  useEffect(() => {
    if (!localStorage.getItem("authUser")) return;

    let idleTimer = window.setTimeout(() => {
      localStorage.removeItem("authUser");
      window.location.href = "/";
    }, idleTimeoutMs);

    const resetIdleTimer = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        localStorage.removeItem("authUser");
        window.location.href = "/";
      }, idleTimeoutMs);
    };

    USER_ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    return () => {
      window.clearTimeout(idleTimer);
      USER_ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [idleTimeoutMs]);
}

export function useModalBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}

export function useEscapeKey(enabled: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, onEscape]);
}
