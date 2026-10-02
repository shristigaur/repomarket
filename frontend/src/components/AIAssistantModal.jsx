import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { LoaderCircle, Mic, MicOff, Send, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { apiFetch } from '../api';

const starterMessage = {
  role: 'model',
  content: 'Hi, I am your Micro-SaaS Liquidation Assistant. Ask me about code quality, valuation, tech compatibility, or listing a repository.'
};

function AssistantAvatar({ state }) {
  const stateLabel = state === 'speaking' ? 'Speaking' : state === 'thinking' ? 'Thinking' : 'Ready';
  return <div className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-coral ${state === 'speaking' ? 'animate-pulse' : ''}`} aria-label={`AI assistant avatar: ${stateLabel}`} role="img">
    <svg viewBox="0 0 48 48" className={`h-8 w-8 text-paper transition-transform ${state === 'thinking' ? 'rotate-6' : ''}`} aria-hidden="true">
      <path fill="currentColor" d="M24 4c-9.4 0-17 6.3-17 14.2 0 4.6 2.8 8.7 7.1 11.3L12 37l7.2-3.7c1.5.4 3.1.6 4.8.6 9.4 0 17-6.3 17-14.2S33.4 4 24 4Z" />
      <circle cx="18" cy="18" r="2" fill="#dc6f48" /><circle cx="30" cy="18" r="2" fill="#dc6f48" />
      <path d="M17 25c4 3 10 3 14 0" fill="none" stroke="#dc6f48" strokeLinecap="round" strokeWidth="2" />
    </svg>
    {state === 'thinking' && <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-yellow-300" />}
  </div>;
}

function speechText(markdown) {
  return markdown.replace(/[`*_>#-]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
}

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
  const [audience, setAudience] = useState('adult');
  const [speakingMessage, setSpeakingMessage] = useState(null);
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

  function speak(text, messageId = null) {
    if (!window.speechSynthesis) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }
    if (speakingMessage === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessage(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText(text));
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeakingMessage(messageId);
    utterance.onend = () => setSpeakingMessage(null);
    utterance.onerror = () => setSpeakingMessage(null);
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
      const response = await apiFetch('/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: nextMessages.filter((entry) => entry !== starterMessage),
          audience
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to reach the assistant.');
      const reply = { role: 'model', content: typeof data.reply === 'string' ? data.reply : '' };
      setMessages((current) => [...current, reply]);
      if (voiceInputUsed && autoSpeak) speak(data.reply, `message-${nextMessages.length}`);
      setVoiceInputUsed(false);
    } catch (requestError) {
      setMessages((current) => current.filter((entry) => entry !== nextMessages[nextMessages.length - 1]));
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const launcherClassName = 'fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-moss text-paper shadow-xl transition hover:-translate-y-1 hover:bg-[#285844] focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2';
  const overlayClassName = 'fixed inset-0 z-40 bg-black bg-opacity-30';
  const panelClassName = 'absolute bottom-0 right-0 flex h-screen w-full max-w-md flex-col border-l border-gray-300 bg-paper shadow-2xl sm:bottom-4 sm:right-4';
  const headerClassName = 'flex items-center justify-between border-b border-gray-300 bg-moss px-5 py-4 text-paper';
  const titleClassName = 'font-display text-sm font-semibold';
  const subtitleClassName = 'font-mono text-xs uppercase text-green-200';
  const closeButtonClassName = 'p-2 text-green-200 transition hover:text-paper';
  const controlsClassName = 'grid grid-cols-1 gap-3 border-b border-gray-300 bg-gray-100 px-5 py-3 sm:grid-cols-2';
  const labelClassName = 'flex items-center gap-2 font-mono text-xs uppercase text-gray-600';
  const selectClassName = 'min-w-0 flex-1 border border-gray-300 bg-paper px-2 py-1 text-xs normal-case text-moss outline-none focus:border-coral';
  const messagesClassName = 'flex-1 space-y-4 overflow-y-auto px-4 py-5';
  const modelBubbleClassName = 'min-w-0 max-w-[86%] break-words rounded-2xl rounded-bl-sm bg-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-800';
  const userBubbleClassName = 'min-w-0 max-w-[86%] break-words rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-sm leading-relaxed text-white';
  const listenButtonClassName = 'mt-2 inline-flex items-center gap-1 text-moss transition hover:text-coral';
  const formClassName = 'flex items-end gap-2 border-t border-gray-300 bg-gray-50 p-4';
  const inputClassName = 'max-h-28 min-h-10 flex-1 resize-none border border-gray-300 bg-paper px-3 py-2.5 text-sm text-moss outline-none placeholder:text-gray-400 focus:border-coral';
  const loadingRowClassName = 'flex justify-start';
  const spinnerClassName = 'animate-spin';
  const errorClassName = 'mx-4 mb-3 bg-red-100 px-3 py-2 text-xs text-red-800';
  const sendButtonClassName = 'grid h-10 w-10 shrink-0 place-items-center bg-coral text-paper transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50';

  return <>
    <button className={launcherClassName} onClick={() => setOpen(true)} aria-label={'Open AI assistant'} title={'Open AI assistant'}><Sparkles size={23} /></button>

    {open ? <div className={overlayClassName} onClick={closeModal}>
      <section className={panelClassName} role={'dialog'} aria-modal={'true'} aria-label={'AI liquidation assistant'} onClick={(event) => event.stopPropagation()}>
          <header className={headerClassName}>
            <div>
              <AssistantAvatar state={loading ? 'thinking' : speakingMessage ? 'speaking' : 'idle'} />
              <div>
                <p className={titleClassName}>Liquidation assistant</p>
                <p className={subtitleClassName}>{loading ? 'Thinking through it' : speakingMessage ? 'Speaking aloud' : 'Buyer trust, clarified'}</p>
              </div>
            </div>
            <button className={closeButtonClassName} onClick={closeModal} aria-label={'Close assistant'}><X size={19} /></button>
          </header>
        <div className={controlsClassName}>
          <label className={labelClassName} htmlFor={'assistant-audience'}>Audience
            <select id={'assistant-audience'} value={audience} onChange={(event) => setAudience(event.target.value)} className={selectClassName}>
              <option value={'children'}>Children</option><option value={'teenage'}>Teenage</option><option value={'adult'}>Adult</option><option value={'man'}>Man</option><option value={'oldage'}>Older adult</option>
            </select>
          </label>
          <label className={labelClassName}><input type={'checkbox'} checked={autoSpeak} onChange={(event) => setAutoSpeak(event.target.checked)} /> Auto-speak voice replies</label>
        </div>
        <div className={messagesClassName} aria-live={'polite'}>
          {messages.map((message, index) => {
            const isModel = message.role === 'model';
            const messageId = `message-${index}`;
            return <div className={`flex ${isModel ? 'justify-start' : 'justify-end'}`} key={messageId}>
              <div className={isModel ? modelBubbleClassName : userBubbleClassName}>
                <ReactMarkdown>{message.content || ''}</ReactMarkdown>
                {isModel && index > 0 && <button className={listenButtonClassName} onClick={() => speak(message.content, messageId)} aria-label={speakingMessage === messageId ? 'Stop reading response' : 'Read response aloud'} title={speakingMessage === messageId ? 'Stop reading response' : 'Read response aloud'}>{speakingMessage === messageId ? <VolumeX size={15} /> : <Volume2 size={15} />}<span>{speakingMessage === messageId ? 'Stop' : 'Listen'}</span></button>}
              </div>
            </div>;
          })}
          {loading && <div className={loadingRowClassName}><div className={modelBubbleClassName}><LoaderCircle className={spinnerClassName} size={18} aria-label={'Assistant is typing'} /></div></div>}
          <div ref={messagesEndRef} />
        </div>
          {error && <div className={errorClassName} role={'alert'}>{error}</div>}
        <form className={formClassName} onSubmit={sendMessage}>
          <button type={'button'} className={`grid h-10 w-10 shrink-0 place-items-center border ${listening ? 'border-coral bg-red-100 text-coral' : 'border-gray-300 text-moss'} transition hover:border-moss`} onClick={startVoiceInput} aria-label={listening ? 'Stop voice input' : 'Start voice input'} title={listening ? 'Stop voice input' : 'Speak your question'}>{listening ? <MicOff size={18} /> : <Mic size={18} />}</button>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }} rows={1} placeholder={'Ask about a repository...'} className={inputClassName} aria-label={'Assistant message'} />
          <button type={'submit'} disabled={!input.trim() || loading} className={sendButtonClassName} aria-label={'Send message'} title={'Send message'}><Send size={17} /></button>
        </form>
      </section>
    </div> : null}
  </>;
}
