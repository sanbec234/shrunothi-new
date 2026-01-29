import { useEffect } from "react";

/**
 * Auto logout after 5 minutes of inactivity
 */
export function useIdleLogout() {
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const IDLE_LIMIT = 5 * 60 * 1000; // 5 minutes

    const logout = () => {
      localStorage.removeItem("authUser");
      window.location.href = "/";
    };

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(logout, IDLE_LIMIT);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, []);
}

/**
 * Lock body scroll when modal is open
 */
export function useModalBodyLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);
}

/**
 * Close modal on Escape key
 */
export function useEscapeKey(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
}