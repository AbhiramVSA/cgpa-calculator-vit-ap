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
```
http://localhost:3000/api/app?data=H4sIAAAAAAAAE72Xb2_aMBDGv4qV113l...
```

## 🏗️ Data Format

The application expects course data in the following JSON format:

```json
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
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or pnpm

### Setup
```bash
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
```

### Testing
Generate test data using the included utility:
```bash
node generate-test-data.js
```

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