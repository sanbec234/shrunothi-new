import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../../api/client";
import type { TextDoc } from "../../types";
import "./docmodal.css";

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

  const modalBodyRef = useRef<HTMLDivElement | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const currentIndexRef = useRef<number>(0);
  
  // Critical refs for state management
  const isSpeakingRef = useRef<boolean>(false);
  const playRequestedRef = useRef<boolean>(false);
  const cancelledByUserRef = useRef<boolean>(false);

  // Extract text paragraphs from HTML
  const extractParagraphs = useCallback((html: string): string[] => {
    if (!html || html === "Loading...") {
      console.log("❌ No content to extract");
      return [];
    }
    
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    let paragraphElements = tempDiv.querySelectorAll("p, h1, h2, h3, h4, h5, h6");
    
    if (paragraphElements.length === 0) {
      console.log("⚠️ No <p> or <h> tags found, trying divs...");
      paragraphElements = tempDiv.querySelectorAll("div");
    }
    
    if (paragraphElements.length === 0) {
      console.log("⚠️ No elements found, splitting text by lines...");
      const allText = tempDiv.textContent || tempDiv.innerText || "";
      const lines = allText
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => line.length > 20);
      
      console.log("✅ Extracted", lines.length, "lines from raw text");
      return lines;
    }
    
    const paras: string[] = [];
    
    paragraphElements.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 10) {
        paras.push(text);
      }
    });
    
    console.log("✅ Extracted", paras.length, "paragraphs");
    if (paras.length > 0) {
      console.log("📖 First paragraph:", paras[0].substring(0, 50) + "...");
    }
    
    return paras;
  }, []);

  // Load content
  useEffect(() => {
    let mounted = true;

    async function loadContent() {
      try {
        console.log("🔄 Loading content for doc:", doc.id);
        const res = await api.get<{ content: string }>(`/material/${doc.id}`);
        
        if (!mounted) return;
        
        const htmlContent = res.data.content;
        console.log("📥 Received content length:", htmlContent?.length || 0);
        
        setContent(htmlContent);
        
        const paras = extractParagraphs(htmlContent);
        setParagraphs(paras);
        setTotalParagraphs(paras.length);
        
        console.log("✅ Set", paras.length, "paragraphs in state");
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
        console.log("🎙️ Selected voice:", voiceRef.current.name);
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
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        el.classList.remove("reading-highlight");
      }
    });
  }, []);

  // Completely stop all speech
  const stopSpeech = useCallback(() => {
    console.log("🛑 Stopping speech");
    cancelledByUserRef.current = true;
    playRequestedRef.current = false;
    
    try {
      speechSynthesis.cancel();
    } catch (e) {
      console.error("Cancel error:", e);
    }
    
    // Force UI update
    setTimeout(() => {
      isSpeakingRef.current = false;
      setIsPlaying(false);
    }, 50);
  }, []);

  // Speak a specific paragraph - COMPLETELY REWRITTEN
  const speakParagraph = useCallback(
    (index: number) => {
      console.log(`🎤 speakParagraph called with index: ${index}`);
      
      // Validate index
      if (index < 0 || index >= paragraphs.length) {
        console.log("❌ Invalid index");
        stopSpeech();
        return;
      }

      // Check if we're already processing this request
      if (isSpeakingRef.current) {
        console.log("⚠️ Already speaking, ignoring request");
        return;
      }

      // Mark as requested and in progress
      playRequestedRef.current = true;
      cancelledByUserRef.current = false;
      isSpeakingRef.current = true;

      // Force cancel any existing speech
      try {
        speechSynthesis.cancel();
      } catch (e) {
        console.error("Cancel error:", e);
      }
      
      // Wait for cancel to complete and speech API to be ready
      setTimeout(() => {
        // Check if user cancelled during the timeout
        if (!playRequestedRef.current || cancelledByUserRef.current) {
          console.log("❌ Cancelled during timeout");
          isSpeakingRef.current = false;
          setIsPlaying(false);
          return;
        }

        console.log(`📢 Starting speech for paragraph ${index}`);
        
        const text = paragraphs[index];
        if (!text) {
          console.log("❌ No text for paragraph", index);
          isSpeakingRef.current = false;
          setIsPlaying(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (voiceRef.current) {
          utterance.voice = voiceRef.current;
        }
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          console.log(`✅ Speech started for paragraph ${index}`);
          setCurrentParagraph(index);
          currentIndexRef.current = index;
          highlightParagraph(index);
          setIsPlaying(true);
          isSpeakingRef.current = true;
        };

        utterance.onend = () => {
          console.log(`✅ Speech ended for paragraph ${index}`);
          isSpeakingRef.current = false;
          
          // Only auto-advance if still playing and not cancelled
          if (playRequestedRef.current && !cancelledByUserRef.current && index + 1 < paragraphs.length) {
            console.log(`➡️ Auto-advancing to paragraph ${index + 1}`);
            setTimeout(() => {
              if (playRequestedRef.current && !cancelledByUserRef.current) {
                speakParagraph(index + 1);
              }
            }, 200);
          } else {
            // Finished all paragraphs or was stopped
            console.log("🏁 Playback finished");
            setIsPlaying(false);
            playRequestedRef.current = false;
            if (index + 1 >= paragraphs.length) {
              setCurrentParagraph(0);
              currentIndexRef.current = 0;
              highlightParagraph(-1);
            }
          }
        };

        utterance.onerror = (event) => {
          console.error("❌ Speech error:", event.error);
          isSpeakingRef.current = false;
          
          // Handle different error types
          if (event.error === 'interrupted' || event.error === 'canceled') {
            console.log("ℹ️ Speech was interrupted/canceled (user action)");
            return;
          }
          
          // Real error occurred
          console.error("💥 Real speech error:", event.error);
          setIsPlaying(false);
          playRequestedRef.current = false;
          cancelledByUserRef.current = true;
        };
        
        try {
          console.log("🚀 Calling speechSynthesis.speak()");
          speechSynthesis.speak(utterance);
          
          // Failsafe: Check if speech actually started after a delay
          setTimeout(() => {
            if (playRequestedRef.current && !speechSynthesis.speaking && !speechSynthesis.pending) {
              console.error("⚠️ Speech failed to start, retrying...");
              isSpeakingRef.current = false;
              speakParagraph(index);
            }
          }, 1000);
        } catch (e) {
          console.error("💥 Exception calling speak():", e);
          isSpeakingRef.current = false;
          setIsPlaying(false);
          playRequestedRef.current = false;
        }
      }, 200);
    },
    [paragraphs, highlightParagraph, stopSpeech]
  );

  // Toggle play/pause - SIMPLIFIED
  const togglePlayPause = useCallback(() => {
    console.log(`🎮 Toggle called. Current state - isPlaying: ${isPlaying}, isSpeaking: ${isSpeakingRef.current}, playRequested: ${playRequestedRef.current}`);
    
    if (isPlaying || isSpeakingRef.current || playRequestedRef.current) {
      // STOP/PAUSE
      console.log("⏸️ Pausing");
      stopSpeech();
    } else {
      // START/RESUME
      console.log("▶ Playing from paragraph", currentIndexRef.current);
      speakParagraph(currentIndexRef.current);
    }
  }, [isPlaying, speakParagraph, stopSpeech]);

  // Skip to previous paragraph
  const skipBackward = useCallback(() => {
    console.log("⏮ Skip backward");
    const wasPlaying = isPlaying;
    stopSpeech();
    
    const newIndex = Math.max(0, currentIndexRef.current - 1);
    setCurrentParagraph(newIndex);
    currentIndexRef.current = newIndex;
    highlightParagraph(newIndex);
    
    if (wasPlaying) {
      setTimeout(() => speakParagraph(newIndex), 300);
    }
  }, [isPlaying, speakParagraph, stopSpeech, highlightParagraph]);

  // Skip to next paragraph
  const skipForward = useCallback(() => {
    console.log("⏭ Skip forward");
    const wasPlaying = isPlaying;
    stopSpeech();
    
    const newIndex = Math.min(paragraphs.length - 1, currentIndexRef.current + 1);
    setCurrentParagraph(newIndex);
    currentIndexRef.current = newIndex;
    highlightParagraph(newIndex);
    
    if (wasPlaying) {
      setTimeout(() => speakParagraph(newIndex), 300);
    }
  }, [isPlaying, speakParagraph, stopSpeech, highlightParagraph, paragraphs.length]);

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
        console.log("🖱️ Paragraph clicked:", clickedIndex);
        const wasPlaying = isPlaying;
        stopSpeech();
        
        setTimeout(() => {
          if (wasPlaying) {
            speakParagraph(clickedIndex);
          }
        }, 300);
      }
    },
    [isPlaying, speakParagraph, stopSpeech, paragraphs.length]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleanup on unmount");
      cancelledByUserRef.current = true;
      playRequestedRef.current = false;
      try {
        speechSynthesis.cancel();
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stopSpeech();
        onClose();
      }
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, togglePlayPause, stopSpeech]);

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

        {/* Debug info */}
        {paragraphs.length === 0 && content !== "Loading..." && (
          <div style={{ padding: '10px', background: '#fee', color: '#c00', fontSize: '12px' }}>
            ⚠️ No paragraphs detected. Check console for details.
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

        {/* Permanent Floating Mini Player - NO SEEK BAR */}
        {paragraphs.length > 0 && (
          <div className="mini-player">
            <div className="mini-player-info">
              <span className="mini-player-title">
                {isPlaying ? "Reading.." : "Read Aloud 🎙️"}
              </span>
              <span className="mini-player-para">
                Para {currentParagraph + 1}/{totalParagraphs}
              </span>
            </div>
            
            <div className="mini-player-controls">
              <button 
                className="mini-btn" 
                onClick={skipBackward} 
                title="Previous paragraph"
                disabled={currentParagraph === 0}
              >
                ⏮
              </button>
              <button 
                className="mini-btn-main" 
                onClick={togglePlayPause} 
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button 
                className="mini-btn" 
                onClick={skipForward} 
                title="Next paragraph"
                disabled={currentParagraph >= totalParagraphs - 1}
              >
                ⏭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}