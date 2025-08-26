import { gunzipSync } from "zlib"

export function decodePayload(encoded: string): unknown {
  // base64url -> Buffer
  let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
  const pad = b64.length % 4
  if (pad) b64 += "=".repeat(4 - pad)
  const compressed = Buffer.from(b64, "base64")

  // gunzip
  const jsonBuf = gunzipSync(compressed)

  // utf8 -> JSON
  const jsonStr = jsonBuf.toString("utf8")
  console.log(jsonStr);
  return JSON.parse(jsonStr)
}

export type Course = {
  id: number
  course_code: string
  course_title: string
  course_type: string
  credits: number
  grade: string
  exam_month: string
  course_distribution: string
}

export function isCourseArray(x: unknown): x is Course[] {
  if (!Array.isArray(x)) return false
  return x.every(
    (o) =>
      o &&
      typeof o === "object" &&
      typeof o.id === "number" &&
      typeof o.course_code === "string" &&
      typeof o.course_title === "string" &&
      typeof o.course_type === "string" &&
      typeof o.credits === "number" &&
      typeof o.grade === "string" &&
      typeof o.exam_month === "string" &&
      typeof o.course_distribution === "string",
  )
}
