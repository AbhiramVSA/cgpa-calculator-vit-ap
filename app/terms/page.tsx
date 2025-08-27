export default function TermsPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="text-2xl font-semibold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p>This tool helps VIT-AP students calculate CGPA and visualize academic progress. By using this website, you agree to use it responsibly.</p>
                <h3>Usage</h3>
                <p>We provide manual entry and an option to decode an encoded string produced by the official app. We do not store your data server-side for the calculator; the /api/app endpoint renders an interactive report in-memory for your session only.</p>
                <h3>Disclaimer</h3>
                <p>Results are best-effort based on the data you provide. This is not an official calculator of VIT-AP University.</p>
                <h3>Contact</h3>
                <p>For issues, open an issue on the repository.</p>
            </div>
        </div>
    )
}
