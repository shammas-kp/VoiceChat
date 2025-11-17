"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Loader2, Sparkles, Copy, Download } from "lucide-react";
import { useAudioRecorder, AudioSlice } from "@/hooks/use-audio-recorder";
import { toast } from "sonner";
import {
  MAX_FINALIZE_WAIT_MS,
  FINALIZE_CHECK_INTERVAL_MS,
  TRANSCRIPTION_DISPLAY_DELAY_MS,
} from "@/lib/constants";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

interface SliceResult {
  text: string;
  index: number;
}

export default function DashboardPage() {
  const { isRecording, duration, startRecording, stopRecording } =
    useAudioRecorder();

  const [currentTranscription, setCurrentTranscription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

  // Use refs for performance-critical state to avoid race conditions
  const sliceResultsRef = useRef<SliceResult[]>([]);
  const sliceIndexRef = useRef(0);
  const totalDurationRef = useRef(0);
  const pendingRequestsRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sliceResultsRef.current = [];
      sliceIndexRef.current = 0;
      totalDurationRef.current = 0;
      pendingRequestsRef.current = 0;
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isFinalizing && !isProcessing) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          if (isRecording) {
            handleStopRecording();
          } else {
            handleStartRecording();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isRecording, isFinalizing, isProcessing]);

  const handleSlice = useCallback(async (slice: AudioSlice) => {
    const sliceIndex = sliceIndexRef.current++;
    pendingRequestsRef.current++;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      const file = new File([slice.blob], "audio.webm", {
        type: slice.blob.type,
      });

      formData.append("audio", file);
      formData.append("duration", slice.duration.toString());

      const response = await fetch("/api/transcribe-slice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();

      sliceResultsRef.current.push({
        text: data.text,
        index: sliceIndex,
      });

      totalDurationRef.current += slice.duration;

      const sortedResults = [...sliceResultsRef.current].sort(
        (a, b) => a.index - b.index
      );
      const mergedText = sortedResults.map((r) => r.text).join(" ");
      setCurrentTranscription(mergedText);
    } catch (error) {
      console.error("Error transcribing slice:", error);
      toast.error("Failed to transcribe audio. Please try again.");
    } finally {
      pendingRequestsRef.current--;
      if (pendingRequestsRef.current === 0) {
        setIsProcessing(false);
      }
    }
  }, []);

  const handleStartRecording = async () => {
    setCurrentTranscription("");
    setIsProcessing(false);
    setIsFinalizing(false);
    sliceResultsRef.current = [];
    sliceIndexRef.current = 0;
    totalDurationRef.current = 0;
    pendingRequestsRef.current = 0;

    try {
      await startRecording(handleSlice);
      toast.success("Recording started");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const handleStopRecording = async () => {
    stopRecording();

    const waitForCompletion = async () => {
      let elapsed = 0;

      while (pendingRequestsRef.current > 0 && elapsed < MAX_FINALIZE_WAIT_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, FINALIZE_CHECK_INTERVAL_MS)
        );
        elapsed += FINALIZE_CHECK_INTERVAL_MS;
      }

      if (pendingRequestsRef.current > 0) {
        toast.warning(
          "Some slices are still processing. Finalizing with available data..."
        );
      }

      if (sliceResultsRef.current.length > 0) {
        await finalizeTranscription();
      } else {
        toast.info("No audio to transcribe");
      }
    };

    toast.success("Recording stopped. Processing...");
    waitForCompletion();
  };

  const finalizeTranscription = async () => {
    try {
      setIsFinalizing(true);
      setIsFinalized(true);
      toast.info("Cleaning up transcript with AI...");

      const sortedResults = [...sliceResultsRef.current].sort(
        (a, b) => a.index - b.index
      );
      const mergedText = sortedResults.map((r) => r.text).join(" ");

      if (!mergedText.trim()) {
        toast.warning("No text to save");
        return;
      }

      const response = await fetch("/api/finalize-transcription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: mergedText,
          duration: totalDurationRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to finalize transcription");
      }

      const data = await response.json();
      setCurrentTranscription(data.text);
      toast.success("Transcription saved successfully!");

      // Keep the finalized transcription visible until the user refreshes
      // the page or starts a new recording. Clearing will happen on
      // `handleStartRecording` when a new record begins.
      // NOTE: previously we cleared the transcription after
      // TRANSCRIPTION_DISPLAY_DELAY_MS; removing that timeout keeps the
      // final result available for copy/download without needing to
      // manually paste it elsewhere.
    } catch (error) {
      console.error("Error finalizing transcription:", error);
      toast.error("Failed to save transcription. Please try again.");
    } finally {
      setIsFinalized(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(currentTranscription);
    toast.success("Transcription copied to clipboard");
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([currentTranscription], { type: "text/plain" });
    const date = new Date().toLocaleString().replace(/[/:]/g, "-");
    saveAs(blob, `transcription-${date}.txt`);
    toast.success("Downloaded as TXT");
  };

  const handleDownloadDocx = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Voice Keyboard Transcription",
                    bold: true,
                    size: 32,
                  }),
                ],
                spacing: {
                  after: 200,
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date: ${new Date().toLocaleString()}`,
                    italics: true,
                  }),
                ],
                spacing: {
                  after: 400,
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: currentTranscription,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const date = new Date().toLocaleString().replace(/[/:]/g, "-");
      saveAs(blob, `transcription-${date}.docx`);
      toast.success("Downloaded as DOCX");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export document");
    }
  };

  const isButtonDisabled = isRecording
    ? isFinalized
    : isProcessing || isFinalized;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-6rem)] p-6">
      <div className="w-full max-w-5xl space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Voice Dictation
          </h1>
          <p className="text-muted-foreground mt-2">
            Transform your voice into text with AI
            <span className="ml-2 text-xs opacity-75">
              (Press Space to start/stop)
            </span>
          </p>
        </div>

        {/* Recording Card with Circular Visualization */}
        <Card className="border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl rounded-2xl">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center space-y-8">
              {/* Circular Voice Visualization */}
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>

                {/* Main circle */}
                <div className="relative h-64 w-64 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                  {/* Inner animated circle when recording */}
                  {isRecording && (
                    <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse"></div>
                  )}

                  {/* Microphone button */}
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={
                      isRecording ? handleStopRecording : handleStartRecording
                    }
                    className={`relative h-32 w-32 rounded-full transition-all transform hover:scale-105 ${
                      isRecording
                        ? "bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                        : "bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    } text-white shadow-2xl`}
                    disabled={isButtonDisabled}
                  >
                    {isRecording ? (
                      <MicOff className="h-16 w-16" />
                    ) : (
                      <Mic className="h-16 w-16" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Status and Timer */}
              {isRecording && (
                <div className="text-center space-y-3">
                  <p className="text-4xl font-mono font-bold tabular-nums bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    {formatDuration(duration)}
                  </p>
                  {isProcessing && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      <span>Processing audio...</span>
                    </div>
                  )}
                </div>
              )}

              {isFinalized && (
                <div className="flex items-center justify-center gap-3 text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span className="font-medium">
                    Cleaning up transcript with AI...
                  </span>
                </div>
              )}

              {/* Current Transcription */}
              {currentTranscription && (
                <div className="w-full max-w-4xl border border-white/20 rounded-xl p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm animate-in fade-in duration-300 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {isFinalizing
                          ? "AI-Enhanced Transcription"
                          : "Live Transcription"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyTranscript}
                        className="border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadTxt}
                        className="border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        TXT
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadDocx}
                        className="border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        DOCX
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto pr-2">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {currentTranscription}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
