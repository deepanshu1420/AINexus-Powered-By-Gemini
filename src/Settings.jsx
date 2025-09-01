import { useState } from "react";

function Settings({ theme, setTheme, typingSpeed, setTypingSpeed }) {
  return (
    <div className="settings-panel p-4 rounded-xl shadow-lg" style={{ backgroundColor: "var(--form-bg)", color: "var(--bot-message-text)" }}>
      <h2 className="font-bold text-lg mb-4">Settings</h2>

      {/* Theme Selector */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="p-2 rounded-md border"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* Typing Speed Control */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Chat Typing Speed (ms per word)</label>
        <input
          type="number"
          min="10"
          max="500"
          step="10"
          value={typingSpeed}
          onChange={(e) => setTypingSpeed(Number(e.target.value))}
          className="p-2 rounded-md border w-full"
        />
      </div>
    </div>
  );
}

export default Settings;
