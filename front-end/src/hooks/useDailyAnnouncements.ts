import { useEffect, useState } from "react";
import { api } from "../api/client";

type Announcement = {
  id: string;
  title: string;
  imageUrl: string;
};

const STORAGE_KEY = "last_announcement_view";

/**
 * Check if announcements should be shown today
 * Returns true if user hasn't seen announcements today
 */
function shouldShowToday(): boolean {
  
  try {
    const lastView = localStorage.getItem(STORAGE_KEY);
    
    if (!lastView) {
      return true;
    }
    
    const lastViewDate = new Date(lastView);
    const today = new Date();
    
    
    
    // Check if last view was on a different day
    const shouldShow = (
      lastViewDate.getDate() !== today.getDate() ||
      lastViewDate.getMonth() !== today.getMonth() ||
      lastViewDate.getFullYear() !== today.getFullYear()
    );
    
    return shouldShow;
  } catch (e) {
    return true; // Show on error to be safe
  }
}

/**
 * Mark announcements as viewed today
 */
function markAsViewedToday(): void {
  try {
    const timestamp = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, timestamp);
  } catch (e) {
    console.error('❌ Error marking announcements as viewed:', e);
  }
}

/**
 * Validate announcement data
 */
function isValidAnnouncement(a: any): a is Announcement {
  const isValid = (
    a &&
    typeof a.id === 'string' &&
    typeof a.title === 'string' &&
    typeof a.imageUrl === 'string' &&
    (a.imageUrl.startsWith('https://') || a.imageUrl.startsWith('http://'))
  );
  
  if (!isValid) {
    console.warn("⚠️ Invalid announcement data:", a);
  }
  
  return isValid;
}

function extractAnnouncements(raw: unknown): Announcement[] {
  if (Array.isArray(raw)) {
    return raw.filter(isValidAnnouncement);
  }

  if (typeof raw === "string") {
    try {
      return extractAnnouncements(JSON.parse(raw));
    } catch {
      console.warn("⚠️ Announcements endpoint returned a non-JSON string response");
      return [];
    }
  }

  if (raw && typeof raw === "object") {
    const wrapped = raw as {
      announcements?: unknown;
      data?: unknown;
      results?: unknown;
    };

    if ("announcements" in wrapped) {
      return extractAnnouncements(wrapped.announcements);
    }

    if ("data" in wrapped) {
      return extractAnnouncements(wrapped.data);
    }

    if ("results" in wrapped) {
      return extractAnnouncements(wrapped.results);
    }
  }

  return [];
}

/**
 * Custom hook to manage daily announcement carousel
 */
export function useDailyAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncements() {
      // First check if we should show announcements today
      if (!shouldShowToday()) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get<unknown>("/announcements/active");
        const validAnnouncements = extractAnnouncements(res.data);

        if (validAnnouncements.length === 0 && res.data) {
          console.warn("⚠️ No valid announcements found in response", {
            dataType: typeof res.data,
          });
        }

        console.log(`📋 Found ${validAnnouncements.length} valid announcement(s) in response`);
        
        if (validAnnouncements.length > 0) {
          setAnnouncements(validAnnouncements);
          setShouldShow(true);
        } else {
          console.log("ℹ️ No valid announcements to display");
        }
      } catch (err: any) {
        console.error("❌ Error loading announcements:");
        console.error("Error object:", err);
        
        if (err.response) {
          console.error("Response status:", err.response.status);
          console.error("Response data:", err.response.data);
          console.error("Response headers:", err.response.headers);
          
          if (err.response.status === 429) {
            console.warn('⚠️ Rate limit exceeded for announcements');
          } else if (err.response.status >= 500) {
            console.error('❌ Server error loading announcements');
          }
        } else if (err.request) {
          console.error('❌ No response received from server');
          console.error('Request:', err.request);
        } else {
          console.error('❌ Error setting up request:', err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  const handleClose = () => {
    markAsViewedToday();
    setShouldShow(false);
    setAnnouncements([]);
  };

  // console.log("📊 Hook state:", {
  //   announcementsCount: announcements.length,
  //   shouldShow,
  //   loading
  // });

  return {
    announcements,
    shouldShow,
    loading,
    onClose: handleClose,
  };
}
