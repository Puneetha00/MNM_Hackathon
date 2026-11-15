import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  largeFont: boolean;
  setLargeFont: (val: boolean) => void;
  toggleLargeFont: () => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  toggleHighContrast: () => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (val: boolean) => void;
  toggleVoiceEnabled: () => void;
  simpleNav: boolean;
  setSimpleNav: (val: boolean) => void;
  toggleSimpleNav: () => void;
  speak: (text: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [largeFont, setLargeFont] = useState<boolean>(() => localStorage.getItem('ec_large_font') === 'true');
  const [highContrast, setHighContrast] = useState<boolean>(() => localStorage.getItem('ec_high_contrast') === 'true');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => localStorage.getItem('ec_voice_enabled') !== 'false');
  const [simpleNav, setSimpleNav] = useState<boolean>(() => localStorage.getItem('ec_simple_nav') === 'true');

  useEffect(() => {
    localStorage.setItem('ec_large_font', String(largeFont));
    if (largeFont) {
      document.documentElement.classList.add('text-lg');
    } else {
      document.documentElement.classList.remove('text-lg');
    }
  }, [largeFont]);

  useEffect(() => {
    localStorage.setItem('ec_high_contrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('ec_voice_enabled', String(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem('ec_simple_nav', String(simpleNav));
  }, [simpleNav]);

  const toggleLargeFont = () => setLargeFont((prev) => !prev);
  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleVoiceEnabled = () => setVoiceEnabled((prev) => !prev);
  const toggleSimpleNav = () => setSimpleNav((prev) => !prev);

  const speak = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower, very clear for seniors
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis fallback
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        largeFont,
        setLargeFont,
        toggleLargeFont,
        highContrast,
        setHighContrast,
        toggleHighContrast,
        voiceEnabled,
        setVoiceEnabled,
        toggleVoiceEnabled,
        simpleNav,
        setSimpleNav,
        toggleSimpleNav,
        speak,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
