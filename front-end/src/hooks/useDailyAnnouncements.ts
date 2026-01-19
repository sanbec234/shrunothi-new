
// import { useEffect, useState } from "react";
// import { api } from "../api/client";

// type Announcement = {
//   id: string;
//   title: string;
//   imageUrl: string;
// };

// const STORAGE_KEY = "last_announcement_view";

// /**
//  * Check if announcements should be shown today
//  * Returns true if user hasn't seen announcements today
//  */
// function shouldShowToday(): boolean {
//   const lastView = localStorage.getItem(STORAGE_KEY);
  
//   if (!lastView) return true;
  
//   const lastViewDate = new Date(lastView);
//   const today = new Date();
  
//   // Check if last view was on a different day
//   return (
//     lastViewDate.getDate() !== today.getDate() ||
//     lastViewDate.getMonth() !== today.getMonth() ||
//     lastViewDate.getFullYear() !== today.getFullYear()
//   );
// }

// /**
//  * Mark announcements as viewed today
//  */
// function markAsViewedToday(): void {
//   localStorage.setItem(STORAGE_KEY, new Date().toISOString());
// }

// /**
//  * Custom hook to manage daily announcement carousel
//  */
// export function useDailyAnnouncements() {
//   const [announcements, setAnnouncements] = useState<Announcement[]>([]);
//   const [shouldShow, setShouldShow] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function loadAnnouncements() {
//       // First check if we should show announcements today
//       if (!shouldShowToday()) {
//         setLoading(false);
//         return;
//       }

//       try {
//         const res = await api.get<Announcement[]>("/announcements/active");
//         const activeAnnouncements = Array.isArray(res.data) ? res.data : [];

//         if (activeAnnouncements.length > 0) {
//           setAnnouncements(activeAnnouncements);
//           setShouldShow(true);
//         }
//       } catch (err) {
//         console.error("Failed to load announcements", err);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadAnnouncements();
//   }, []);

//   const handleClose = () => {
//     markAsViewedToday();
//     setShouldShow(false);
//   };

//   return {
//     announcements,
//     shouldShow,
//     loading,
//     onClose: handleClose,
//   };
// }

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
  console.log("🔍 Checking if should show announcements today...");
  
  try {
    const lastView = localStorage.getItem(STORAGE_KEY);
    console.log("📅 Last view timestamp:", lastView);
    
    if (!lastView) {
      console.log("✅ No previous view found - should show");
      return true;
    }
    
    const lastViewDate = new Date(lastView);
    const today = new Date();
    
    console.log("📅 Last view date:", lastViewDate.toLocaleDateString());
    console.log("📅 Today:", today.toLocaleDateString());
    
    // Check if last view was on a different day
    const shouldShow = (
      lastViewDate.getDate() !== today.getDate() ||
      lastViewDate.getMonth() !== today.getMonth() ||
      lastViewDate.getFullYear() !== today.getFullYear()
    );
    
    console.log(`${shouldShow ? '✅' : '❌'} Should show: ${shouldShow}`);
    return shouldShow;
  } catch (e) {
    console.error('❌ Error checking announcement view status:', e);
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
    console.log("✅ Marked announcements as viewed:", timestamp);
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

/**
 * Custom hook to manage daily announcement carousel
 */
export function useDailyAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 useDailyAnnouncements hook initialized");
    console.log("=".repeat(60));
    
    async function loadAnnouncements() {
      // First check if we should show announcements today
      if (!shouldShowToday()) {
        console.log("⏭️ Skipping - already viewed today");
        setLoading(false);
        return;
      }

      console.log("📡 Fetching active announcements from API...");

      try {
        const res = await api.get<Announcement[]>("/announcements/active");
        
        console.log("✅ API response received");
        console.log("📦 Response data:", res.data);
        console.log("📊 Response status:", res.status);
        
        // Validate response data
        if (!Array.isArray(res.data)) {
          console.error('❌ Invalid announcements data format - not an array:', typeof res.data);
          setLoading(false);
          return;
        }
        
        console.log(`📋 Found ${res.data.length} announcement(s) in response`);
        
        // Filter and validate announcements
        const validAnnouncements = res.data.filter(isValidAnnouncement);
        
        console.log(`✅ ${validAnnouncements.length} valid announcement(s) after filtering`);
        
        if (validAnnouncements.length > 0) {
          console.log("🎉 Setting announcements and showing carousel");
          console.log("📝 Announcements to display:", validAnnouncements);
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
        console.log("🏁 Loading complete");
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  const handleClose = () => {
    console.log("🔒 Closing announcements carousel");
    markAsViewedToday();
    setShouldShow(false);
    setAnnouncements([]);
  };

  console.log("📊 Hook state:", {
    announcementsCount: announcements.length,
    shouldShow,
    loading
  });

  return {
    announcements,
    shouldShow,
    loading,
    onClose: handleClose,
  };
}