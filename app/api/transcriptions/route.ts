import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { Transcription } from "@/entities/Transcription";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const transcriptionRepository = db.getRepository(Transcription);

    const transcriptions = await transcriptionRepository.find({
      where: { userId: session.user.id },
      order: { createdAt: "DESC" },
      take: 100, // Limit to last 100 transcriptions
    });

    return NextResponse.json(transcriptions);
  } catch (error) {
    console.error("Error fetching transcriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcriptions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transcription ID required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const transcriptionRepository = db.getRepository(Transcription);

    const transcription = await transcriptionRepository.findOne({
      where: { id, userId: session.user.id },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription not found" },
        { status: 404 }
      );
    }

    await transcriptionRepository.remove(transcription);

    return NextResponse.json({ message: "Transcription deleted" });
  } catch (error) {
    console.error("Error deleting transcription:", error);
    return NextResponse.json(
      { error: "Failed to delete transcription" },
      { status: 500 }
    );
  }
}
