import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const data = searchParams.get("data") || searchParams.get("payload")
    if (!data) {
        return NextResponse.redirect(new URL("/calculator?error=missing-data", request.url))
    }
    return NextResponse.redirect(new URL(`/report?data=${encodeURIComponent(data)}`, request.url))
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
