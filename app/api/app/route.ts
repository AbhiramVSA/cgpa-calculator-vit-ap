import { type NextRequest, NextResponse } from "next/server"
import { reportPath } from "@/lib/payloadFromUrl"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get("data") || searchParams.get("payload")
    if (!data) {
        return NextResponse.redirect(new URL("/calculator?error=missing-data", request.url))
    }
    // Kept for app versions that still link here with `?data=`. The payload has
    // reached the server once by now; the redirect puts it in the fragment so
    // the report page doesn't send it a second time.
    return NextResponse.redirect(new URL(reportPath(data), request.url))
}

export async function POST() {
    return new NextResponse("Method Not Allowed", { status: 405, headers: { Allow: "GET" } })
}

export async function PUT() {
    return POST()
}

export async function DELETE() {
    return POST()
}

export async function PATCH() {
    return POST()
}
