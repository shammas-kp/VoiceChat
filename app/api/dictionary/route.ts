import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { Dictionary } from "@/entities/Dictionary";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const dictionaryRepository = db.getRepository(Dictionary);

    const entries = await dictionaryRepository.find({
      where: { userId: session.user.id },
      order: { createdAt: "DESC" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching dictionary:", error);
    return NextResponse.json(
      { error: "Failed to fetch dictionary" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { word, spelling } = await request.json();

    if (!word) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const dictionaryRepository = db.getRepository(Dictionary);

    const entry = dictionaryRepository.create({
      word,
      spelling,
      userId: session.user.id,
    });

    await dictionaryRepository.save(entry);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating dictionary entry:", error);
    return NextResponse.json(
      { error: "Failed to create dictionary entry" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, word, spelling } = await request.json();

    if (!id || !word) {
      return NextResponse.json(
        { error: "ID and word are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const dictionaryRepository = db.getRepository(Dictionary);

    const entry = await dictionaryRepository.findOne({
      where: { id, userId: session.user.id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    entry.word = word;
    entry.spelling = spelling;

    await dictionaryRepository.save(entry);

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating dictionary entry:", error);
    return NextResponse.json(
      { error: "Failed to update dictionary entry" },
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
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const db = await getDatabase();
    const dictionaryRepository = db.getRepository(Dictionary);

    const entry = await dictionaryRepository.findOne({
      where: { id, userId: session.user.id },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await dictionaryRepository.remove(entry);

    return NextResponse.json({ message: "Entry deleted" });
  } catch (error) {
    console.error("Error deleting dictionary entry:", error);
    return NextResponse.json(
      { error: "Failed to delete dictionary entry" },
      { status: 500 }
    );
  }
}
