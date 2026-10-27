# BATTERY LAB · Neon Energy Observatory

A mobile-first, French-language battery-cycle tracker with neon cyber-tech visuals.

## What it does
- Tracks multiple devices and their charge cycles.
- Records timestamped battery readings and optional usage notes.
- Calculates percentage-point drain and estimated drain/hour between readings.
- Keeps previous cycles when a new cycle starts.
- Includes battery-over-time charts, cycle history, CSV export and JSON backup/restore.
- Stores data locally in the current browser using localStorage.
- Includes clearly marked demo readings which can be removed.

## Important platform limits
A regular website running in iPhone Safari cannot access iOS battery history, per-app battery usage, or the internal battery percentage of arbitrary Bluetooth headphones. BATTERY LAB therefore uses manual readings for those devices. It never labels sample data as real. Automatic sampling is limited to browser APIs that are actually supported and does not provide device battery history.

## Run locally
```bash
npm install
npm run dev
```

## Deploy to GitHub Pages
1. Create a public GitHub repository named `battery-lab`.
2. Upload the project files to the repository root, including `.github/workflows/deploy.yml`.
3. In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
4. Push to the `main` branch. The workflow builds the site and deploys `dist` to GitHub Pages.
5. Open **Actions** and wait for the deployment workflow to succeed. The published URL appears in the workflow summary and Settings → Pages.

## Privacy
The application keeps entries in this browser's local storage. They do not automatically sync between devices. Export a JSON backup regularly if you want to move or preserve your data.
