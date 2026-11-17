import { NextResponse } from "next/server";
import { saveUploadedMedia } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { url, storedName } = await saveUploadedMedia(
      file.name,
      file.type,
      buffer
    );

    const isVideo = file.type.startsWith("video/");
    return NextResponse.json(
      {
        url,
        storedName,
        title: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        type: isVideo ? "video" : "archivo",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir archivo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
