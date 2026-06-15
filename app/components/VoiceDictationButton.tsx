"use client";

import { RefObject, useRef, useState } from "react";

type VoiceDictationButtonProps = {
  value: string;
  onChange: (nextValue: string) => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
  buttonLabel?: string;
};

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognitionResultAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  item: (index: number) => SpeechRecognitionResultAlternative;
  [index: number]: SpeechRecognitionResultAlternative;
};

type SpeechRecognitionResultList = {
  length: number;
  item: (index: number) => SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
  message?: string;
};

type SpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function capitalizeFirstLetter(text: string) {
  return text.replace(/^(\s*)([a-z])/, (_, spaces: string, letter: string) => {
    return `${spaces}${letter.toUpperCase()}`;
  });
}

function capitalizeAfterSentencePunctuation(text: string) {
  return text.replace(
    /([.!?]\s+)([a-z])/g,
    (_match: string, punctuationAndSpace: string, letter: string) => {
      return `${punctuationAndSpace}${letter.toUpperCase()}`;
    }
  );
}

function normalizeVoiceCommands(rawText: string) {
  let text = rawText;

  const replacements: Array<[RegExp, string]> = [
    [/\bnew paragraph\b/gi, "\n\n"],
    [/\bnew line\b/gi, "\n"],
    [/\bline break\b/gi, "\n"],

    [/\bperiod\b/gi, ". "],
    [/\bfull stop\b/gi, ". "],
    [/\bcomma\b/gi, ", "],
    [/\bquestion mark\b/gi, "? "],
    [/\bexclamation point\b/gi, "! "],
    [/\bexclamation mark\b/gi, "! "],
    [/\bcolon\b/gi, ": "],
    [/\bsemicolon\b/gi, "; "],
    [/\bsemi colon\b/gi, "; "],

    [/\bopen quote\b/gi, "“"],
    [/\bclose quote\b/gi, "”"],
    [/\bquote\b/gi, '"'],
    [/\bapostrophe\b/gi, "'"],
    [/\bspace\b/gi, " "],
  ];

  replacements.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  text = text.replace(/\s+([.,?!:;])/g, "$1");
  text = text.replace(/([.,?!:;])([A-Za-z])/g, "$1 $2");
  text = text.replace(/\s+\n/g, "\n");
  text = text.replace(/\n\s+/g, "\n");
  text = text.replace(/[ \t]{2,}/g, " ");

  text = capitalizeFirstLetter(text);
  text = capitalizeAfterSentencePunctuation(text);

  return text;
}

function shouldCapitalizeInsertedText({
  baseValue,
  selectionStart,
}: {
  baseValue: string;
  selectionStart: number;
}) {
  const beforeCursor = baseValue.slice(0, selectionStart).trimEnd();

  if (!beforeCursor) return true;

  return /[.!?]$/.test(beforeCursor);
}

function insertTextAtSelection({
  baseValue,
  insertedText,
  selectionStart,
  selectionEnd,
}: {
  baseValue: string;
  insertedText: string;
  selectionStart: number;
  selectionEnd: number;
}) {
  const before = baseValue.slice(0, selectionStart);
  const after = baseValue.slice(selectionEnd);

  let cleanedText = normalizeVoiceCommands(insertedText).trim();

  if (
    shouldCapitalizeInsertedText({
      baseValue,
      selectionStart,
    })
  ) {
    cleanedText = capitalizeFirstLetter(cleanedText);
  }

  const needsLeadingSpace =
    before.length > 0 &&
    !before.endsWith(" ") &&
    !before.endsWith("\n") &&
    cleanedText.length > 0 &&
    !cleanedText.startsWith(".") &&
    !cleanedText.startsWith(",") &&
    !cleanedText.startsWith("?") &&
    !cleanedText.startsWith("!") &&
    !cleanedText.startsWith(":") &&
    !cleanedText.startsWith(";") &&
    !cleanedText.startsWith("\n");

  const needsTrailingSpace =
    after.length > 0 &&
    !after.startsWith(" ") &&
    !after.startsWith("\n") &&
    cleanedText.length > 0 &&
    !cleanedText.endsWith(" ") &&
    !cleanedText.endsWith("\n");

  const leadingSpace = needsLeadingSpace ? " " : "";
  const trailingSpace = needsTrailingSpace ? " " : "";

  return {
    nextValue: `${before}${leadingSpace}${cleanedText}${trailingSpace}${after}`,
    insertedLength: leadingSpace.length + cleanedText.length,
  };
}

export default function VoiceDictationButton({
  value,
  onChange,
  textareaRef,
  disabled = false,
  buttonLabel = "Voice Draft",
}: VoiceDictationButtonProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const baseValueRef = useRef("");
  const selectionStartRef = useRef(0);
  const selectionEndRef = useRef(0);

  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function getRecognition() {
    const RecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!RecognitionConstructor) return null;

    const recognition = new RecognitionConstructor();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    return recognition;
  }

  function updateTextareaLive(transcript: string) {
    const cleanedTranscript = normalizeVoiceCommands(transcript).trim();

    if (!cleanedTranscript) return;

    const { nextValue, insertedLength } = insertTextAtSelection({
      baseValue: baseValueRef.current,
      insertedText: cleanedTranscript,
      selectionStart: selectionStartRef.current,
      selectionEnd: selectionEndRef.current,
    });

    onChange(nextValue);

    requestAnimationFrame(() => {
  const textarea = textareaRef?.current;
  if (!textarea) return;

  const cursorPosition = selectionStartRef.current + insertedLength;

  const textareaScrollTop = textarea.scrollTop;
  const pageScrollX = window.scrollX;
  const pageScrollY = window.scrollY;

  textarea.focus({ preventScroll: true });
  textarea.setSelectionRange(cursorPosition, cursorPosition);

  textarea.scrollTop = textareaScrollTop;
  window.scrollTo(pageScrollX, pageScrollY);
});
  }

  function startListening() {
    setErrorMessage("");

    if (typeof window === "undefined") return;

    const recognition = getRecognition();

    if (!recognition) {
      setErrorMessage(
        "Voice dictation is not available in this browser. Try Chrome on desktop."
      );
      return;
    }

    const textarea = textareaRef?.current;

    baseValueRef.current = value;
    selectionStartRef.current = textarea?.selectionStart ?? value.length;
    selectionEndRef.current = textarea?.selectionEnd ?? value.length;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setErrorMessage(
        event.message || `Voice dictation stopped: ${event.error}`
      );
    };

    recognition.onresult = (event) => {
      let fullTranscript = "";

      for (let index = 0; index < event.results.length; index++) {
        const result = event.results[index];
        const transcript = result[0]?.transcript || "";

        fullTranscript = `${fullTranscript} ${transcript}`;
      }

      updateTextareaLive(fullTranscript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={isListening ? stopListening : startListening}
        style={{
          backgroundColor: isListening ? "#b38b16" : "#d4af37",
          color: "#111111",
          borderRadius: "16px",
          padding: "12px 18px",
          fontWeight: 900,
          fontSize: "14px",
          border: "1px solid rgba(0,0,0,0.12)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          minWidth: "170px",
          boxShadow: isListening
            ? "0 10px 24px rgba(212, 175, 55, 0.35)"
            : "0 8px 20px rgba(212, 175, 55, 0.22)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>🎙️</span>
        <span>{isListening ? "Stop Listening" : buttonLabel}</span>
      </button>

      {isListening ? (
        <div className="mt-3 rounded-2xl border border-[#d4af37]/40 bg-[#fff6d8] p-4 text-sm font-bold leading-6 text-black/70">
          Listening now. Speak naturally, or say period, comma, new paragraph,
          colon, semicolon, or question mark.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-3 rounded-2xl bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}