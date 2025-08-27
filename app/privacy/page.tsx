export default function PrivacyPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="text-2xl font-semibold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
                <h3>Data handling</h3>
                <p>Manual entries stay in your browser session. When you open the interactive report, data is processed in-memory to render a page for you; we do not persist it.</p>
                <h3>Third-party</h3>
                <p>We do not integrate analytics or trackers in this experience. Assets are served locally where possible.</p>
                <h3>Contact</h3>
                <p>For questions, reach out via the project repository.</p>
            </div>
        </div>
    )
}
