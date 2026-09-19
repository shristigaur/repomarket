import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, LoaderCircle, Mic, MicOff, Send, Sparkles, Volume2, X } from 'lucide-react';
import { API_BASE_URL } from '../auth';

const starterMessage = {
  role: 'model',
  content: 'Hi, I am your Micro-SaaS Liquidation Assistant. Ask me about code quality, valuation, tech compatibility, or listing a repository.'
};

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function AIAssistantModal() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([starterMessage]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceInputUsed, setVoiceInputUsed] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  function closeModal() {
    recognitionRef.current?.stop();
    setListening(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setOpen(false);
  }

  function speak(text) {
    if (!window.speechSynthesis) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function startVoiceInput() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => { setListening(true); setError(''); };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((current) => `${current} ${transcript}`.trim());
      setVoiceInputUsed(true);
      recognition.stop();
    };
    recognition.onerror = () => setError('We could not hear that. Please try again.');
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }

  async function sendMessage(event) {
    event?.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const nextMessages = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: nextMessages.filter((entry) => entry !== starterMessage)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to reach the assistant.');
      const reply = { role: 'model', content: data.reply };
      setMessages((current) => [...current, reply]);
      if (voiceInputUsed && autoSpeak) speak(data.reply);
      setVoiceInputUsed(false);
    } catch (requestError) {
      setMessages((current) => current.filter((entry) => entry !== nextMessages[nextMessages.length - 1]));
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return <>
    <button className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-moss text-paper shadow-[0_8px_24px_rgba(24,60,48,.25)] transition hover:-translate-y-1 hover:bg-[#285844] focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2" onClick={() => setOpen(true)} aria-label="Open AI assistant" title="Open AI assistant"><Sparkles size={23} /></button>

    {open && <div className="fixed inset-0 z-40 bg-[#18231f]/35" onClick={closeModal}>
      <section className="absolute bottom-0 right-0 flex h-[min(720px,100vh)] w-full max-w-[440px] flex-col border-l border-[#d8d9d0] bg-paper shadow-2xl sm:bottom-4 sm:right-4 sm:h-[min(720px,calc(100vh-2rem))]" role="dialog" aria-modal="true" aria-label="AI liquidation assistant" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-[#d8d9d0] bg-moss px-5 py-4 text-paper"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-coral"><Bot size={19} /></span><div><p className="font-display text-sm font-semibold">Liquidation assistant</p><p className="font-mono text-[9px] uppercase tracking-[.08em] text-[#b9d9c4]">Buyer trust, clarified</p></div></div><button className="p-2 text-[#b9d9c4] transition hover:text-paper" onClick={closeModal} aria-label="Close assistant"><X size={19} /></button></header>
        <div className="flex items-center justify-between border-b border-[#d8d9d0] bg-[#e3e9e1] px-5 py-3"><label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.06em] text-[#657067]"><input type="checkbox" checked={autoSpeak} onChange={(event) => setAutoSpeak(event.target.checked)} disabled={!voiceInputUsed} className="accent-[#dc6f48]" /> Auto-speak voice replies</label><span className="font-mono text-[9px] text-[#879087]">{voiceInputUsed ? 'Voice mode ready' : 'Text mode'}</span></div>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">{messages.map((message, index) => <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} key={`${message.role}-${index}`}><div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'rounded-br-sm bg-[#2f75b5] text-white' : 'rounded-bl-sm bg-[#e8e3f1] text-[#31313f]'}`}><ReactMarkdown>{message.content}</ReactMarkdown>{message.role === 'model' && index > 0 && <button className="mt-2 inline-flex items-center gap-1 text-[#6d5a8f] transition hover:text-[#493467]" onClick={() => speak(message.content)} aria-label="Read response aloud" title="Read response aloud"><Volume2 size={15} /><span className="font-mono text-[9px] uppercase tracking-[.06em]">Listen</span></button>}</div></div>)}{loading && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-sm bg-[#e8e3f1] px-4 py-3 text-[#6d5a8f]"><LoaderCircle className="animate-spin" size={18} aria-label="Assistant is typing" /></div></div>}<div ref={messagesEndRef} /></div>
        {error && <div className="mx-4 mb-3 bg-[#f5ddd4] px-3 py-2 text-xs text-[#8b3d2b]" role="alert">{error}</div>}
        <form className="flex items-end gap-2 border-t border-[#d8d9d0] bg-[#f8f7f1] p-4" onSubmit={sendMessage}><button type="button" className={`grid h-10 w-10 shrink-0 place-items-center border ${listening ? 'border-coral bg-[#f5ddd4] text-coral' : 'border-[#cbd1c8] text-moss'} transition hover:border-moss`} onClick={startVoiceInput} aria-label={listening ? 'Stop voice input' : 'Start voice input'} title={listening ? 'Stop voice input' : 'Speak your question'}>{listening ? <MicOff size={18} /> : <Mic size={18} />}</button><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }} rows="1" placeholder="Ask about a repository..." className="max-h-28 min-h-10 flex-1 resize-none border border-[#cbd1c8] bg-paper px-3 py-2.5 text-sm text-moss outline-none placeholder:text-[#9ca69d] focus:border-coral focus:ring-2 focus:ring-coral/15" aria-label="Assistant message" /><button type="submit" disabled={!input.trim() || loading} className="grid h-10 w-10 shrink-0 place-items-center bg-coral text-paper transition hover:bg-[#c75e3d] disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message" title="Send message"><Send size={17} /></button></form>
      </section>
    </div>}
  </>;
}
