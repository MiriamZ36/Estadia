import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true })

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: "Supabase reachable, but database query failed",
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      message: "Supabase connection is configured correctly",
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase connection is not configured correctly",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
