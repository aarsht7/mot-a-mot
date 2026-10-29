# Mot à Mot — French flashcard swipe website

A GitHub Pages–compatible, mobile-first flashcard trainer with **over 1,500 distinct French words and phrases**, English meanings, approximate A1–C1 study groups, noun gender, verb conjugations, speech playback and browser-local review progress.

## Deploy on GitHub Pages (no server required)

1. Create a new public GitHub repository (for example, `mot-a-mot`).
2. Upload **all files and folders** from this project, preserving the folder structure, to the repository's `main` branch. (Upload individual unzipped contents, not the `.zip` file.)
3. Go to **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open the **Actions** tab and run **Publish French flashcards** if it has not already started. It installs the language library, downloads the CC BY 4.0 learning deck, deduplicates the entries, adds the advanced vocabulary, creates static conjugations and publishes the site.
5. Your website will be available at `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/` once the deployment workflow succeeds.

This deploy uses no paid infrastructure, login or API keys. Updating files and pushing to `main` rebuilds the dataset and site. If the GitHub Action initially fails because of temporary upstream downloads, rerun the job.

## Run on your computer

Install Node.js 20+ and then:

```bash
npm install
npm run build
npm test
python3 -m http.server 8000
```

Open `http://localhost:8000/`. A development fallback can fetch the cards directly from the upstream repository if `data/cards.json` is absent. It includes only the authored advanced entries if the internet connection is unavailable. **Run the build** to bundle the full 1,500+ cards into the site.

## Controls

- **Tap** a card or press **Space** to reveal its English meaning. The recall timer stops at the first reveal; time spent checking the answer does not penalize you.
- **Swipe left** (or press ←): Don't know — review sooner.
- **Swipe right** (or press →): Know it — automatically becomes **Learning** when you took more than 12 seconds to recall (adjustable to 8, 12, 20, or 30 seconds in Settings).
- Use **Conjugate** in the top right of a verb card to inspect supported conjugations by tense and person.
- Use **Listen** to hear French with your browser/device's speech synthesis (voice support varies).
- Filter by level, word type, study mode, or search term. Search will match both languages.
- Use the settings menu to **export/import** progress when moving devices. There is **no automatic synchronization**; the host cannot see personal progress.
- Use the **moon/sun toggle** in the top bar to switch dark and light mode (saved on your device).
- Study the **Learning** tab to revisit cards you knew slowly, or **Don't know** for missed words. Cards remain in the learning categories until a later successful fast recall.
- On mobile, **only left and right swipes** rate cards. For keyboard access, use ←/→; two accessible rating controls are available to screen readers.

## Review logic

Ratings save to `localStorage` (version `motamot-progress-v1`) and determine when a card is due. Don't know (left) → 10 minutes; Learning (slow right) → 1 day; Know it (fast right) → escalating intervals (3, 7, 14, 30, 60 days). The current session does not repeat a card immediately. The **Smart review** queue prioritizes due words, then new words; fully learned not-yet-due cards stay out of the way.

## About the vocabulary and gender

The 1,500+ source set is an openly licensed **pedagogical collection**, not an official frequency or CEFR-certified list. A1–B2 groups are estimates based on the source chapter, and additional advanced words are assigned B1–C1 by learning usefulness. Grammar labels are heuristic: if a word is preceded by `le/un` it is shown as masculine; `la/une` as feminine; if the form is ambiguous, **Unknown / not verified** is shown. **French verbs do not have grammatical gender.** Words with multiple senses are displayed using source glosses.

See [ATTRIBUTION.md](ATTRIBUTION.md) for the original French–English data's CC BY 4.0 licensing and attribution, and the Lefff conjugation data licensing.

## Deploy on Vercel instead of GitHub Pages (optional)

Vercel's Hobby plan hosts a static site for free for eligible non-commercial personal projects. Connect this repository in Vercel → **New Project**, select **Other** as framework, set **Build Command** to `npm run build:vercel`, and **Output Directory** to `dist` (both are defined in `vercel.json`). The build downloads the licensed vocabulary and emits the JSON files in `data/`. On Vercel the deploy must run `npm install` before building. A default `vercel.app` domain is provided.

**Important:** Vercel is a hosting/deployment platform, not a built-in multi-user progress database. This edition continues to use browser-local storage, including on Vercel. Accounts and cross-device syncing would require a separate authentication and database implementation.

## Upgrading an existing installation

Replace the previous project files with those in this ZIP (keep the folder structure) and push to `main`. GitHub Pages will redeploy automatically. We intentionally **kept the existing `motamot-progress-v1` localStorage key** so progress on the same browser and site URL is retained. Before switching from GitHub Pages to Vercel, export your progress using Settings → Export, then import it on the new Vercel URL; storage is specific to each website origin.
