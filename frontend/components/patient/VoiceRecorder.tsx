"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Loader2, AlertCircle, RotateCw } from "lucide-react";
import type { VoiceLifecycleState } from "@/stores/intake.store";

export interface VoiceRecorderProps {
  /**
   * Called when a valid recording completes.
   * @param audioBlob The recorded audio Blob
   * @param mimeType The MIME type used by MediaRecorder
   * @param extension Suggested file extension (e.g. "webm", "ogg", "mp4", "wav")
   */
  onRecorded: (audioBlob: Blob, mimeType: string, extension: string) => void;
  disabled?: boolean;
  isUploading?: boolean;
  voiceState?: VoiceLifecycleState;
  uploadError?: string | null;
  onClearError?: () => void;
  onRetry?: () => void;
  hasAudioToRetry?: boolean;
}

type RecorderState = "idle" | "recording" | "stopping";

const MAX_RECORDING_SECONDS = 60;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB

interface MimeCandidate {
  mimeType: string;
  extension: string;
}

const MIME_CANDIDATES: MimeCandidate[] = [
  { mimeType: "audio/webm;codecs=opus", extension: "webm" },
  { mimeType: "audio/webm", extension: "webm" },
  { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
  { mimeType: "audio/mp4", extension: "mp4" },
  { mimeType: "audio/wav", extension: "wav" },
];

function pickSupportedMime(): MimeCandidate {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return { mimeType: "", extension: "webm" };
  }
  for (const candidate of MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
        return candidate;
      }
    } catch {
      // Ignore detection errors on older browsers
    }
  }
  return { mimeType: "", extension: "webm" };
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function VoiceRecorder({
  onRecorded,
  disabled = false,
  isUploading = false,
  voiceState,
  uploadError = null,
  onClearError,
  onRetry,
  hasAudioToRetry = false,
}: VoiceRecorderProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lazy initialization for browser feature support
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function" && typeof MediaRecorder !== "undefined");
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeMimeRef = useRef<MimeCandidate>({ mimeType: "", extension: "webm" });

  // Cleanup stream tracks
  const stopStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Clear timer
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
    };
  }, [clearTimer, stopStream]);

  // Stop recording handler
  const stopRecording = useCallback(() => {
    setRecorderState((current) => {
      if (current !== "recording") return current;
      clearTimer();

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          stopStream();
          return "idle";
        }
      } else {
        stopStream();
        return "idle";
      }
      return "stopping";
    });
  }, [clearTimer, stopStream]);

  // Start recording handler
  async function startRecording() {
    if (disabled || isUploading || recorderState !== "idle") return;

    setErrorMessage(null);
    if (onClearError) onClearError();
    chunksRef.current = [];

    if (!isSupported) {
      setErrorMessage("Voice recording is not supported in this browser. You can continue using text.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const candidate = pickSupportedMime();
      activeMimeRef.current = candidate;

      const options: MediaRecorderOptions = {};
      if (candidate.mimeType) {
        options.mimeType = candidate.mimeType;
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const parts = chunksRef.current;
        stopStream();
        setRecorderState("idle");
        setElapsedSeconds(0);

        const mime = activeMimeRef.current.mimeType || recorder.mimeType || "audio/webm";
        const blob = new Blob(parts, { type: mime });

        console.debug("[VoiceRecorder] onstop triggered, blob created:", {
          size: blob.size,
          mime,
          extension: activeMimeRef.current.extension,
          partsCount: parts.length,
        });

        if (blob.size === 0) {
          setErrorMessage("We couldn't capture your recording. Please try again.");
          return;
        }

        if (blob.size > MAX_AUDIO_BYTES) {
          setErrorMessage("Your recording is too large. Please record a shorter answer.");
          return;
        }

        onRecorded(blob, mime, activeMimeRef.current.extension);
      };

      recorder.start(250); // Slice data every 250ms
      setRecorderState("recording");
      setElapsedSeconds(0);

      // Start elapsed timer with 60s auto-stop
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch (err: unknown) {
      stopStream();
      setRecorderState("idle");
      clearTimer();

      const error = err as { name?: string; message?: string };
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setErrorMessage("Microphone access was denied. Please allow microphone access and try again.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setErrorMessage("No microphone was detected on your device. Please connect a microphone or use text.");
      } else {
        setErrorMessage("Could not start recording. Please check your microphone settings or use text.");
      }
    }
  }

  const effectiveError = errorMessage || uploadError;
  const isBusy =
    isUploading ||
    voiceState === "UPLOADING" ||
    voiceState === "TRANSCRIBING" ||
    voiceState === "PROCESSING" ||
    voiceState === "RESPONDING";

  function getStatusText(): string {
    switch (voiceState) {
      case "UPLOADING":
        return "Sending audio...";
      case "TRANSCRIBING":
        return "Understanding your response...";
      case "PROCESSING":
        return "Preparing your next question...";
      case "RESPONDING":
        return "Updating intake...";
      default:
        return "Processing your answer...";
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Screen reader live announcements */}
      <div className="sr-only" aria-live="polite">
        {recorderState === "recording" && `Recording started. Time limit is ${MAX_RECORDING_SECONDS} seconds.`}
        {recorderState === "stopping" && "Recording stopped. Preparing audio."}
        {isBusy && getStatusText()}
        {effectiveError && `Voice error: ${effectiveError}`}
      </div>

      {/* Main control container */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        {recorderState === "recording" ? (
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Stop voice recording"
            className="h-12 px-6 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-sm flex items-center justify-center gap-2.5 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-w-[200px] cursor-pointer"
          >
            <span className="w-3 h-3 rounded-sm bg-white animate-pulse" />
            <Square className="w-4 h-4 fill-current" />
            <span>Tap to stop ({formatTimer(elapsedSeconds)})</span>
          </button>
        ) : isBusy ? (
          <div className="h-12 px-6 rounded-xl bg-[#F7F9FC] border border-[#E4E7EC] text-[#155EEF] font-medium text-sm flex items-center justify-center gap-2.5 min-w-[240px] shadow-xs">
            <Loader2 className="w-4 h-4 animate-spin text-[#155EEF]" />
            <span className="transition-all duration-200">{getStatusText()}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || !isSupported}
            aria-label="Start voice recording"
            className="h-12 px-6 rounded-xl bg-white hover:bg-blue-50 active:bg-blue-100 border-2 border-[#155EEF] text-[#155EEF] font-semibold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#155EEF] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-w-[180px] cursor-pointer"
          >
            <Mic className="w-5 h-5 text-[#155EEF]" />
            <span>Tap to speak</span>
          </button>
        )}
      </div>

      {/* Helper text during recording */}
      {recorderState === "recording" && (
        <p className="text-xs text-red-600 font-medium mt-2 text-center animate-pulse">
          Listening... Speak clearly into your microphone.
        </p>
      )}

      {/* Hint text when idle */}
      {recorderState === "idle" && !isBusy && isSupported && (
        <p className="text-xs text-[#667085] mt-2 text-center">
          Speak in English, Hindi (हिंदी), or Hinglish. Maximum {MAX_RECORDING_SECONDS} seconds.
        </p>
      )}

      {/* Unsupported browser warning */}
      {!isSupported && (
        <p className="text-xs text-[#667085] mt-2 text-center">
          Voice recording is not supported in this browser. You can continue using text.
        </p>
      )}

      {/* Error display with recoverable retry */}
      {effectiveError && (
        <div className="mt-3 flex flex-col gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-[#D92D20] max-w-md w-full shadow-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
            <div className="flex-1 font-medium leading-relaxed">
              {effectiveError}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 justify-end">
            {hasAudioToRetry && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Sending Audio</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                if (onClearError) onClearError();
              }}
              className="px-2.5 py-1.5 rounded-md border border-red-200 bg-white hover:bg-red-50 text-red-700 font-medium text-xs transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}