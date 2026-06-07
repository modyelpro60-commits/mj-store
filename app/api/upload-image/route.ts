import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole, type UserRole } from "../../lib/auth/requireAuthContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRODUCT_IMAGE_ROLES: UserRole[] = ["admin", "moderator"];

export async function POST(req: Request) {
  // Admin + Moderator
  await requireRole(req, PRODUCT_IMAGE_ROLES);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.warn("[upload-image] No file uploaded");
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    console.log("[upload-image] Received file:", file.name, "size:", file.size, "type:", file.type);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;

    console.log("[upload-image] Uploading to storage as:", fileName);

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload-image] Storage upload failed:", uploadError.message);
      return NextResponse.json({
        success: false,
        error: uploadError.message,
      });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(fileName);

    console.log("[upload-image] Upload successful, public URL:", publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upload-image] Unexpected error:", message);
    return NextResponse.json({
      success: false,
      error: message,
    });
  }
}
