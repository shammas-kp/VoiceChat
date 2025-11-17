"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mic, Zap, Brain, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  // Client-only waveform state to avoid SSR/client hydration mismatch
  const [barHeights, setBarHeights] = useState<number[]>([]);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Generate random heights only on the client after mount so server and
  // client output match during hydration. While not mounted we render
  // static placeholders so SSR output is deterministic.
  useEffect(() => {
    setBarHeights(
      Array.from({ length: 20 }, () =>
        Number((Math.random() * 100 + 50).toFixed(3))
      )
    );
  }, []);

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Voice Keyboard</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/signin">
            <Button
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Voice
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Assistant
                </span>
              </h1>
              <p className="text-lg text-slate-300 max-w-lg">
                Transform your voice into perfectly formatted text with
                AI-powered transcription. Fast, accurate, and intelligent text
                cleanup powered by Deepgram and Groq.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 h-12"
                >
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-blue hover:bg-white/10 text-lg px-8 h-12"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div>
                <p className="text-3xl font-bold text-white">5s</p>
                <p className="text-sm text-slate-400">Processing Time</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">95%+</p>
                <p className="text-sm text-slate-400">Accuracy</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">AI</p>
                <p className="text-sm text-slate-400">Powered</p>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              {/* Waveform Visualization */}
              <div className="flex items-center justify-center h-64 gap-2">
                {barHeights.length
                  ? barHeights.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse"
                        style={{
                          height: `${h}%`,
                          animationDelay: `${(i * 0.1).toFixed(1)}s`,
                        }}
                      />
                    ))
                  : [...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse"
                        // Static placeholder heights used only for SSR to keep
                        // initial server HTML deterministic and match client
                        // before mount.
                        style={{
                          height: "58.5%",
                          animationDelay: `${(i * 0.1).toFixed(1)}s`,
                        }}
                      />
                    ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <p className="text-white font-medium">Recording...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-slate-300 text-lg">
            Everything you need for professional voice transcription
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Real-time Processing
            </h3>
            <p className="text-slate-300">
              Audio is processed in 5-second slices for instant transcription
              with minimal latency.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              AI Text Cleanup
            </h3>
            <p className="text-slate-300">
              Groq LLM automatically fixes grammar, removes filler words, and
              improves formatting.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Custom Dictionary
            </h3>
            <p className="text-slate-300">
              Add technical terms and names to ensure perfect spelling and
              accuracy.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your workflow?
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already using Voice Keyboard to
            boost their productivity.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-12 h-14"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-medium">Voice Keyboard</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2025 Voice Keyboard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
