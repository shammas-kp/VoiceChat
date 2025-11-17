import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Groq from "groq-sdk";
import { getDatabase } from "@/lib/db";
import { Transcription } from "@/entities/Transcription";
import { Dictionary } from "@/entities/Dictionary";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text, duration } = body;

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    // Get user's dictionary entries for context
    const db = await getDatabase();
    const dictionaryRepository = db.getRepository(Dictionary);
    const dictionaryEntries = await dictionaryRepository.find({
      where: { userId: session.user.id },
    });

    // Clean up transcript using Groq LLM
    let cleanedText = text;

    try {
      // Build dictionary context for Groq
      let dictionaryContext = "";
      if (dictionaryEntries.length > 0) {
        dictionaryContext = "\n\nCustom dictionary entries:\n";
        dictionaryEntries.forEach((entry) => {
          dictionaryContext += `- ${entry.word}${entry.spelling ? ` (spell as: ${entry.spelling})` : ""}\n`;
        });
      }

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a text cleanup assistant. Your task is to clean up transcribed text by:
1. Fixing grammatical errors
2. Improving punctuation and formatting
3. Removing filler words (um, uh, like, you know) unless they seem intentional
4. Ensuring proper capitalization
5. Maintaining the original meaning and tone
6. Respecting custom spellings from the dictionary${dictionaryContext}

Return ONLY the cleaned text without any explanation or commentary.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 2048,
      });

      cleanedText = completion.choices[0]?.message?.content || text;
    } catch (groqError) {
      console.error("Groq cleanup error:", groqError);
      // If Groq fails, use the original text
      cleanedText = text;
    }

    // Save transcription to database
    const transcriptionRepository = db.getRepository(Transcription);
    const newTranscription = transcriptionRepository.create({
      text: cleanedText,
      duration: duration || 0,
      userId: session.user.id,
    });

    await transcriptionRepository.save(newTranscription);

    return NextResponse.json({
      id: newTranscription.id,
      text: cleanedText,
      duration: newTranscription.duration,
      createdAt: newTranscription.createdAt,
    });
  } catch (error) {
    console.error("Finalize transcription error:", error);
    return NextResponse.json(
      { error: "Failed to finalize transcription" },
      { status: 500 }
    );
  }
}
