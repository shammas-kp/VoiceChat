"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

import { AUDIO_SLICE_DURATION_MS } from "@/lib/constants";

const SLICE_DURATION = AUDIO_SLICE_DURATION_MS;

export interface AudioSlice {
  blob: Blob;
  timestamp: number;
  duration: number;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sliceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onSliceCallback = useRef<((slice: AudioSlice) => void) | null>(null);

  const startRecording = useCallback(
    async (onSlice?: (slice: AudioSlice) => void) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        streamRef.current = stream;
        onSliceCallback.current = onSlice || null;

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/mp4",
        });

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType,
          });

          if (onSliceCallback.current && audioBlob.size > 0) {
            onSliceCallback.current({
              blob: audioBlob,
              timestamp: Date.now(),
              duration: duration,
            });
          }

          audioChunksRef.current = [];
        };

        // Start recording
        mediaRecorder.start();
        setIsRecording(true);
        setDuration(0);

        // Duration timer
        durationTimerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);

        // Slice timer - create slices every 5 seconds
        if (onSlice) {
          sliceTimerRef.current = setInterval(() => {
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              // Stop current recording to get the slice
              mediaRecorderRef.current.stop();

              // Immediately start a new recording for the next slice
              setTimeout(() => {
                if (streamRef.current) {
                  const newRecorder = new MediaRecorder(streamRef.current, {
                    mimeType: mediaRecorder.mimeType,
                  });

                  newRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                      audioChunksRef.current.push(event.data);
                    }
                  };

                  newRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, {
                      type: newRecorder.mimeType,
                    });

                    if (onSliceCallback.current && audioBlob.size > 0) {
                      onSliceCallback.current({
                        blob: audioBlob,
                        timestamp: Date.now(),
                        duration: duration,
                      });
                    }

                    audioChunksRef.current = [];
                  };

                  newRecorder.start();
                  mediaRecorderRef.current = newRecorder;
                }
              }, 100);
            }
          }, SLICE_DURATION);
        }
      } catch (error) {
        console.error("Error starting recording:", error);
        toast.error("Failed to access microphone. Please check permissions.");
        throw error;
      }
    },
    [duration]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (sliceTimerRef.current) {
        clearInterval(sliceTimerRef.current);
        sliceTimerRef.current = null;
      }

      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      durationTimerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  return {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}
