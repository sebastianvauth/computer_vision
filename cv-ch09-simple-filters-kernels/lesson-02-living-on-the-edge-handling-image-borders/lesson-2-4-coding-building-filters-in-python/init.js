// Content-specific LTI integration for entering-the-creative-universe.
//
// Depends on lti-tracker.js (LTITracker.log, LTITracker.init).
//
// Responsibilities:
//   1. Resume — restore the sections the user already visited on page load.
//   2. Observe — log each section as it becomes visible, using the identifier
//      convention  'index:<sectionId>'  (file prefix : element id).

LTITracker.init('show', 'index', function (seen) {

    // --- 1. Resume -------------------------------------------------------
    // Make every section the user has already seen visible.
    let lastSec = null;
    seen.forEach(function (id) {
        const match = id.match(/^index:(section\d+)$/);
        if (match) {
            const sec = document.getElementById(match[1]);
            if (sec) { sec.classList.add('visible'); lastSec = sec; }
        }
    });

    // Scroll to the last restored section (250ms lets the browser finish layout).
    if (lastSec) setTimeout(function () {
        lastSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);

    // --- 2. Observe -------------------------------------------------------
    // Watch for the 'visible' class appearing on any <section> and log it.
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            const el = mutation.target;
            if (el.tagName === 'SECTION' && el.id && el.classList.contains('visible')) {
                LTITracker.log('show', 'index:' + el.id);
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });

    // Log sections already visible at start (e.g. section1 in the HTML).
    document.querySelectorAll('section.visible').forEach(function (el) {
        if (el.id) LTITracker.log('show', 'index:' + el.id);
    });
});
