## Issue

Moodle showed no grading information even though lesson completion UI worked.

## Root Cause

Most lesson `index.html` files did not import `logger.js` and `init.js`.
Without these scripts, `LTITracker.log(...)` was never executed, so the LTI provider received no progress logs and could not compute grades.

## Fix Applied

- Scanned all lesson folders containing `init.js` and `index.html`.
- Added these script tags before `</body>` where missing:
  - `<script src="logger.js"></script>`
  - `<script src="init.js"></script>`
- Normalized duplicates so each appears once and in the correct order.

## Scope

- Scanned: 361 lesson pages.
- Updated: 361 lesson `index.html` files.

## Verification

1. Open a lesson in Moodle LTI iframe.
2. In DevTools Network, verify successful requests to:
   - `log/show` (POST)
   - `logs?types=show...` (GET)
3. Complete lesson sections and confirm Moodle receives/updates grade.

## Notes

Console messages like `Unchecked runtime.lastError: Could not establish connection` are typically browser-extension noise and are not evidence of LTI grading failure.
