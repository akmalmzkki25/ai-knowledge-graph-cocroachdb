import React, { useState } from 'react';
import { 
  FaRobot, 
  FaPaperPlane, 
  FaXmark, 
  FaWandMagicSparkles 
} from 'react-icons/fa6';
import { askCopilot } from '../services/api';

export default function CopilotDrawer({ isOpen, onClose, onHighlightNodes }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your **AetherBio Copilot**. Ask me any research question about biological entities, drug mechanisms, or pathway links in your graph.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await askCopilot(userText);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: res.answer_markdown,
          highlight_node_ids: res.highlight_node_ids
        }
      ]);
      if (res.highlight_node_ids && res.highlight_node_ids.length > 0 && onHighlightNodes) {
        onHighlightNodes(res.highlight_node_ids);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: 'Sorry, encountered an error processing your query.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 glass-panel border-l border-slate-800 shadow-2xl flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
            <FaRobot className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">AetherBio AI Copilot</h3>
            <p className="text-[10px] text-slate-400 font-mono">AWS Bedrock GLM 5.2 Reasoning</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
          <FaXmark className="w-5 h-5" />
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl ${
              m.sender === 'user'
                ? 'bg-indigo-600/30 text-indigo-200 ml-6 border border-indigo-500/30'
                : 'bg-slate-900/80 text-slate-200 mr-6 border border-slate-800'
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
            {m.highlight_node_ids && m.highlight_node_ids.length > 0 && (
              <button
                onClick={() => onHighlightNodes && onHighlightNodes(m.highlight_node_ids)}
                className="mt-2 text-[10px] text-amber-400 font-bold flex items-center gap-1.5 hover:underline"
              >
                <FaWandMagicSparkles className="w-3 h-3 text-amber-400" /> Highlight {m.highlight_node_ids.length} Nodes on Graph
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="p-3 bg-slate-900/80 rounded-2xl mr-6 border border-slate-800 text-xs text-indigo-400 flex items-center gap-2">
            <FaWandMagicSparkles className="w-4 h-4 animate-spin text-amber-400" /> Thinking & Reasoning...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          placeholder="Ask AetherBio AI a question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="glass-button p-2.5 rounded-xl text-indigo-300 bg-indigo-600/30 border-indigo-500/40"
        >
          <FaPaperPlane className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
