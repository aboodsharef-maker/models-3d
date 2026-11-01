# TALA Study Planner

This repository has been intentionally converted from the former models-3d gallery into TALA Study Planner. The current user instruction supersedes all previous gallery instructions. Keep the repository name and public GitHub Pages URL unchanged.

Stack: React, TypeScript and Vite. Base path: /models-3d/. Public UI is Arabic RTL. The royal purple, transparent cards, subtle gold, crown/T logo and independent decorative SVG assets form the visual identity. Keep the interface responsive, accessible and usable on iPhone. Respect reduced-motion preferences.

All personal data stays in the browser's IndexedDB database tala-study-planner, document schema version 2 (IndexedDB store version remains 1). Never add cloud sync, analytics, accounts or third-party data transmission without a user request. Never commit notebook data, exported backups or testing data. Keep versioned JSON backups validated before import; preserve rich formatting, parent/subject referential integrity and cycle checks. Do not replace storage errors with an empty notebook.

Source is under src/; public assets and manifest under public/. The obsolete gallery files remaining on the local disk are ignored and excluded from the Git repository and deployment. The complete former gallery is retained at the pushed annotated tag backup/models-3d-before-tala-2026-10-31, commit 4f7ed3b4059b127fed5d5ce51809a5d8e3830662. Do not delete the tag.

Run npm test and npm run build before publication. Use actual browser checks for CRUD, dates, formatted notes surviving reload, import/export and mobile layout. The existing .github/workflows/pages.yml installs from package-lock.json, runs tests/builds, and deploys dist/ on main. Verify successful deployment and the public URL before claiming publication.

Android installation: use the stable /models-3d/ manifest id/scope, real PNG any and maskable icons, and the generated offline service worker. tools/build-sw.mjs creates versioned static app-shell precaches after Vite builds. Keep personal IndexedDB data independent of service-worker caches. New versions wait for the user to choose Update after pending writes and dialogs are saved/closed. Do not silently reload an unsaved form. Check for updates on visibility/online and periodically while open.

Faith section tracks five prayers and Quran plans/reading locally. Never reset v1 study notebooks: validateData migrates them additively to v2 with empty faith records. Quran reading progress merges overlapping page ranges. Preserve the bundled Quran verse strings verbatim, attribution and source metadata under public/quran/. Do not invent verses or prayer times. Do not request location or notification permissions unless explicitly requested. The installed Android experience is a browser-installed PWA, not a Play Store listing or native APK.
