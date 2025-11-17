"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface DictionaryEntry {
  id: string;
  word: string;
  spelling: string;
  createdAt: string;
  updatedAt: string;
}

export default function DictionaryPage() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DictionaryEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(
    null
  );
  const [formData, setFormData] = useState({ word: "", spelling: "" });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(
        (entry) =>
          entry.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.spelling?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEntries(filtered);
    }
  }, [searchQuery, entries]);

  const fetchEntries = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch("/api/dictionary");
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
        setFilteredEntries(data);
      }
    } catch (error) {
      console.error("Error fetching dictionary:", error);
      toast.error("Failed to load dictionary entries");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.word.trim()) {
      toast.error("Word is required");
      return;
    }

    setLoading(true);

    try {
      const url = "/api/dictionary";
      const method = editingEntry ? "PUT" : "POST";
      const body = editingEntry
        ? { id: editingEntry.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(
          editingEntry
            ? "Dictionary entry updated successfully"
            : "Dictionary entry created successfully"
        );
        setIsDialogOpen(false);
        setFormData({ word: "", spelling: "" });
        setEditingEntry(null);
        fetchEntries();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save entry");
      }
    } catch (error) {
      toast.error("Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: DictionaryEntry) => {
    setEditingEntry(entry);
    setFormData({ word: entry.word, spelling: entry.spelling || "" });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, word: string) => {
    try {
      const response = await fetch(`/api/dictionary?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(`"${word}" deleted successfully`);
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        toast.error("Failed to delete entry");
      }
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingEntry(null);
      setFormData({ word: "", spelling: "" });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Custom Dictionary
            </h1>
            <p className="text-muted-foreground">
              Manage custom words and spellings for more accurate transcription
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingEntry
                    ? "Edit Dictionary Entry"
                    : "Add Dictionary Entry"}
                </DialogTitle>
                <DialogDescription>
                  Add custom words or phrases that the AI should recognize
                  during transcription. This helps with technical terms, names,
                  or uncommon words.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="word" className="text-sm font-medium">
                    Word/Phrase <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="word"
                    placeholder="e.g., API, JavaScript, PostgreSQL"
                    value={formData.word}
                    onChange={(e) =>
                      setFormData({ ...formData, word: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    className="border-purple-500/30 focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spelling" className="text-sm font-medium">
                    Custom Spelling (optional)
                  </Label>
                  <Input
                    id="spelling"
                    placeholder="e.g., A-P-I, Post-gres-Q-L"
                    value={formData.spelling}
                    onChange={(e) =>
                      setFormData({ ...formData, spelling: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    className="border-purple-500/30 focus:border-purple-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a phonetic spelling to help the AI pronounce it
                    correctly
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {loading
                    ? "Saving..."
                    : editingEntry
                    ? "Update Entry"
                    : "Add Entry"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Card */}
        <Card className="border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-xl font-semibold">
                Dictionary Entries ({entries.length})
              </CardTitle>
              <CardDescription className="mt-1">
                These words will be recognized and prioritized during
                transcription
              </CardDescription>
            </div>

            {/* Search Bar */}
            {entries.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dictionary entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-purple-500/30 focus:border-purple-500"
                />
              </div>
            )}
          </CardHeader>

          <CardContent className="px-4 sm:px-6 pb-6">
            {initialLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-4">
                  <BookOpen className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No dictionary entries yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  Add custom words and phrases to improve transcription accuracy
                  for technical terms, names, or uncommon words.
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Entry
                </Button>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  No entries found matching "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex items-center justify-between border border-white/20 rounded-xl p-4 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 backdrop-blur-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-base text-foreground truncate">
                          {entry.word}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {entry.spelling ? "Custom" : "Standard"}
                        </span>
                      </div>
                      {entry.spelling && (
                        <p className="text-sm text-muted-foreground truncate">
                          Pronunciation: {entry.spelling}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(entry)}
                        className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit entry"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(entry.id, entry.word)}
                        className="h-9 w-9 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        {entries.length > 0 && (
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">How it works</h4>
                  <p className="text-sm text-muted-foreground">
                    When you transcribe audio, the AI will prioritize these
                    custom words and use your specified pronunciations to
                    improve accuracy. Perfect for technical jargon, product
                    names, or frequently used terms in your domain.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
