import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Clean filename and add timestamp to avoid collisions
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${cleanName}`;

        // Write to public/uploads directory
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);

        // The public URL to access the file
        const fileUrl = `/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            filename: file.name,
            size: file.size,
            type: file.type
        });

    } catch (error) {
        console.error("Error uploading document:", error);
        return NextResponse.json({ error: "Failed to upload document." }, { status: 500 });
    }
}
