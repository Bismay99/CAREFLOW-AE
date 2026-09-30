"use client";
import { create } from "zustand";
import type { ExtractedEntitySummary, IntakeTurnResponse, IntakeSubmitResponse } from "@/types/intake";

/** A single question-answer exchange in the conversation history. */
export interface ConversationEntry {
  question: string;
  fieldName: string;
  answer: string;
  isVoice?: boolean;
  detectedLanguage?: string | null;
  entities: ExtractedEntitySummary[];
  turnNumber: number;
}

type IntakePhase = "idle" | "starting" | "in_progress" | "submitting" | "submitted" | "error";

export type VoiceLifecycleState =
  | "IDLE"
  | "RECORDING"
  | "UPLOADING"
  | "TRANSCRIBING"
  | "PROCESSING"
  | "RESPONDING"
  | "ERROR";

interface IntakeState {
  // Session identity
  encounterId: string | null;
  sessionId: string | null;
  schemaId: string | null;
  language: string | null;

  // Current question
  currentQuestion: string | null;
  currentFieldName: string | null;

  // Progress
  turnNumber: number;
  pathwayComplete: boolean;
  phase: IntakePhase;

  // History & extracted data
  conversationHistory: ConversationEntry[];
  allEntities: ExtractedEntitySummary[];

  // Submission result
  submitResult: IntakeSubmitResponse | null;

  // Voice transient state
  isVoiceRecording: boolean;
  isVoiceUploading: boolean;
  voiceLifecycle: VoiceLifecycleState;
  canRetryVoice: boolean;
  voiceError: string | null;
  lastTranscript: string | null;
  lastDetectedLanguage: string | null;

  // Loading / error
  isLoading: boolean;
  error: string | null;

  // Actions
  startSession: (params: {
    encounterId: string;
    sessionId: string;
    schemaId: string;
    language: string;
    firstQuestion: string | null;
    firstFieldName: string | null;
  }) => void;
  applyTurnResponse: (
    answer: string,
    questionAsked: string,
    fieldAnswered: string,
    response: IntakeTurnResponse,
    isVoice?: boolean
  ) => void;
  applySubmitResponse: (response: IntakeSubmitResponse) => void;
  setVoiceRecording: (recording: boolean) => void;
  setVoiceUploading: (uploading: boolean) => void;
  setVoiceLifecycle: (state: VoiceLifecycleState) => void;
  setVoiceError: (error: string | null) => void;
  setVoiceErrorWithRetry: (error: string | null, canRetry?: boolean) => void;
  clearLastTranscript: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPhase: (phase: IntakePhase) => void;
  reset: () => void;
}

const initialState = {
  encounterId: null,
  sessionId: null,
  schemaId: null,
  language: null,
  currentQuestion: null,
  currentFieldName: null,
  turnNumber: 0,
  pathwayComplete: false,
  phase: "idle" as IntakePhase,
  conversationHistory: [] as ConversationEntry[],
  allEntities: [] as ExtractedEntitySummary[],
  submitResult: null,
  isVoiceRecording: false,
  isVoiceUploading: false,
  voiceLifecycle: "IDLE" as VoiceLifecycleState,
  canRetryVoice: false,
  voiceError: null,
  lastTranscript: null,
  lastDetectedLanguage: null,
  isLoading: false,
  error: null,
};

export const useIntakeStore = create<IntakeState>((set, get) => ({
  ...initialState,

  startSession: ({ encounterId, sessionId, schemaId, language, firstQuestion, firstFieldName }) =>
    set({
      ...initialState,
      encounterId,
      sessionId,
      schemaId,
      language,
      currentQuestion: firstQuestion,
      currentFieldName: firstFieldName,
      phase: "in_progress",
    }),

  applyTurnResponse: (answer, questionAsked, fieldAnswered, r, isVoice = false) => {
    const prev = get();
    const effectiveAnswer = isVoice && r.raw_transcript ? r.raw_transcript : answer;
    const entry: ConversationEntry = {
      question: questionAsked,
      fieldName: fieldAnswered,
      answer: effectiveAnswer,
      isVoice,
      detectedLanguage: r.detected_language || null,
      entities: r.entities_extracted,
      turnNumber: r.turn_number,
    };
    const updatedEntities = [...prev.allEntities, ...r.entities_extracted];
    set({
      currentQuestion: r.next_question,
      currentFieldName: r.next_question_field_name,
      turnNumber: r.turn_number,
      pathwayComplete: r.pathway_complete,
      conversationHistory: [...prev.conversationHistory, entry],
      allEntities: updatedEntities,
      lastTranscript: r.raw_transcript || null,
      lastDetectedLanguage: r.detected_language || null,
      isLoading: false,
      isVoiceUploading: false,
      voiceLifecycle: "IDLE",
      canRetryVoice: false,
      error: null,
      voiceError: null,
      phase: "in_progress",
    });
  },

  applySubmitResponse: (result) =>
    set({
      submitResult: result,
      phase: "submitted",
      isLoading: false,
      isVoiceUploading: false,
      voiceLifecycle: "IDLE",
      error: null,
    }),

  setVoiceRecording: (recording) =>
    set({
      isVoiceRecording: recording,
      voiceLifecycle: recording ? "RECORDING" : "IDLE",
    }),
  setVoiceUploading: (uploading) =>
    set({
      isVoiceUploading: uploading,
      voiceLifecycle: uploading ? "UPLOADING" : "IDLE",
    }),
  setVoiceLifecycle: (lifecycle) =>
    set({
      voiceLifecycle: lifecycle,
      isVoiceRecording: lifecycle === "RECORDING",
      isVoiceUploading:
        lifecycle === "UPLOADING" ||
        lifecycle === "TRANSCRIBING" ||
        lifecycle === "PROCESSING" ||
        lifecycle === "RESPONDING",
    }),
  setVoiceError: (error) =>
    set({
      voiceError: error,
      voiceLifecycle: error ? "ERROR" : "IDLE",
      isVoiceUploading: false,
      isVoiceRecording: false,
      canRetryVoice: false,
    }),
  setVoiceErrorWithRetry: (error, canRetry = true) =>
    set({
      voiceError: error,
      voiceLifecycle: error ? "ERROR" : "IDLE",
      isVoiceUploading: false,
      isVoiceRecording: false,
      canRetryVoice: !!error && canRetry,
    }),
  clearLastTranscript: () => set({ lastTranscript: null, lastDetectedLanguage: null }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false, isVoiceUploading: false }),
  setPhase: (phase) => set({ phase }),
  reset: () => set(initialState),
}));