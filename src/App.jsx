import { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";
import ReactMarkdown from "react-markdown";

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
  const [theme, setTheme] = useState("dark"); // Default to dark mode

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, generatingAnswer]);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const generateAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    setGeneratingAnswer(true);
    const currentQuestion = question;
    setQuestion("");

    setChatHistory((prev) => [...prev, { type: "question", content: currentQuestion }]);

    try {
      const response = await axios({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${
          import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT
        }`,
        method: "post",
        data: {
          contents: [{ parts: [{ text: currentQuestion }] }],
        },
      });

      const aiResponse =
        response["data"]["candidates"][0]["content"]["parts"][0]["text"];
      setChatHistory((prev) => [...prev, { type: "answer", content: aiResponse }]);
    } catch (error) {
      console.log(error);
      const errorMessage = "Sorry - Something went wrong. Please try again!";
      setChatHistory((prev) => [...prev, { type: "answer", content: errorMessage }]);
    }
    setGeneratingAnswer(false);
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const reloadPage = () => {
    window.location.reload();
  };

  const handleCategoryClick = (categoryText) => {
    setQuestion(categoryText);
  };

  return (
    <div className="fixed inset-0 animated-background">
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      
      <div className="h-full max-w-4xl mx-auto flex flex-col p-3 relative z-10">
        {/* Fixed Header */}
        <header className="text-center py-4 flex flex-col sm:flex-row sm:justify-between items-center gap-4 sm:gap-0">
          <a
            href="https://github.com/deepanshu1420/AINexus-Powered-By-Gemini"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--header-text)] hover:text-[var(--header-text-hover)] transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="2"/>
                <path d="M12 2a10 10 0 1 0 10 10"/>
                <path d="M12 12a10 10 0 0 1-5-8.66"/>
                <path d="M12 12a10 10 0 0 0 5-8.66"/>
              </svg>
              AI Nexus
            </h1>
          </a>
          <div className="header-buttons">
            <button
              onClick={reloadPage}
              className="bg-[var(--button-bg)] text-[var(--button-text)] hover:bg-[var(--button-bg-hover)]"
            >
              Home 🏠
            </button>
            <button
              onClick={toggleTheme}
              className="bg-[var(--button-bg)] text-[var(--button-text)] hover:bg-[var(--button-bg-hover)]"
            >
              {theme === "light" ? "Dark Mode 🌙" : "Light Mode ☀️"}
            </button>
          </div>
        </header>

        {/* Scrollable Chat Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto mb-4 rounded-3xl shadow-lg p-4 hide-scrollbar"
          style={{ backgroundColor: "var(--chat-bg)", backdropFilter: "blur(10px)" }}
        >
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-2 sm:p-6">
              <div
                className="rounded-3xl p-8 max-w-2xl"
                style={{ backgroundColor: "var(--welcome-bg)" }}
              >
                <h2
                  className="text-xl sm:text-2xl font-bold mb-4"
                  style={{ color: "var(--welcome-header)" }}
                >
                  Welcome to Deepanshu's AI Chat 👋
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-left text-sm sm:text-base">
                  {categories.map((category) => (
                     <div 
                      key={category} 
                      className="p-6 rounded-2xl shadow-sm category-box" 
                      style={{ backgroundColor: "var(--welcome-item-bg)", color: "var(--welcome-text)" }}
                      onClick={() => handleCategoryClick(category)}
                    >
                        <p className="font-bold text-base sm:text-lg">{category}</p>
                     </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    chat.type === "question" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-2xl overflow-auto hide-scrollbar shadow-md ${
                      chat.type === "question"
                        ? "rounded-br-none"
                        : "rounded-bl-none"
                    }`}
                    style={{
                      backgroundColor:
                        chat.type === "question"
                          ? "var(--user-message-bg)"
                          : "var(--bot-message-bg)",
                      color:
                        chat.type === "question"
                          ? "var(--user-message-text)"
                          : "var(--bot-message-text)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <ReactMarkdown className="overflow-auto hide-scrollbar">
                      {chat.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </>
          )}
          {generatingAnswer && (
            <div className="text-left">
              <div
                className="inline-block rounded-2xl"
                style={{ 
                    backgroundColor: "var(--bot-message-bg)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid var(--glass-border)",
                }}
              >
                <div className="typing-indicator">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Input Form */}
        <form
          onSubmit={generateAnswer}
          className="rounded-3xl shadow-lg p-2 sm:p-4"
          style={{ backgroundColor: "var(--form-bg)", backdropFilter: "blur(10px)" }}
        >
          <div className="flex gap-2">
            <textarea
              required
              className="flex-1 border rounded-2xl p-3 resize-none focus:ring-2"
              style={{
                borderColor: "var(--input-border)",
                backgroundColor: "transparent",
                color: "var(--bot-message-text)",
                outline: "none",
                '--tw-ring-color': 'var(--input-focus-ring)'
              }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything..."
              rows="2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generateAnswer(e);
                }
              }}
            ></textarea>
            <button
              type="submit"
              className={`px-4 sm:px-6 py-2 rounded-2xl transition-all duration-200 transform hover:scale-105 ${
                generatingAnswer ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{
                backgroundColor: "var(--button-bg)",
                color: "var(--button-text)",
              }}
              disabled={generatingAnswer}
            >
              Send
            </button>
          </div>
        </form>

        {/* Footer */}
        <footer className="text-center py-2">
          <p className="text-xs sm:text-sm font-semibold" style={{ color: "var(--welcome-text)", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
            This AI is designed by Deepanshu Sharma | Copyright © 2025
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;