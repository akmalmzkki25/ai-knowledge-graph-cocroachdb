import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  FaRobot, 
  FaPaperPlane, 
  FaXmark, 
  FaWandMagicSparkles,
  FaTrash
} from 'react-icons/fa6';
import { askCopilot } from '../services/api';

const DEFAULT_WELCOME_MSG = {
  sender: 'ai',
  text: 'Hello! I am your **AetherBio Copilot**. Ask me any research question about biological entities, drug mechanisms, or pathway links in your graph.'
};

export default function CopilotDrawer({ isOpen, onClose, onHighlightNodes }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('aetherbio_copilot_chat');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [DEFAULT_WELCOME_MSG];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('aetherbio_copilot_chat', JSON.stringify(messages));
  }, [messages]);

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

  const handleClearHistory = () => {
    if (window.confirm('Clear all Copilot chat history?')) {
      setMessages([DEFAULT_WELCOME_MSG]);
      localStorage.removeItem('aetherbio_copilot_chat');
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
        <div className="flex items-center space-x-2">
          <button onClick={handleClearHistory} className="p-1 text-slate-400 hover:text-red-400" title="Clear Chat History">
            <FaTrash className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Message Feed with ReactMarkdown */}
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
            {m.sender === 'user' ? (
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
            ) : (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed prose-p:my-1 prose-headings:my-1 prose-headings:text-indigo-300 prose-ul:my-1 prose-li:my-0.5">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            )}
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

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask AI Copilot about entities or pathways..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 transition"
        >
          <FaPaperPlane className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
