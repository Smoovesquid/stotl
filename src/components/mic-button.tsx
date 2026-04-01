'use client';

import { useState, useRef, useCallback } from 'react';

interface MicButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export function MicButton({ onRecordingComplete, disabled }: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        onRecordingComplete(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      // Mic permission denied — user sees the text input fallback
      console.warn('Microphone access denied');
    }
  }, [disabled, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={stopRecording}
        disabled={disabled}
        className={`w-16 h-16 rounded-full border flex items-center justify-center
          transition-all duration-300 touch-none select-none
          ${isRecording
            ? 'border-[#c4a265] bg-[#c4a265]/10 scale-110'
            : 'border-[#2a2520] hover:border-[#4a3e2a]'
          }
          ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={isRecording ? 'Release to send' : 'Hold to speak'}
      >
        <div className={`w-[18px] h-[26px] border-[1.5px] rounded-[9px] relative
          ${isRecording ? 'border-[#c4a265]' : 'border-[#5a4e3a]'}
        `}>
          <div className={`absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-[1.5px] h-[7px]
            ${isRecording ? 'bg-[#c4a265]' : 'bg-[#5a4e3a]'}
          `} />
        </div>
      </button>
      <span className="text-[9px] tracking-[2px] uppercase font-sans"
        style={{ color: isRecording ? '#c4a265' : '#1a1714' }}>
        {isRecording ? 'Release to send' : 'Hold to speak'}
      </span>
    </div>
  );
}
