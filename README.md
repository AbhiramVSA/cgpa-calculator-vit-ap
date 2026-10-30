<p align="center">
  <img src="assets/cgpa-mark.svg" alt="Academic report card with a checked grade" width="112" />
</p>

<h1 align="center">VIT-AP CGPA Calculator</h1>

<p align="center">Calculate a CGPA from course entries or view a semester report from encoded VIT-AP course data.</p>

<p align="center">
  <a href="#use-the-calculator">Calculator</a> ·
  <a href="#view-an-academic-report">Academic report</a> ·
  <a href="#run-locally">Run locally</a> ·
  <a href="#data-and-privacy">Data and privacy</a>
</p>

## Use the calculator

Open `/calculator` to enter course names, credits, and grades. The page calculates the CGPA and groups imported courses by exam month for a semester report.

## View an academic report

Paste the encoded course data from the VIT-AP student app into the calculator. The report shows course details and semester summaries. You can print the report from the browser.

The app accepts compressed, Base64URL-encoded JSON. Run the sample-data command to create an example payload:

```bash
pnpm run test-data
```

## Run locally

**Requirements:** Node.js and pnpm.

```bash
git clone https://github.com/AbhiramVSA/cgpa-calculator-vit-ap.git
cd cgpa-calculator-vit-ap
pnpm install --frozen-lockfile
pnpm dev
```

Open the local address that Next.js prints in the terminal.

## API route

`GET /api/app?data=<payload>` redirects to the report page with the encoded payload. The route also accepts the query name `payload`. It returns `405 Method Not Allowed` for write methods.

## Data and privacy

Manual entries stay in the browser session. The report URL carries encoded course data in a query parameter. Do not share a report URL that contains personal academic data.

## Stack

Next.js 15, React 19, TypeScript, Tailwind CSS, and `pako` for gzip decoding.

## License

The package metadata declares MIT. This repository does not include a `LICENSE` file.
