import { type NextRequest, NextResponse } from "next/server"
import { decodePayload, isCourseArray, type Course } from "@/lib/decodePayload"
import { gunzipSync } from "zlib"

interface CourseData {
  course_title: string
  credits: number
  grade: string
}

const gradePoints: Record<string, number> = {
  S: 10,
  A: 9,
  B: 8,
  C: 7,
  D: 6,
  E: 5,
  F: 0,
  P: 0, // Pass grade, ignored in CGPA calculation
}

function base64UrlDecode(str: string): Buffer {
  // Add padding if needed
  str += "=".repeat((4 - (str.length % 4)) % 4)
  // Replace URL-safe characters
  str = str.replace(/-/g, "+").replace(/_/g, "/")
  return Buffer.from(str, "base64")
}

function calculateCGPA(courses: CourseData[]): number {
  // Filter out courses with grade "P" as they don't count towards CGPA
  const validCourses = courses.filter((course) => course.grade !== "P")

  if (validCourses.length === 0) {
    return 0
  }

  const totalGradePoints = validCourses.reduce((sum, course) => {
    const points = gradePoints[course.grade] || 0
    return sum + points * course.credits
  }, 0)

  const totalCredits = validCourses.reduce((sum, course) => sum + course.credits, 0)

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0
}

function convertToLegacyFormat(courses: Course[]): CourseData[] {
  return courses.map((course) => ({
    course_title: course.course_title,
    credits: course.credits,
    grade: course.grade,
  }))
}

// Attempt to repair a pseudo-JS object literal (unquoted keys / identifiers) into valid JSON
function salvagePseudoJson(str: string): string {
  let repaired = str
  // Quote keys: {key: or , key: -> {"key": / , "key":
  repaired = repaired.replace(/([,{]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, (_, pfx, key) => `${pfx}"${key}":`)
  // Quote bare single-word identifier values (non true/false/null/number)
  repaired = repaired.replace(/(:\s*)([A-Za-z_][A-Za-z0-9_]*)(?=\s*[,}\]])/g, (m, p1, val) => {
    if (["true", "false", "null"].includes(val)) return m
    if (/^[0-9]+(\.[0-9]+)?$/.test(val)) return m
    return p1 + '"' + val + '"'
  })
  // Quote multi-word unquoted string values (contain a space or dash) up to next comma or closing brace/bracket
  repaired = repaired.replace(/(:\s*)([A-Za-z][A-Za-z0-9 _\-\/&()+]*[A-Za-z)])(?=\s*[,}\]])/g, (m, p1, val) => {
    // Skip if already quoted
    if (val.startsWith('"') || val.startsWith("'")) return m
    // Skip if looks like a number or boolean/null
    if (/^[0-9]+(\.[0-9]+)?$/.test(val) || ["true","false","null"].includes(val)) return m
    return p1 + JSON.stringify(val.trim())
  })
  return repaired
}

function parseCoursesFromText(text: string): CourseData[] {
  // Fast path: attempt strict JSON first
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === "object") {
      const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed.courses) ? parsed.courses : null
      if (arr) return filterValidCourses(arr)
    }
  } catch {/* ignore */}

  // Pseudo-literal path: extract courses section and manually tokenize
  const coursesArray = extractCoursesStructurally(text)
  const filtered = filterValidCourses(coursesArray)
  if (!filtered.length) throw new Error("No valid courses")
  return filtered
}

// Fallback: extract courses array from a JS-like object literal text without strict JSON quoting
function extractCoursesStructurally(text: string): any[] {
  // Locate 'courses:' then capture bracketed array content
  const coursesIdx = text.indexOf('courses')
  if (coursesIdx === -1) throw new Error('No courses section')
  const after = text.slice(coursesIdx)
  const colonIdx = after.indexOf(':')
  if (colonIdx === -1) throw new Error('Malformed courses section')
  const bracketStart = after.indexOf('[', colonIdx)
  if (bracketStart === -1) throw new Error('No courses array start')
  let depth = 0
  let endPos = -1
  for (let i = bracketStart; i < after.length; i++) {
    const ch = after[i]
    if (ch === '[') depth++
    else if (ch === ']') {
      depth--
      if (depth === 0) { endPos = i; break }
    }
  }
  if (endPos === -1) throw new Error('Unterminated courses array')
  const arrayContent = after.slice(bracketStart + 1, endPos)

  // Split top-level course objects by tracking brace depth
  const items: string[] = []
  let buf = ''
  let bDepth = 0
  for (let i = 0; i < arrayContent.length; i++) {
    const ch = arrayContent[i]
    if (ch === '{') { if (bDepth === 0) buf = ''; bDepth++; buf += ch; continue }
    if (bDepth > 0) {
      buf += ch
      if (ch === '}') {
        bDepth--
        if (bDepth === 0) {
          items.push(buf)
          buf = ''
        }
      }
    }
  }

  const courses: any[] = []
  const pairRegex = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^,}]+)\s*(?=,|})/g
  for (const raw of items) {
    const obj: Record<string, any> = {}
    let m: RegExpExecArray | null
    while ((m = pairRegex.exec(raw))) {
      const key = m[1]
      let valRaw = m[2].trim()
      // Remove surrounding quotes if present
      if ((valRaw.startsWith('"') && valRaw.endsWith('"')) || (valRaw.startsWith("'") && valRaw.endsWith("'"))) {
        valRaw = valRaw.slice(1, -1)
      }
      // Number?
      if (/^[0-9]+(\.[0-9]+)?$/.test(valRaw)) {
        obj[key] = parseFloat(valRaw)
      } else {
        obj[key] = valRaw
      }
    }
    courses.push(obj)
  }
  return courses
}

function filterValidCourses(raw: any[]): CourseData[] {
  const out: CourseData[] = []
  for (const c of raw) {
    if (
      c &&
      typeof c === "object" &&
      typeof c.course_title === "string" &&
      (typeof c.credits === "number" || (typeof c.credits === "string" && !isNaN(parseFloat(c.credits)))) &&
      typeof c.grade === "string" &&
      gradePoints.hasOwnProperty(c.grade)
    ) {
      out.push({
        course_title: c.course_title.trim(),
        credits: typeof c.credits === "number" ? c.credits : parseFloat(c.credits),
        grade: c.grade,
      })
    }
  }
  return out
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const encodedData = searchParams.get("data")
  const wantPlain = searchParams.get("plain") === "1" || /text\/plain/.test(request.headers.get("accept") || "")

    if (!encodedData) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 1: Base64URL decode the string
    let decodedBuffer: Buffer
    try {
      decodedBuffer = base64UrlDecode(encodedData)
    } catch (error) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 2: Gzip decompress the result
    let decompressedData: Buffer
    try {
      decompressedData = gunzipSync(decodedBuffer)
    } catch (error) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 3: Parse JSON array of course objects
    let courses: CourseData[]
    try {
      const jsonString = decompressedData.toString("utf-8")
      courses = parseCoursesFromText(jsonString)
    } catch (error) {
      return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
    }

    // Step 4: Calculate CGPA
    const cgpa = Number(calculateCGPA(courses).toFixed(2))
    if (wantPlain) {
      return new Response(cgpa.toString(), { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } })
    }
    return NextResponse.json({ cgpa }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid or malformed data string provided." }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let encoded: string | null = null

    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null)
      encoded = body?.payload ?? body?.data ?? null
    }
    if (!encoded) {
      const url = new URL(request.url)
      encoded = url.searchParams.get("payload") || url.searchParams.get("data")
    }
    if (!encoded) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 })
    }

    try {
      const data = decodePayload(encoded)
      if (isCourseArray(data)) {
        const courses: Course[] = data
        const legacyCourses = convertToLegacyFormat(courses)
        const cgpa = Number(calculateCGPA(legacyCourses).toFixed(2))
        const { searchParams } = new URL(request.url)
        const wantPlain = searchParams.get("plain") === "1" || /text\/plain/.test(request.headers.get("accept") || "")
        if (wantPlain) {
          return new Response(cgpa.toString(), { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } })
        }
        return NextResponse.json({ cgpa }, { status: 200 })
      }
    } catch (error) {
      // Fall back to legacy format if new format fails
    }

    let decodedBuffer: Buffer
    try {
      decodedBuffer = base64UrlDecode(encoded)
    } catch (error) {
      return NextResponse.json({ error: "Invalid encoded payload" }, { status: 400 })
    }

    let decompressedData: Buffer
    try {
      decompressedData = gunzipSync(decodedBuffer)
    } catch (error) {
      return NextResponse.json({ error: "Invalid encoded payload" }, { status: 400 })
    }

    let courses: CourseData[]
    try {
      const jsonString = decompressedData.toString("utf-8")
      courses = parseCoursesFromText(jsonString)
    } catch (error) {
      return NextResponse.json({ error: "Invalid encoded payload" }, { status: 400 })
    }

    const cgpa = Number(calculateCGPA(courses).toFixed(2))
    const { searchParams } = new URL(request.url)
    const wantPlain = searchParams.get("plain") === "1" || /text\/plain/.test(request.headers.get("accept") || "")
    if (wantPlain) {
      return new Response(cgpa.toString(), { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } })
    }
    return NextResponse.json({ cgpa }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Invalid encoded payload" }, { status: 400 })
  }
}

export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "GET, POST" } })
}

export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "GET, POST" } })
}

export async function PATCH() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: { Allow: "GET, POST" } })
}
