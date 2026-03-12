## Issue

Moodle LTI progress stayed empty or inconsistent because the tracking model was defined per lesson instead of per deployment.

## Root Cause

- Lesson `init.js` files logged local identifiers like `index:section1`.
- Those identifiers were not globally unique across the `computer_vision` deployment.
- Progress calculation lived in nested lesson `progress/index.js` files, but the content package root was `computer_vision`, so Moodle needed a root-level `progress/index.js` and root-level `structure.json`.

## Fix Applied

- Replaced lesson-local tracking identifiers with deployment-wide identifiers derived from the page path, for example:
  - `cv-ch01-an-introduction-to-vision:lesson-01-from-light-to-meaning-the-perception-pipeline:lesson-1-from-light-to-meaning-the-perception-pipeline:section1`
- Generated `computer_vision/structure.json` from all lesson `structure.json` files.
- Added `computer_vision/progress/index.js` to calculate progress for the full deployment or for any configured identifier prefix.
- Removed obsolete nested lesson `progress` folders.
- Updated lesson HTML files to load the new `init.js` version so browsers do not keep stale tracking code cached.

## Verification

1. Open a lesson through Moodle LTI.
2. In the browser console, confirm `progress:snapshot` shows a hierarchical `pagePrefix`.
3. In Network, confirm `POST /computer_vision/log/show` requests use identifiers with the full chapter and lesson path.
4. On the LTI server, inspect the root progress logs and confirm `[progress]` output shows non-zero `totalSections` and increasing `seenSections`.
5. Reopen Moodle and verify the grade/progress value updates after visiting sections.

## Notes

- If Moodle activity identifiers are still configured with legacy values like `index`, the new root progress script falls back to scoring the full deployment.
- Restart the LTI service after `progress/index.js` changes so the server loads the new root progress calculator.
