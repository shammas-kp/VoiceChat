"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Download,
  Trash2,
  FileText,
  FileDown,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

interface Transcription {
  id: string;
  text: string;
  createdAt: string;
  duration: number;
}

const ITEMS_PER_PAGE = 5;
const PREVIEW_LENGTH = 200;

export default function HistoryPage() {
  const { data: session } = useSession();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session?.user?.email) {
      fetchTranscriptions();
    }
  }, [session]);

  const fetchTranscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/transcriptions");
      if (response.ok) {
        const data = await response.json();
        setTranscriptions(data);
      }
    } catch (error) {
      console.error("Failed to fetch transcriptions:", error);
      toast.error("Failed to load transcription history");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Transcription copied to clipboard");
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/transcriptions?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTranscriptions(transcriptions.filter((t) => t.id !== id));
        toast.success("Transcription deleted successfully");
      }
    } catch (error) {
      console.error("Failed to delete transcription:", error);
      toast.error("Failed to delete transcription");
    }
  };

  const handleExportTxt = (transcription: Transcription) => {
    const blob = new Blob([transcription.text], { type: "text/plain" });
    const date = new Date(transcription.createdAt)
      .toLocaleString()
      .replace(/[/:]/g, "-");
    saveAs(blob, `transcription-${date}.txt`);
    toast.success("Transcription exported as TXT");
  };

  const handleExportDocx = async (transcription: Transcription) => {
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
                  text: `Date: ${new Date(
                    transcription.createdAt
                  ).toLocaleString()}`,
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
                  text: transcription.text,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const date = new Date(transcription.createdAt)
      .toLocaleString()
      .replace(/[/:]/g, "-");
    saveAs(blob, `transcription-${date}.docx`);
    toast.success("Transcription exported as DOCX");
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const totalPages = Math.ceil(transcriptions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTranscriptions = transcriptions.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Transcription History
          </h1>
          <p className="text-muted-foreground">
            View, copy, export, and manage all your transcriptions
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl font-semibold">
                All Transcriptions ({transcriptions.length})
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 pb-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="space-y-3 p-4 sm:p-5 rounded-xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-20 w-full" />
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : transcriptions.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-4">
                  <FileText className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No transcriptions yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Start recording to create your first transcription and it will
                  appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentTranscriptions.map((transcription) => {
                  const isExpanded = expandedIds.has(transcription.id);
                  const isLong = transcription.text.length > PREVIEW_LENGTH;
                  const displayText =
                    isLong && !isExpanded
                      ? transcription.text.substring(0, PREVIEW_LENGTH) + "..."
                      : transcription.text;

                  return (
                    <div
                      key={transcription.id}
                      className="p-4 sm:p-5 rounded-xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <span className="text-sm text-muted-foreground font-medium">
                          {new Date(transcription.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            {transcription.text.length} characters
                          </span>
                          {transcription.duration && (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {Math.round(transcription.duration)}s
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-white/10">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                            {displayText}
                          </p>
                        </div>
                        {isLong && (
                          <button
                            onClick={() => toggleExpanded(transcription.id)}
                            className="mt-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors inline-flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Read more
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(transcription.text)}
                          className="border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportTxt(transcription)}
                          className="border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          TXT
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportDocx(transcription)}
                          className="border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50 transition-all"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          DOCX
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(transcription.id)}
                          className="border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 text-red-600 dark:text-red-400 transition-all ml-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/20">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, transcriptions.length)} of{" "}
                      {transcriptions.length}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-white/20 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1 px-3 py-1 rounded-md bg-white/20 dark:bg-slate-800/20 text-sm font-medium">
                        {currentPage} / {totalPages}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="border-white/20 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
