## Issue

Lesson pages now log correct deployment-wide progress identifiers, but Moodle grades still appear to be calculated against the full `computer_vision` deployment instead of the intended lesson scope.

## What Is Confirmed Working

- Lesson pages load `logger.js` and `init.js`.
- `init.js` now logs hierarchical section identifiers, for example:
  - `cv-ch01-an-introduction-to-vision:lesson-02-the-constructive-brain-how-perception-deceives-us:lesson-2-the-constructive-brain-how-perception-deceives-us:section16`
- The browser-side completion snapshot for the tested lesson shows:
  - `knownSectionCount: 16`
  - `expectedSections: 16`
  - `complete: true`
- `logger.js` successfully sends `POST /<contentId>/log/show` requests and receives `204` responses.
- Root-level progress content exists in:
  - `computer_vision/progress/index.js`
  - `computer_vision/structure.json`

## Observed Problem

Even when a Moodle activity is configured for a single lesson, the visible grade behaves like a full-deployment percentage rather than a lesson percentage.

Example:

- Tested lesson:
  - `cv-ch01-an-introduction-to-vision:lesson-02-the-constructive-brain-how-perception-deceives-us`
- Tracked sections for that lesson:
  - `16`
- Browser-side progress for that lesson:
  - `16 / 16`
- Moodle still shows a small percentage rather than `100%`.

This strongly suggests the root progress calculator is being invoked without the lesson-specific scope and is falling back to scoring all pages in `computer_vision`.

## Most Likely Backend Cause

The LTI provider likely stores the logs correctly but does **not** pass the Moodle activity's configured lesson scope into `computer_vision/progress/index.js` as the `identifier` argument during grade calculation.

If `identifier` is empty, missing, or ignored, the current root progress script deliberately falls back to the full deployment:

- `computer_vision/progress/index.js`

That fallback explains why lesson-complete pages still produce low overall percentages.

## What Needs To Be Checked On The LTI Server

1. Verify which Moodle custom parameter is actually being read by the LTI provider for progress scoping.
2. Verify that the activity-specific scope is persisted or otherwise available again when the provider later recalculates grades.
3. Verify that the provider calls `computer_vision/progress/index.js` with the lesson/chapter scope as the second argument:
   - `identifier`
4. Inspect the server-side `[progress]` or debug output for a launched lesson.

## Expected Server-Side Debug Output

For the tested lesson, a correct grade calculation should look approximately like:

```text
[progress] {
  contentId: "computer_vision",
  identifier: "cv-ch01-an-introduction-to-vision:lesson-02-the-constructive-brain-how-perception-deceives-us",
  pageCount: 1,
  totalSections: 16,
  seenSections: 16
}
```

An incorrect fallback-to-all calculation would look more like:

```text
[progress] {
  contentId: "computer_vision",
  identifier: "(all)",
  pageCount: 361,
  totalSections: 1795,
  seenSections: <some cumulative number>
}
```

## Recommended Ask To Server Owner

Please verify that the Moodle activity's custom progress scope is passed into `computer_vision/progress/index.js` as the `identifier` argument during grade calculation. The content now logs lesson-scoped identifiers correctly, but grading still appears to fall back to the full deployment.
