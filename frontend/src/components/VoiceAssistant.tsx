import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X } from 'lucide-react';
import { api } from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';

export const VoiceAssistant: React.FC<{ onActionCompleted?: () => void }> = ({ onActionCompleted }) => {
  const { voiceEnabled, speak } = useAccessibility();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setRecognitionSupported(!!SpeechRecognition);
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. You can type commands instead.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening... Speak now');
        setResponseMessage('');
      };

      recognition.onresult = async (event: any) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(`"${spokenText}"`);
        setIsListening(false);

        try {
          const res = await api.sendVoiceCommand(spokenText);
          setResponseMessage(res.response_speech);
          speak(res.response_speech);
          if (onActionCompleted) onActionCompleted();
        } catch {
          const fallback = "Sorry, I couldn't process that command. Please try again.";
          setResponseMessage(fallback);
          speak(fallback);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setTranscript("Couldn't hear clearly. Try again!");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSimulatedCommand = async (cmd: string) => {
    setTranscript(`"${cmd}"`);
    try {
      const res = await api.sendVoiceCommand(cmd);
      setResponseMessage(res.response_speech);
      speak(res.response_speech);
      if (onActionCompleted) onActionCompleted();
    } catch {
      setResponseMessage("Action processed.");
    }
  };

  return (
    <>
      {/* Floating Voice Assistant Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-700 hover:to-primary-700 text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group ring-4 ring-white"
        title="Open ElderCare Voice Assistant"
      >
        <Mic className="w-6 h-6 animate-pulse" />
        <span className="hidden md:inline font-bold text-sm pr-1">Voice Help</span>
      </button>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-up p-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">ElderCare Voice Assistant</h3>
                  <p className="text-xs text-slate-500">Accessible voice navigation</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Listening Orb */}
            <div className="py-8 text-center flex flex-col items-center">
              <button
                onClick={startListening}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white ring-8 ring-rose-200 animate-pulse scale-110'
                    : 'bg-brand-600 hover:bg-brand-700 text-white ring-4 ring-brand-100'
                }`}
              >
                {isListening ? <Mic className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>

              <p className="mt-4 font-bold text-slate-800 text-base">
                {isListening ? "Listening... Speak your command" : "Tap microphone to speak"}
              </p>
              
              {transcript && (
                <p className="mt-2 text-sm text-brand-700 italic max-w-xs">{transcript}</p>
              )}

              {responseMessage && (
                <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded-2xl text-xs text-brand-900 font-semibold flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>{responseMessage}</span>
                </div>
              )}
            </div>

            {/* Quick Suggested Voice Prompts */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Or tap a common action:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSimulatedCommand("What is my next medicine?")}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-left font-medium transition-colors"
                >
                  💊 "What is my next medicine?"
                </button>
                <button
                  onClick={() => handleSimulatedCommand("Mark morning pills as taken")}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-left font-medium transition-colors"
                >
                  ✅ "Mark dose as taken"
                </button>
                <button
                  onClick={() => handleSimulatedCommand("Add water")}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-left font-medium transition-colors"
                >
                  💧 "Add glass of water"
                </button>
                <button
                  onClick={() => handleSimulatedCommand("Emergency help")}
                  className="p-2.5 bg-emergency-50 hover:bg-emergency-100 text-emergency-800 rounded-xl border border-emergency-200 text-left font-bold transition-colors"
                >
                  🚨 "Emergency help"
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
