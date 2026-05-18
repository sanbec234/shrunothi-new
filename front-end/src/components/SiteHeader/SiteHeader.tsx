import { useCallback, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import SiteNav from "../SiteNav/SiteNav";
import { useSubscription } from "../../hooks/useSubscription";
import { clearGoogleIdToken } from "../../auth/token";

type ScrollHandlers = {
  /** Optional: provide to scroll within the current page instead of linking to /#podcast */
  onPodcastClick?: () => void;
  onMaterialsClick?: () => void;
  onExclusiveClick?: () => void;
};

type Props = ScrollHandlers & {
  /** Called when the user clicks "Sign In". If omitted, navigates to "/" (home opens login). */
  onSignInClick?: () => void;
};

/**
 * Reusable site header — wraps SiteNav and supplies the standard
 * navigation items + auth-aware CTAs (Subscribe / Sign In / Logout).
 *
 * Pages can override scroll behavior for hash links by passing scroll handlers.
 */
export default function SiteHeader({
  onPodcastClick,
  onMaterialsClick,
  onExclusiveClick,
  onSignInClick,
}: Props): JSX.Element {
  const navigate = useNavigate();
  const { isSubscribed: isPaidSubscriber, refresh: refreshSubscription } = useSubscription();
  const [authUser, setAuthUser] = useState(() =>
    JSON.parse(localStorage.getItem("authUser") || "null"),
  );
  const isLoggedIn = Boolean(authUser);

  const handleLogout = useCallback(() => {
    clearGoogleIdToken();
    localStorage.removeItem("authUser");
    setAuthUser(null);
    refreshSubscription();
  }, [refreshSubscription]);

  const handleSubscribeClick = useCallback(() => {
    if (!isLoggedIn) {
      if (onSignInClick) onSignInClick();
      else navigate("/");
      return;
    }
    navigate("/plans");
  }, [isLoggedIn, navigate, onSignInClick]);

  const handleSignInClick = useCallback(() => {
    if (onSignInClick) onSignInClick();
    else navigate("/");
  }, [navigate, onSignInClick]);

  const items = [
    onPodcastClick
      ? { label: "Podcast", onClick: onPodcastClick }
      : { label: "Podcast", href: "/#podcast" },
    onMaterialsClick
      ? { label: "Materials", onClick: onMaterialsClick }
      : { label: "Materials", href: "/#materials" },
    onExclusiveClick
      ? { label: "Exclusive Content", onClick: onExclusiveClick }
      : { label: "Exclusive Content", href: "/#exclusive" },
    { label: "About Us", href: "/about-us" },
  ];

  return (
    <SiteNav
      items={items}
      cta={
        isPaidSubscriber
          ? { label: "Logout", onClick: handleLogout }
          : { label: "Subscribe Now", onClick: handleSubscribeClick }
      }
      secondaryCta={
        isPaidSubscriber
          ? undefined
          : isLoggedIn
            ? { label: "Logout", onClick: handleLogout }
            : { label: "Sign In", onClick: handleSignInClick }
      }
    />
  );
}
