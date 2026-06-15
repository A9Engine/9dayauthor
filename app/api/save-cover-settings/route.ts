import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      project_id,
      cover_format,
      trim_size,
      paper_type,
      page_count,
      title,
      subtitle,
      author_name,
      spine_title,
      spine_author,
      back_cover_text,
      background_image_url,
      image_scale,
      image_x,
      image_y,
      image_fit_mode,
      show_guides,
      panel_styles,
      cover_layers,
    } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: "Missing project_id." },
        { status: 400 }
      );
    }

    const payload = {
      project_id,
      cover_format: cover_format || "paperback",
      trim_size: trim_size || "6x9",
      paper_type: paper_type || "white",
      page_count: Number(page_count || 150),
      title: title || "",
      subtitle: subtitle || "",
      author_name: author_name || "",
      spine_title: spine_title || "",
      spine_author: spine_author || "",
      back_cover_text: back_cover_text || "",
      background_image_url: background_image_url || "",
      image_scale: Number(image_scale || 100),
      image_x: Number(image_x || 0),
      image_y: Number(image_y || 0),
      image_fit_mode: image_fit_mode || "cover",
      show_guides: show_guides === false ? false : true,
      panel_styles: panel_styles || null,
      cover_layers: cover_layers || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("book_cover_settings")
      .upsert(payload, {
        onConflict: "project_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Save cover settings error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Save cover settings route error:", error);

    return NextResponse.json(
      { error: "Something went wrong saving cover settings." },
      { status: 500 }
    );
  }
}