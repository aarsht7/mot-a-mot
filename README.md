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

- **Tap** a card or press **Space** to reveal its English meaning.
- **Swipe left** (or press ←): Don't know — review sooner.
- **Swipe right** (or press →): Know it — spaced repetition.
- **Swipe down** (or press ↓): Learning — medium interval.
- Use **Conjugate** in the top right of a verb card to inspect supported conjugations by tense and person.
- Use **Listen** to hear French with your browser/device's speech synthesis (voice support varies).
- Filter by level, word type, study mode, or search term. Search will match both languages.
- Use the settings menu to **export/import** progress when moving devices. There is **no automatic synchronization**; the host cannot see personal progress.

## Review logic

Ratings save to `localStorage` (version `motamot-progress-v1`) and determine when a card is due. Don't know → 10 minutes; Learning → 1 day; Know it → escalating intervals (3, 7, 14, 30, 60 days). The current session does not repeat a card immediately. The **Smart review** queue prioritizes due words, then new words; fully learned not-yet-due cards stay out of the way.

## About the vocabulary and gender

The 1,500+ source set is an openly licensed **pedagogical collection**, not an official frequency or CEFR-certified list. A1–B2 groups are estimates based on the source chapter, and additional advanced words are assigned B1–C1 by learning usefulness. Grammar labels are heuristic: if a word is preceded by `le/un` it is shown as masculine; `la/une` as feminine; if the form is ambiguous, **Unknown / not verified** is shown. **French verbs do not have grammatical gender.** Words with multiple senses are displayed using source glosses.

See [ATTRIBUTION.md](ATTRIBUTION.md) for the original French–English data's CC BY 4.0 licensing and attribution, and the Lefff conjugation data licensing.
