import { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { FiCopy, FiEdit, FiCheck, FiX } from "react-icons/fi";

// Category Data
const categories = [
  "💡 General knowledge",
  "🔧 Technical questions",
  "📝 Writing assistance",
  "🤔 Problem solving",
];

function App() {
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const chatContainerRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const timeoutIdRef = useRef(null);
  // --- NEW CODE: Ref for the textarea to enable auto-resizing ---
  const textareaRef = useRef(null);

  // Editing state
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(30); // ms per word

  // Refs for settings dropdown
  const settingsButtonRef = useRef(null);
  const settingsMenuRef = useRef(null);

  // Track manual scrolling to pause autoscroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setIsUserScrolling(!(scrollTop + clientHeight >= scrollHeight - 10));
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isUserScrolling && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, generatingAnswer, isUserScrolling]);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Effect to handle clicks outside the settings menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target)
      ) {
        setIsSettingsOpen(false);
      }
    }
    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  // --- NEW CODE: useEffect to handle textarea auto-resize ---
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const maxHeight = 200; // Set a max-height in pixels (e.g., 200px)
      textarea.style.height = 'auto'; // Reset height to allow shrinking
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;

      // Show scrollbar only when max height is reached
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [question]); // Reruns whenever the input text changes

  const handleStopGeneration = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setGeneratingAnswer(false);
  };

  const generateAnswer = async (inputText) => {
    if (!inputText.trim()) return;

    setGeneratingAnswer(true);
    setChatHistory((prev) => [...prev, { type: "question", content: inputText }]);

    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
          import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT
        }`,
        method: "post",
        data: { contents: [{ parts: [{ text: inputText }] }] },
      });

      const aiResponse = response.data.candidates[0].content.parts[0].text;
      const isCodeBlock = aiResponse.trim().startsWith("```");

      if (isCodeBlock) {
        setChatHistory((prev) => [...prev, { type: "answer", content: aiResponse }]);
        setGeneratingAnswer(false);
      } else {
        const words = aiResponse.split(/\s+/);
        setChatHistory((prev) => [...prev, { type: "answer", content: "" }]);
        let index = 0;

        const typeNextWord = () => {
          if (index >= words.length) {
            setGeneratingAnswer(false);
            timeoutIdRef.current = null; // Clean up ref
            return;
          }
          const wordToAdd = words[index];
          setChatHistory((prev) => {
            const updated = [...prev];
            const currentContent = updated[updated.length - 1].content;
            updated[updated.length - 1] = {
              type: "answer",
              content: currentContent ? currentContent + " " + wordToAdd : wordToAdd,
            };
            return updated;
          });
          index++;
          timeoutIdRef.current = setTimeout(typeNextWord, typingSpeed);
        };
        typeNextWord();
      }
    } catch (error) {
      console.log(error);
      setChatHistory((prev) => [
        ...prev,
        { type: "answer", content: "Sorry - Something went wrong. Please try again!" },
      ]);
      setGeneratingAnswer(false);
    }
  };
  
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!generatingAnswer && question.trim()) {
        generateAnswer(question);
        setQuestion("");
    }
  };

  const toggleTheme = () => setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  const reloadPage = () => window.location.reload();
  const handleCategoryClick = (categoryText) => setQuestion(categoryText);
  const toggleSidebar = () => setIsSidebarOpen((s) => !s);
  const clearSession = () => setChatHistory([]);
  const truncate = (text, n = 80) => (text?.length > n ? text.slice(0, n) + "…" : text);

  return (
    <div className="fixed inset-0 animated-background">
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>

      {/* Sidebar Overlay */}
      <div className={`sidebar-overlay ${isSidebarOpen ? "show" : ""}`} onClick={() => setIsSidebarOpen(false)} aria-hidden={!isSidebarOpen}></div>

     {/* Chat History Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`} role="dialog" aria-label="Chat History">
        <div className="sidebar-header">
          <h3>Session history</h3>
          {/* NEW: Container for header action buttons */}
          <div className="sidebar-header-actions">
            {/* NEW: Mobile-only button */}
            <button className="sidebar-clear-mobile" onClick={clearSession}>Clear session</button>
            {/* Your existing close button */}
            <button className="sidebar-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close history">✕</button>
          </div>
        </div>
        <div className="sidebar-list hide-scrollbar min-h-0">
          {chatHistory.length === 0 ? (
            <p className="sidebar-empty">No chats yet.</p>
          ) : (
            chatHistory.map((item, idx) => (
              <div key={`hist-${idx}`} className={`history-item ${item.type === "question" ? "q" : "a"}`} title={item.content}>
                <span className="history-badge">{item.type === "question" ? "You" : "AI"}</span>
                <p className="history-text">{truncate(item.content, 120)}</p>
              </div>
            ))
          )}
        </div>
        <div className="sidebar-footer">
          {/* UNTOUCHED: This is your original desktop button. Note the className is "sidebar-clear" */}
          <button className="sidebar-clear" onClick={clearSession}>Clear session</button>
        </div>
      </aside>

      <div className="h-full max-w-4xl mx-auto flex flex-col p-3 relative z-10">
        {/* Header */}
        <header className="relative z-20 text-center py-4 flex flex-col sm:flex-row sm:justify-between items-center gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button className="sidebar-rail-btn" onClick={toggleSidebar} aria-label="Open sidebar"><span className="rail-icon">≡</span></button>
            )}
           <a
           href="https://github.com/deepanshu1420/AINexus-Powered-By-Gemini"
           target="_blank"
           rel="noopener noreferrer" 
          className="block"
           >
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--header-text)] hover:text-[var(--header-text-hover)] transition-colors flex items-center gap-2">
           <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
           >
             <circle cx="12" cy="12" r="2" />
             <path d="M12 2a10 10 0 1 0 10 10" />
             <path d="M12 12a10 10 0 0 1-5-8.66" />
             <path d="M12 12a10 10 0 0 0 5-8.66" />
            </svg>
            AI Nexus
            </h1>
          </a>
          </div>
          <div className="header-buttons flex items-center gap-2 relative">
            <button onClick={toggleSidebar} className="bg-[var(--button-bg)] text-[var(--button-text)] hover:bg-[var(--button-bg-hover)]">History 📜</button>
            <button onClick={reloadPage} className="bg-[var(--button-bg)] text-[var(--button-text)] hover:bg-[var(--button-bg-hover)]">Home 🏠</button>
            <button onClick={toggleTheme} className="bg-[var(--button-bg)] text-[var(--button-text)] hover:bg-[var(--button-bg-hover)]">{theme === "light" ? "Dark Mode 🌙" : "Light Mode ☀️"}</button>

            {/* Settings Icon */}
            <div className="relative">
              <button
                ref={settingsButtonRef}
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="bg-[var(--button-bg)] text-[var(--button-text)] hover:bg-[var(--button-bg-hover)] p-2 rounded-full"
                title="Settings"
              >
                ⚙️
              </button>
              {isSettingsOpen && (
                <div
                  ref={settingsMenuRef}
                  className="absolute right-0 mt-2 w-48 bg-[var(--form-bg)] p-4 rounded-xl shadow-lg border border-[var(--glass-border)]"
                >
                  <label className="block mb-2 text-sm font-semibold text-[var(--bot-message-text)]">
                    Response typing speed (ms per word)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={typingSpeed}
                    onChange={(e) => setTypingSpeed(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-[var(--bot-message-text)] mt-1">{typingSpeed} ms</div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 rounded-3xl shadow-lg p-4 hide-scrollbar" style={{ backgroundColor: "var(--chat-bg)", backdropFilter: "blur(10px)" }}>
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-2 sm:p-6">
              <div className="rounded-3xl p-8 max-w-2xl" style={{ backgroundColor: "var(--welcome-bg)" }}>
                <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: "var(--welcome-header)" }}>Welcome to Deepanshu's AI Chat 👋</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-left text-sm sm:text-base">
                  {categories.map((category) => (
                    <div key={category} className="p-6 rounded-2xl shadow-sm category-box" style={{ backgroundColor: "var(--welcome-item-bg)", color: "var(--welcome-text)" }} onClick={() => handleCategoryClick(category)}>
                      <p className="font-bold text-base sm:text-lg">{category}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {chatHistory.map((chat, index) => (
                <div key={index} className={`mb-4 relative group ${chat.type === "question" ? "text-right" : "text-left"}`}>
                  <div className={`inline-block max-w-[80%] p-3 rounded-2xl shadow-md relative ${chat.type === "question" ? "rounded-br-none" : "rounded-bl-none"}`} style={{
                    backgroundColor: chat.type === "question" ? "var(--user-message-bg)" : "var(--bot-message-bg)",
                    color: chat.type === "question" ? "var(--user-message-text)" : "var(--bot-message-text)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid var(--glass-border)"
                  }}>
                 {editingIndex === index ? (
                 <div
                 contentEditable
                 suppressContentEditableWarning
                 ref={(el) => {
                 if (el && el.innerText !== editText) el.innerText = editText;
                 }}
                onInput={(e) => setEditText(e.currentTarget.innerText)}
                onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
               e.preventDefault();
               const newText = e.currentTarget.innerText.trim();

                  const updated = [...chatHistory];
                // ✅ keep old question, just mark it as edited
              updated[index] = {
               ...updated[index],
                edited: true,
              };

                setChatHistory(updated);
                setEditingIndex(null);
                setQuestion(""); // clear input box
                generateAnswer(newText); // send new prompt
                }
               }}
              className="w-full p-2 rounded-2xl"
             style={{
             backgroundColor:
         chat.type === "question"
          ? "var(--user-message-bg)"
          : "var(--bot-message-bg)",
           color:
             chat.type === "question"
             ? "var(--user-message-text)"
              : "var(--bot-message-text)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
               outline: "none",
              minHeight: "1rem",
               }}
                  />
               ) : (
                 <>
               {chat.type === "answer" ? (
               <div className="markdown-content">
                <ReactMarkdown>{chat.content}</ReactMarkdown>
                </div>
                ) : (
                <div>
                {chat.content}
               {chat.edited && (
                <span className="edited-label">(edited → resent)</span>
                )}
               </div>
                )}
                </>
                )}

                {/* Hover buttons */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs">
                {editingIndex === index ? (
               <>
              <FiCheck
               className="cursor-pointer hover:text-green-500"
               onClick={() => {
           const newText = editText.trim();
           const updated = [...chatHistory];
           // ✅ mark old as edited
             updated[index] = {
              ...updated[index],
             edited: true,
             };
                 setChatHistory(updated);
                 setEditingIndex(null);
                 setQuestion(""); // clear input
                 generateAnswer(newText); // send new prompt
                }}
                 />
              <FiX
             className="cursor-pointer hover:text-red-500"
             onClick={() => setEditingIndex(null)}
              />
             </>
           ) : (
             <>
            <FiCopy
            className="cursor-pointer hover:text-blue-500"
             onClick={() => navigator.clipboard.writeText(chat.content)}
                />
               {chat.type === "question" && (
            <FiEdit
           className="cursor-pointer hover:text-yellow-500"
            onClick={() => {
            setEditingIndex(index);
            setEditText(chat.content);
                }}
                />
                 )}
            </>
               )}
                  </div>

                  </div>
                </div>
              ))}
            </>
          )}

          {generatingAnswer && (
            <div className="text-left">
              <div className="inline-block rounded-2xl" style={{ backgroundColor: "var(--bot-message-bg)", backdropFilter: "blur(20px)", border: "1px solid var(--glass-border)" }}>
                <div className="typing-indicator">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl shadow-lg p-2 sm:p-4"
          style={{ backgroundColor: "var(--form-bg)", backdropFilter: "blur(10px)" }}
        >
          <div className="flex gap-2">
            {/* --- MODIFIED CODE: Textarea with auto-resize --- */}
            <textarea
              ref={textareaRef}
              required
              className="flex-1 border rounded-2xl p-3 resize-none focus:ring-2"
              style={{
                borderColor: "var(--input-border)",
                backgroundColor: "transparent",
                color: "var(--bot-message-text)",
                outline: "none",
                "--tw-ring-color": "var(--input-focus-ring)",
                overflowY: 'hidden',
              }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything..."
              rows="2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="button"
              onClick={generatingAnswer ? handleStopGeneration : handleSubmit}
              className={`px-4 sm:px-6 py-2 rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95`}
              style={{ backgroundColor: "var(--button-bg)", color: "var(--button-text)" }}
            >
              {generatingAnswer ? "Stop" : "Send"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <footer className="text-center py-2">
          <p className="text-xs sm:text-sm font-semibold" style={{ color: "var(--welcome-text)", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
            This AI is developed by Deepanshu Sharma. © 2025. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;