import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../../api/client";
import type { TextDoc } from "../../types";
import "./docmodal.css"

interface Props {
  doc: TextDoc;
  onClose: () => void;
}

export default function DocModal({ doc, onClose }: Props) {
  const [content, setContent] = useState<string>("Loading...");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentParagraph, setCurrentParagraph] = useState<number>(0);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [totalParagraphs, setTotalParagraphs] = useState<number>(0);
  const [showMiniPlayer, setShowMiniPlayer] = useState<boolean>(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const modalBodyRef = useRef<HTMLDivElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const currentIndexRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // Extract text paragraphs from HTML - MORE ROBUST
  const extractParagraphs = useCallback((html: string): string[] => {
    if (!html || html === "Loading...") {
      // console.log("❌ No content to extract");
      return [];
    }
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    // Try multiple strategies to find text content
    let paragraphElements = tempDiv.querySelectorAll("p, h1, h2, h3, h4, h5, h6");
    
    // Fallback: if no semantic tags, try divs with substantial text
    if (paragraphElements.length === 0) {
      // console.log("⚠️ No <p> or <h> tags found, trying divs...");
      paragraphElements = tempDiv.querySelectorAll("div");
    }
    
    // Last resort: split by line breaks
    if (paragraphElements.length === 0) {
      // console.log("⚠️ No elements found, splitting text by lines...");
      const allText = tempDiv.textContent || tempDiv.innerText || "";
      const lines = allText
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => line.length > 20); // At least 20 chars
      
      // console.log("✅ Extracted", lines.length, "lines from raw text");
      return lines;
    }
    
    const paras: string[] = [];
    
    paragraphElements.forEach((el) => {
      const text = el.textContent?.trim();
      // Keep paragraphs with at least 10 characters
      if (text && text.length > 10) {
        paras.push(text);
      }
    });
    
    // console.log("✅ Extracted", paras.length, "paragraphs");
    if (paras.length > 0) {
      // console.log("📖 First paragraph:", paras[0].substring(0, 50) + "...");
    }
    
    return paras;
  }, []);

  // Load content
  useEffect(() => {
    let mounted = true;

    async function loadContent() {
      try {
        // console.log("🔄 Loading content for doc:", doc.id);
        const res = await api.get<{ content: string }>(`/material/${doc.id}`);
        
        if (!mounted) return;
        
        const htmlContent = res.data.content;
        // console.log("📥 Received content length:", htmlContent?.length || 0);
        
        setContent(htmlContent);
        
        const paras = extractParagraphs(htmlContent);
        setParagraphs(paras);
        setTotalParagraphs(paras.length);
        
        // console.log("✅ Set", paras.length, "paragraphs in state");
      } catch (err) {
        console.error("❌ Failed to load document", err);
        setContent("Failed to load document.");
      }
    }

    loadContent();
    return () => {
      mounted = false;
    };
  }, [doc.id, extractParagraphs]);

  // Load Google English voice
  useEffect(() => {
    const loadVoice = () => {
      const voices = speechSynthesis.getVoices();
      const googleVoice = voices.find(
        (v) => v.name.includes("Google") && v.lang.startsWith("en")
      );
      const anyEnglishVoice = voices.find((v) => v.lang.startsWith("en"));
      voiceRef.current = googleVoice || anyEnglishVoice || voices[0];
      
      if (voiceRef.current) {
        // console.log("🎙️ Selected voice:", voiceRef.current.name);
      }
    };

    loadVoice();
    speechSynthesis.addEventListener("voiceschanged", loadVoice);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoice);
  }, []);

  // Highlight current paragraph
  const highlightParagraph = useCallback((index: number) => {
    if (!modalBodyRef.current) return;

    const allParas = modalBodyRef.current.querySelectorAll("p, h1, h2, h3, h4, h5, h6, div");
    
    allParas.forEach((el, i) => {
      if (i === index) {
        el.classList.add("reading-highlight");
        // Auto-scroll to current paragraph
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        el.classList.remove("reading-highlight");
      }
    });
  }, []);

  // Speak a specific paragraph
  const speakParagraph = useCallback(
    (index: number) => {
      // console.log("🎙️ Speaking paragraph", index);
      
      if (index < 0 || index >= paragraphs.length) {
        // console.log("❌ Invalid paragraph index:", index);
        setIsPlaying(false);
        setCurrentParagraph(0);
        isPausedRef.current = false;
        return;
      }

      // Cancel any existing speech first
      speechSynthesis.cancel();
      
      // Small delay to ensure cancel completes (browser quirk)
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(paragraphs[index]);
        if (voiceRef.current) {
          utterance.voice = voiceRef.current;
        }
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          // console.log("▶️ Started speaking paragraph", index);
          setCurrentParagraph(index);
          currentIndexRef.current = index;
          isPausedRef.current = false; // Clear paused flag when we start
          highlightParagraph(index);
        };

        utterance.onend = () => {
          // console.log("⏹️ Finished paragraph", index);
          // Only auto-advance if we're not paused
          if (!isPausedRef.current && index + 1 < paragraphs.length) {
            speakParagraph(index + 1);
          } else if (index + 1 >= paragraphs.length) {
            // console.log("✅ Finished all paragraphs");
            setIsPlaying(false);
            setCurrentParagraph(0);
            currentIndexRef.current = 0;
            isPausedRef.current = false;
            highlightParagraph(-1); // Clear highlight
          }
        };

        utterance.onerror = (event) => {
          // console.error("❌ Speech error:", event.error);
          // Only stop if it's a real error, not an interruption from user action
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            setIsPlaying(false);
          }
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }, 50); // 50ms delay to avoid race conditions
    },
    [paragraphs, highlightParagraph]
  );

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    // console.log("🎮 Toggle play/pause. Currently playing:", isPlaying);
    // console.log("🎮 Speech speaking:", speechSynthesis.speaking);
    // console.log("🎮 Speech paused:", speechSynthesis.paused);
    // console.log("🎮 Current paragraph:", currentIndexRef.current);
    
    if (isPlaying) {
      // User wants to PAUSE
      // console.log("⏸️ Pausing...");
      speechSynthesis.cancel(); // Cancel current speech
      isPausedRef.current = true;
      setIsPlaying(false);
    } else {
      // User wants to PLAY
      if (isPausedRef.current) {
        // RESUME from where we paused
        // console.log("▶️ Resuming from paragraph", currentIndexRef.current);
        isPausedRef.current = false;
        speakParagraph(currentIndexRef.current);
      } else {
        // START fresh
        // console.log("▶️ Starting from paragraph", currentIndexRef.current);
        speakParagraph(currentIndexRef.current);
      }
    }
  }, [isPlaying, speakParagraph]);

  // Skip to previous paragraph
  const skipBackward = useCallback(() => {
    const newIndex = Math.max(0, currentIndexRef.current - 1);
    // console.log("⏮️ Skip backward to paragraph", newIndex);
    speakParagraph(newIndex);
  }, [speakParagraph]);

  // Skip to next paragraph
  const skipForward = useCallback(() => {
    const newIndex = Math.min(paragraphs.length - 1, currentIndexRef.current + 1);
    // console.log("⏭️ Skip forward to paragraph", newIndex);
    speakParagraph(newIndex);
  }, [speakParagraph, paragraphs.length]);

  // Seek to specific paragraph via slider
  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newIndex = parseInt(e.target.value, 10);
      // console.log("🔍 Seek to paragraph", newIndex);
      setCurrentParagraph(newIndex);
      currentIndexRef.current = newIndex;
      
      if (isPlaying) {
        speakParagraph(newIndex);
      } else {
        highlightParagraph(newIndex);
      }
    },
    [isPlaying, speakParagraph, highlightParagraph]
  );

  // Click on paragraph to jump playback
  const handleParagraphClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPlaying) return;

      const target = e.target as HTMLElement;
      if (!target.matches("p, h1, h2, h3, h4, h5, h6, div")) return;

      const allParas = modalBodyRef.current?.querySelectorAll("p, h1, h2, h3, h4, h5, h6, div");
      if (!allParas) return;

      const clickedIndex = Array.from(allParas).indexOf(target);
      if (clickedIndex !== -1 && clickedIndex < paragraphs.length) {
        // console.log("👆 Clicked paragraph", clickedIndex);
        speakParagraph(clickedIndex);
      }
    },
    [isPlaying, speakParagraph, paragraphs.length]
  );

  // Show/hide mini player based on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!modalBodyRef.current) return;
      const scrollTop = modalBodyRef.current.scrollTop;
      setShowMiniPlayer(scrollTop > 200);
    };

    const modalBody = modalBodyRef.current;
    if (modalBody) {
      modalBody.addEventListener("scroll", handleScroll);
      return () => modalBody.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      isPausedRef.current = false;
      // console.log("🧹 Cleaned up speech synthesis");
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        speechSynthesis.cancel();
        isPausedRef.current = false;
        onClose();
      }
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, togglePlayPause]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <img src="/logo.png" alt="Shrunothi" className="modal-logo-inline" />
          <div className="modal-meta">
            <h2 className="modal-title">{doc.title}</h2>
            <p className="modal-author">By {doc.author}</p>
          </div>
        </div>

        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {/* Read Aloud Controls */}
        <div className="read-aloud-controls">
          <button className="control-btn" onClick={skipBackward} disabled={paragraphs.length === 0}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button className="control-btn-main" onClick={togglePlayPause} disabled={paragraphs.length === 0}>
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button className="control-btn" onClick={skipForward} disabled={paragraphs.length === 0}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 18h2V6h-2zm-11-7l8.5-6v12z" />
            </svg>
          </button>
        </div>

        {/* Debug info - REMOVE THIS AFTER TESTING */}
        {paragraphs.length === 0 && content !== "Loading..." && (
          <div style={{ padding: '10px', background: '#fee', color: '#c00', fontSize: '12px' }}>
            ⚠️ No paragraphs detected. Check console for details.
          </div>
        )}

        {/* Seek Bar */}
        {paragraphs.length > 0 && (
          <div className="seek-bar-container">
            <span className="seek-label">
              Para {currentParagraph + 1} / {totalParagraphs}
            </span>
            <input
              type="range"
              min="0"
              max={totalParagraphs - 1}
              value={currentParagraph}
              onChange={handleSeek}
              className="seek-slider"
            />
          </div>
        )}

        <div className="scroll-hint">Scroll to read more ↓</div>

        {/* Content Body */}
        <div
          ref={modalBodyRef}
          className="modal-body tiptap-content"
          dangerouslySetInnerHTML={{ __html: content }}
          onClick={handleParagraphClick}
        />

        {/* Floating Mini Player */}
        {showMiniPlayer && isPlaying && (
          <div className="mini-player">
            <div className="mini-player-info">
              <span className="mini-player-title">🎙️ Reading</span>
              <span className="mini-player-para">
                Para {currentParagraph + 1}/{totalParagraphs}
              </span>
            </div>
            <div className="mini-player-controls">
              <button className="mini-btn" onClick={skipBackward}>
                ⏮
              </button>
              <button className="mini-btn" onClick={togglePlayPause}>
                {isPlaying ? "⏸" : "▶️"}
              </button>
              <button className="mini-btn" onClick={skipForward}>
                ⏭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
