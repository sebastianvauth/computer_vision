// Content-specific LTI integration for entering-the-creative-universe.
//
// Depends on lti-tracker.js (LTITracker.log, LTITracker.init).
//
// Responsibilities:
//   1. Resume — restore the sections the user already visited on page load.
//   2. Observe — log each section as it becomes visible, using the identifier
//      convention  'index:<sectionId>'  (file prefix : element id).

LTITracker.init('show', 'index', function (seen) {
    const expectedSections = document.querySelectorAll('section[id^="section"]').length;
    const knownSectionCount = Array.from(seen).filter(function (id) {
        return /^index:section\d+$/.test(id);
    }).length;
    console.info('[LTITracker]', 'progress:snapshot', {
        knownSectionCount: knownSectionCount,
        expectedSections: expectedSections,
        complete: expectedSections > 0 ? knownSectionCount >= expectedSections : false
    });


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
