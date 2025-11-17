import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@deepgram/sdk";
import { getDatabase } from "@/lib/db";
import { Dictionary } from "@/entities/Dictionary";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

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
      return NextResponse.json({ text: "" });
    }

    // Return transcribed text without saving to database
    return NextResponse.json({
      text: rawTranscript,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
