# VIT-AP CGPA Calculator

A modern, responsive web application built for VIT-AP students to calculate CGPA manually or import encoded academic data for comprehensive semester-wise reports.

## ✨ Features

- **Manual Calculator**: Add courses individually with credits and grades
- **Academic Report Generator**: Import encoded academic data for detailed semester-wise reports
- **Modern UI**: Clean, responsive design with gradients and animations
- **Comprehensive Reports**: Beautiful HTML reports with CGPA visualization, semester breakdown, and print functionality
- **Dual Data Support**: Handles both pseudo-JavaScript and proper JSON data formats
- **Error Handling**: Graceful error pages with consistent styling

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Icons**: Feather Icons (Lucide React)
- **Data Processing**: Node.js zlib for compression/decompression
- **Encoding**: Base64URL encoding with gzip compression

## 📊 API Endpoints

### `/api/app`
Generates comprehensive academic reports from encoded course data.

**Query Parameters:**
- `data` (required): Base64URL encoded and gzip compressed academic data

**Example:**
\`\`\`
http://localhost:3000/api/app?data=H4sIAAAAAAAAE72Xb2_aMBDGv4qV113l...
\`\`\`

## 🏗️ Data Format

The application expects course data in the following JSON format:

\`\`\`json
{
  "id": 12,
  "credits_registered": "120.0",
  "credits_earned": "116.0",
  "cgpa": "8.47",
  "courses": [
    {
      "id": 298,
      "course_code": "CSE1012",
      "course_title": "Problem Solving using Python",
      "course_type": "ETL",
      "credits": "4.0",
      "grade": "A",
      "exam_month": "Jan-2024",
      "course_distribution": "UE"
    }
  ]
}
\`\`\`

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Setup
\`\`\`bash
# Clone the repository
git clone <repository-url>
cd cgpa-calculator-vit-ap

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
\`\`\`

### Testing
Generate test data using the included utility:
\`\`\`bash
node generate-test-data.js
\`\`\`

This will output:
- Sample student data overview
- Encoded data string
- Test URLs for local and production testing
- Compression statistics

## 📱 Usage

### Manual Calculator
1. Enter course title, credits, and grade
2. Click "Add Course" to include in calculation
3. View real-time CGPA updates
4. Manage courses in the results table

### Academic Report
1. Paste encoded academic data in the textarea
2. Click "Generate Academic Report"
3. View comprehensive semester-wise report in new tab
4. Print or save the formatted report

## 🎨 Features in Detail

### Academic Reports Include:
- **CGPA Circle Visualization**: Interactive circular progress indicator
- **Semester Breakdown**: Organized by exam month with individual GPAs
- **Statistics Cards**: Total courses, credits, and grade distribution
- **Responsive Tables**: Course details with grade color coding
- **Print Functionality**: Optimized printing styles
- **Animations**: Smooth transitions and hover effects

### Grade Point System:
- S: 10 points
- A: 9 points  
- B: 8 points
- C: 7 points
- D: 6 points
- E: 5 points
- F: 0 points
- P: Pass (not counted in CGPA)

## 🔒 Data Processing

The application uses a robust data processing pipeline:

1. **Base64URL Decoding**: Converts URL-safe encoded strings
2. **Gzip Decompression**: Decompresses data using Node.js zlib
3. **Dual JSON Parsing**: Handles both standard JSON and pseudo-JavaScript formats
4. **Type Conversion**: Flexible handling of string/number data types
5. **Validation**: Comprehensive error checking and user feedback

## 🌐 Deployment

The application is optimized for deployment on Vercel with:
- Static generation for optimal performance
- API routes for server-side processing
- Responsive design for all devices
- SEO-friendly metadata

## 📄 License

Built for VIT-AP students. Feel free to use and modify as needed.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.
=======
<div align="center">

# VIT-AP CGPA / GPA Calculator

Fast, API-friendly CGPA & GPA encoder/decoder and visualization interface built with Next.js 15, TypeScript, Tailwind CSS, and Radix UI. Designed by students of **VIT-AP University** for students who want quick academic performance insights and future grade impact simulation (roadmap).

[![Vercel Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

## ✨ Features (Current)

- Decode compressed, base64url academic payloads to compute CGPA
- Encode course lists into compact, shareable payload strings
- Robust parser tolerant of semi-structured copied data (repairs pseudo JSON)
- API endpoints returning JSON or plain text (for CLI / automation / Flutter integration)
- Extensible component-based front-end (shadcn + Radix primitives)

## 🛣️ Roadmap (Upcoming)

1. Semester-wise GPA breakdown & consolidated CGPA trend graph (Recharts)
2. Interactive what-if grade editing inside a semester with instant recalculation
3. Deep-linkable scenario links (share predicted CGPA)
4. Flutter client parity: hitting API with payload renders identical web representation (server render + embed mode)
5. Optional authentication layer for saving historical snapshots
6. Export: PNG / CSV / JSON of semester summary

> This README already reserves sections & API contracts for items 1–4 to smooth future implementation.

## 📂 Project Structure

\`\`\`
app/             Next.js App Router (pages + API routes)
	api/calculate  -> Decode & compute CGPA (GET/POST)
	api/gpa        -> Encode raw course list to compressed payload (POST)
components/      UI components & client-side calculator container
lib/             Decoding / parsing utilities
styles/          Global styling
\`\`\`

## 🧠 Data Model (Decoded Course)

\`\`\`ts
type Course = {
	id: number
	course_code: string
	course_title: string
	course_type: string
	credits: number
	grade: string  // S A B C D E F P
	exam_month: string
	course_distribution: string
}
\`\`\`

Legacy parsing also accepts a minimal shape: `{ course_title, credits, grade }`.

### Grade Points Mapping

| Grade | Points |
|-------|--------|
| S     | 10     |
| A     | 9      |
| B     | 8      |
| C     | 7      |
| D     | 6      |
| E     | 5      |
| F     | 0      |
| P     | 0 (ignored in CGPA) |

## 🔢 CGPA Formula

FilteredCourses = all courses excluding grade === 'P'

CGPA = ( Σ(gradePoint * credits) ) / ( Σ credits )

Rounded to 2 decimals for output.

## 🔌 API Reference

### 1. POST /api/gpa (Encode)

Request Body (JSON): `CourseInput[]`

\`\`\`json
[
	{ "course_code": "MAT101", "credits": 4, "grade": "A" },
	{ "course_code": "CSE110", "credits": 3, "grade": "S" }
]
\`\`\`

Response:
\`\`\`json
{ "encoded": "<compressed-base64url>" }
\`\`\`

Use this encoded string as the `data` (GET) or `payload` (POST) parameter for `/api/calculate`.

### 2. GET /api/calculate?data=ENCODED

Returns JSON:
\`\`\`json
{ "cgpa": 8.75 }
\`\`\`

Optional: `&plain=1` or `Accept: text/plain` returns just the number.

### 3. POST /api/calculate

Body JSON:
\`\`\`json
{ "payload": "<encoded>" }
\`\`\`
or
\`\`\`json
{ "data": "<encoded>" }
\`\`\`

Response same as GET. Plain mode supported via query or Accept header.

### Error Shape

\`\`\`json
{ "error": "Invalid or malformed data string provided." }
\`\`\`

## 🤝 Flutter Integration (Planned Enhancement #2)

For parity rendering, the plan:

1. Flutter hits `/api/calculate?data=...&view=full`
2. Server responds with HTML (SSR) if `Accept: text/html` or `view=full`
3. Embed in an in-app WebView OR parse JSON first then show native UI

Current state: Only JSON / text supported. Flutter can already consume numeric CGPA response now.

## 📊 Semester GPA & What-If (Planned Enhancement #1)

Implementation outline:

- Extend payload to include semester grouping (e.g., `semester: 1` field)
- Compute per-semester GPA arrays for graphing
- Add UI panel to modify a grade (dropdown) -> local recompute without API roundtrip
- Graph: Recharts LineChart (x = semester, y = cumulative CGPA + bar for semester GPA)

## 🛠️ Local Development

Prerequisites: Node 18+ (Next.js 15 requirement) & pnpm (preferred) or npm.

Install & run:
\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Then open http://localhost:3000

## 🧪 Testing Parsers Manually

There is a `test-decode.js` script placeholder (add sample encoded payload tests). Example Node snippet:

\`\`\`js
fetch('http://localhost:3000/api/calculate?data=ENCODED')
	.then(r => r.json())
	.then(console.log)
\`\`\`

## 🔐 Privacy & Data

No data is stored server-side yet. All computation is stateless. Future snapshot feature (see roadmap) will introduce an opt-in persistence layer.

## 🧩 Error Handling Philosophy

The decoder attempts multiple strategies:

1. Strict JSON parse
2. Pseudo-literal structural extraction & key/value repair
3. Validation filter to retain only valid course rows

This makes the API resilient to messy clipboard pastes.

## 🧭 Contributing

Pull requests welcome. For major changes open an issue describing:

- Motivation
- Proposed data shape / UI impact
- Backwards compatibility concerns

## 📅 Release Tags (Planned)

| Version | Focus |
|---------|-------|
| 0.1.0   | Core encode/decode CGPA | 
| 0.2.0   | Semester GPA + Graph | 
| 0.3.0   | What-if grade editing | 
| 0.4.0   | Flutter full render mode | 
| 0.5.0   | Persistence & export | 

## 👩‍🎓 Maintainers

Students of VIT-AP University.

## 📝 License

MIT – feel free to use, extend, and contribute.

---

If you build something with this, let us know. Star the repo to follow progress on the roadmap features.
