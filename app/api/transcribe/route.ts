import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@deepgram/sdk";
import Groq from "groq-sdk";
import { getDatabase } from "@/lib/db";
import { Transcription } from "@/entities/Transcription";
import { Dictionary } from "@/entities/Dictionary";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "");
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const duration = parseInt(formData.get("duration") as string) || 0;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Get user's dictionary entries
    const db = await getDatabase();
    const dictionaryRepository = db.getRepository(Dictionary);
    const dictionaryEntries = await dictionaryRepository.find({
      where: { userId: session.user.id },
    });

    // Build keywords array for Deepgram
    const keywords: string[] = [];
    if (dictionaryEntries.length > 0) {
      dictionaryEntries.forEach((entry) => {
        keywords.push(entry.word);
        if (entry.spelling) {
          keywords.push(entry.spelling);
        }
      });
    }

    // Convert audio file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe audio using Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: "nova-2",
        smart_format: true,
        punctuate: true,
        keywords: keywords.length > 0 ? keywords : undefined,
      }
    );

    if (error) {
      throw new Error(`Deepgram transcription error: ${error.message}`);
    }

    const rawTranscript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    if (!rawTranscript) {
      throw new Error("No transcription result from Deepgram");
    }

    // For backward compatibility: Clean up transcript using Groq LLM if processing a complete recording
    // For slice-based processing, use /api/transcribe-slice instead
    let cleanedText = rawTranscript;

    // Only run Groq cleanup if GROQ_API_KEY is available
    if (process.env.GROQ_API_KEY) {
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
              content: rawTranscript,
            },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 2048,
        });

        cleanedText = completion.choices[0]?.message?.content || rawTranscript;
      } catch (groqError) {
        console.error("Groq cleanup error:", groqError);
        // If Groq fails, use the raw transcript
        cleanedText = rawTranscript;
      }
    }

    // Save transcription to database
    const transcriptionRepository = db.getRepository(Transcription);
    const newTranscription = transcriptionRepository.create({
      text: cleanedText,
      duration,
      userId: session.user.id,
    });

    await transcriptionRepository.save(newTranscription);

    return NextResponse.json({
      id: newTranscription.id,
      text: cleanedText,
      duration,
      createdAt: newTranscription.createdAt,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
