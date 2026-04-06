import { AnimatePresence, motion } from 'motion/react';
import { startTransition, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getCurrentUserRole } from '../lib/session';
import { aiCopilotService } from '../services/aiCopilotService';
import type { AICopilotMessage } from '../types/ai.types';

const WELCOME_MESSAGE: AICopilotMessage = {
  id: 'ai-copilot-welcome',
  role: 'assistant',
  content: 'Welcome to EduMerge AI. How can I assist with your institutional analytics today?',
  status: 'done',
};

const canUseAICopilot = (role: string) => role === 'ADMIN' || role === 'MANAGEMENT';

const ChatMessage = ({
  message,
  showSpeculativeState,
}: {
  message: AICopilotMessage;
  showSpeculativeState: boolean;
}) => {
  const isAssistant = message.role === 'assistant';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex flex-col gap-1 max-w-[95%] animate-in fade-in slide-in-from-bottom-1 duration-300 ${isAssistant ? '' : 'ml-auto items-end'}`}>
      <div className={`relative px-1 py-1 ${isAssistant ? '' : 'text-right'}`}>
        {isAssistant && message.id !== 'ai-copilot-welcome' && (
          <div className="mb-2 inline-flex items-center gap-1.5 text-primary text-[10px] font-bold tracking-tight">
            <span className="material-symbols-outlined text-[14px] fill-1">auto_awesome</span>
            Institutional Insight
          </div>
        )}
        
        <div className={`text-[13px] font-semibold text-slate-700 selection:bg-primary/10 ${!isAssistant ? 'text-primary' : ''}`}>
          <div className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-primary prose-strong:font-black">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {showSpeculativeState && (
             <div className="flex gap-1 mt-3 h-4 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse [animation-delay:0.4s]"></div>
             </div>
          )}
        </div>
      </div>
      <span className="text-[9px] font-semibold text-slate-500/80 mx-2">
        {isAssistant ? `Assistant • ${time}` : `You • ${time}`}
      </span>
    </div>
  );
};

export const AICopilot = () => {
  const role = getCurrentUserRole();
  const canAccess = canUseAICopilot(role);
  const chatViewportRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [chatHistory, setChatHistory] = useState<AICopilotMessage[]>([WELCOME_MESSAGE]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStreamedText, setCurrentStreamedText] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
    }
  }, [chatHistory, currentStreamedText, isOpen]);

  if (!canAccess) return null;

  const submitPrompt = async () => {
    const prompt = draft.trim();
    if (!prompt || isGenerating) return;

    const userMessage: AICopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      status: 'done',
    };
    const assistantMessageId = crypto.randomUUID();

    setDraft('');
    setCurrentStreamedText('');
    setStreamingMessageId(assistantMessageId);
    setIsGenerating(true);
    setChatHistory((p) => [
      ...p,
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        status: 'streaming',
      },
    ]);

    try {
      let accumulated = '';
      await aiCopilotService.streamChatResponse(prompt, chatHistory, (chunk: string) => {
        accumulated += chunk;
        startTransition(() => {
          setCurrentStreamedText(accumulated);
          setChatHistory((p) =>
            p.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: accumulated, status: 'streaming' }
                : m
            )
          );
        });
      });

      setChatHistory((p) =>
        p.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: accumulated.trim() || 'Synthesis complete. No outliers detected.',
                status: 'done',
              }
            : m
        )
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Telemetry offline.';
      setChatHistory((p) =>
        p.map((m) =>
          m.id === assistantMessageId ? { ...m, content: msg, status: 'error' } : m
        )
      );
    } finally {
      setIsGenerating(false);
      setStreamingMessageId(null);
    }
  };

  const handleComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submitPrompt();
    }
  };

  return (
    <>
      {/* Professional Toggle Button */}
      <div className="fixed bottom-8 right-8 z-[500]">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all border ${
            isOpen ? 'bg-primary border-primary text-white shadow-primary/20' : 'bg-white border-slate-200 text-primary hover:border-primary/40 shadow-sm'
          }`}
        >
          {isOpen ? (
            <span className="material-symbols-outlined text-[26px] transition-transform duration-300 rotate-90">
              close
            </span>
          ) : (
            <motion.span
              animate={{ 
                scale: [1, 1.12, 1],
                opacity: [1, 0.85, 1] 
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="material-symbols-outlined text-[26px]"
            >
              auto_awesome
            </motion.span>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-28 right-8 z-[490] flex h-[650px] w-full max-w-[400px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_30px_90px_rgba(0,0,0,0.12)] border border-slate-200"
          >
            {/* Professional Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-black text-slate-900 tracking-tight">EduMerge AI</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]"></span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Message Stream: Dense */}
            <div ref={chatViewportRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide">
              {chatHistory.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  showSpeculativeState={
                     m.id === streamingMessageId && isGenerating && currentStreamedText.length === 0
                  }
                />
              ))}
            </div>

            {/* Execution Input: Compact & Centered */}
            <div className="px-6 pb-6 pt-3 bg-slate-50/30 border-t border-slate-100">
              <div className="relative flex items-center gap-3 bg-white border border-slate-200 rounded-[1.25rem] pl-6 pr-2 py-1.5 shadow-sm focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Analyze telemetry..."
                  rows={1}
                  disabled={isGenerating}
                  className="flex-1 bg-transparent py-2.5 text-[14px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none resize-none scrollbar-hide min-h-[44px] max-h-[140px]"
                />
                <button
                  onClick={() => void submitPrompt()}
                  disabled={!draft.trim() || isGenerating}
                  className="h-9 w-9 shrink-0 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all active:scale-90 disabled:opacity-10 shadow-lg shadow-primary/20"
                >
                   {isGenerating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};




