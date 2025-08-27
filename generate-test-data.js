const zlib = require('zlib');

// Enhanced sample data with multiple semesters and diverse grades
const sampleData = {
    id: 12,
    credits_registered: "120.0",
    credits_earned: "116.0",
    cgpa: "8.47",
    courses: [
        // Semester 1 - Jan-2024
        {
            id: 298,
            course_code: "CSE1012",
            course_title: "Problem Solving using Python",
            course_type: "ETL",
            credits: "4.0",
            grade: "A",
            exam_month: "Jan-2024",
            course_distribution: "UE"
        },
        {
            id: 299,
            course_code: "ECE1002",
            course_title: "Fundamentals of Electrical and Electronics Engineering",
            course_type: "ETL",
            credits: "4.0",
            grade: "B",
            exam_month: "Jan-2024",
            course_distribution: "UE"
        },
        {
            id: 300,
            course_code: "ENG1002",
            course_title: "English for Effective Communication",
            course_type: "ETL",
            credits: "3.0",
            grade: "B",
            exam_month: "Jan-2024",
            course_distribution: "UE"
        },
        {
            id: 301,
            course_code: "MAT1001",
            course_title: "Calculus for Engineers",
            course_type: "ETL",
            credits: "4.0",
            grade: "A",
            exam_month: "Jan-2024",
            course_distribution: "UE"
        },
        {
            id: 302,
            course_code: "PHY1008",
            course_title: "Modern Physics",
            course_type: "ETL",
            credits: "4.0",
            grade: "S",
            exam_month: "Jan-2024",
            course_distribution: "UE"
        },

        // Semester 2 - Jul-2024
        {
            id: 303,
            course_code: "CSE1005",
            course_title: "Software Engineering",
            course_type: "ETL",
            credits: "4.0",
            grade: "A",
            exam_month: "Jul-2024",
            course_distribution: "UE"
        },
        {
            id: 304,
            course_code: "CSE2007",
            course_title: "Database Management Systems",
            course_type: "ETL",
            credits: "4.0",
            grade: "A",
            exam_month: "Jul-2024",
            course_distribution: "UE"
        },
        {
            id: 305,
            course_code: "MAT2004",
            course_title: "Statistics for Engineers",
            course_type: "ETL",
            credits: "3.0",
            grade: "B",
            exam_month: "Jul-2024",
            course_distribution: "UE"
        },
        {
            id: 306,
            course_code: "CSE2013",
            course_title: "Computer Networks",
            course_type: "ETL",
            credits: "4.0",
            grade: "A",
            exam_month: "Jul-2024",
            course_distribution: "UE"
        },
        {
            id: 307,
            course_code: "HSS2001",
            course_title: "Technical Communication",
            course_type: "ETL",
            credits: "2.0",
            grade: "A",
            exam_month: "Jul-2024",
            course_distribution: "UE"
        },

        // Semester 3 - Jan-2025
        {
            id: 308,
            course_code: "CSE3001",
            course_title: "Data Structures and Algorithms",
            course_type: "ETL",
            credits: "4.0",
            grade: "S",
            exam_month: "Jan-2025",
            course_distribution: "UE"
        },
        {
            id: 309,
            course_code: "CSE3025",
            course_title: "Operating Systems",
            course_type: "ETL",
            credits: "4.0",
            grade: "A",
            exam_month: "Jan-2025",
            course_distribution: "UE"
        },
        {
            id: 310,
            course_code: "CSE3008",
            course_title: "Machine Learning",
            course_type: "ETL",
            credits: "4.0",
            grade: "A",
            exam_month: "Jan-2025",
            course_distribution: "UE"
        },
        {
            id: 311,
            course_code: "CSE3012",
            course_title: "Web Technologies",
            course_type: "ETL",
            credits: "3.0",
            grade: "B",
            exam_month: "Jan-2025",
            course_distribution: "UE"
        },
        {
            id: 312,
            course_code: "MGT1001",
            course_title: "Principles of Management",
            course_type: "ETL",
            credits: "3.0",
            grade: "B",
            exam_month: "Jan-2025",
            course_distribution: "UE"
        },

        // Semester 4 - Jul-2025
        {
            id: 313,
            course_code: "CSE4018",
            course_title: "Artificial Intelligence",
            course_type: "ETL",
            credits: "4.0",
            grade: "S",
            exam_month: "Jul-2025",
            course_distribution: "UE"
        },
        {
            id: 314,
            course_code: "CSE4025",
            course_title: "Mobile Application Development",
            course_type: "ETL",
            credits: "4.0",
            grade: "A",
            exam_month: "Jul-2025",
            course_distribution: "UE"
        },
        {
            id: 315,
            course_code: "CSE4040",
            course_title: "Cyber Security",
            course_type: "ETL",
            credits: "3.0",
            grade: "A",
            exam_month: "Jul-2025",
            course_distribution: "UE"
        },
        {
            id: 316,
            course_code: "CSE4999",
            course_title: "Capstone Project",
            course_type: "ETL",
            credits: "6.0",
            grade: "A",
            exam_month: "Jul-2025",
            course_distribution: "UE"
        }
    ]
};

function generateTestData() {
    console.log('🔧 VIT-AP CGPA Calculator - Test Data Generator');
    console.log('='.repeat(50));

    // Encode the data
    const jsonString = JSON.stringify(sampleData);
    const compressed = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
    const encoded = compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    console.log(`📊 Sample Student Data:`);
    console.log(`   Student ID: ${sampleData.id}`);
    console.log(`   CGPA: ${sampleData.cgpa}`);
    console.log(`   Credits: ${sampleData.credits_earned}/${sampleData.credits_registered}`);
    console.log(`   Total Courses: ${sampleData.courses.length}`);
    console.log(`   Semesters: ${[...new Set(sampleData.courses.map(c => c.exam_month))].length}`);
    console.log('');

    console.log(`🔗 Test URLs:`);
    console.log(`   Local:    http://localhost:3000/api/app?data=${encoded}`);
    console.log(`   Vercel:   https://your-domain.vercel.app/api/app?data=${encoded}`);
    console.log('');

    console.log(`📦 Encoded Data (${encoded.length} chars):`);
    console.log(`   ${encoded}`);
    console.log('');

    console.log(`💾 JSON Size: ${jsonString.length} bytes`);
    console.log(`🗜️  Compressed: ${compressed.length} bytes (${Math.round((1 - compressed.length / jsonString.length) * 100)}% reduction)`);
    console.log(`🔗 Encoded: ${encoded.length} chars`);

    return {
        data: sampleData,
        encoded: encoded,
        url: `http://localhost:3000/api/app?data=${encoded}`
    };
}

// Export for use as module or run directly
if (require.main === module) {
    generateTestData();
} else {
    module.exports = { generateTestData, sampleData };
}
