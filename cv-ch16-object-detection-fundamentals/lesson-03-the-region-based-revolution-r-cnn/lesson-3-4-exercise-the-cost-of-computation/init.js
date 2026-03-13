// Deployment-wide LTI integration for section visibility tracking.
//
// Depends on logger.js (window.LTITracker).
//
// Each logged identifier mirrors the deployment structure so the root
// progress script can compute Moodle grades across the full package.

(function () {
    const pagePrefix = 'cv-ch16-object-detection-fundamentals:lesson-03-the-region-based-revolution-r-cnn:lesson-3-4-exercise-the-cost-of-computation';
    const sectionPrefix = pagePrefix + ':';

    function isTrackedSectionIdentifier(identifier) {
        if (typeof identifier !== 'string' || !identifier.startsWith(sectionPrefix)) {
            return false;
        }
        return /^section\d+$/.test(identifier.slice(sectionPrefix.length));
    }

    function logVisibleSection(el) {
        if (!el || !el.id) return;
        LTITracker.log('show', sectionPrefix + el.id);
    }

    LTITracker.init('show', pagePrefix, function (seen) {
        const expectedSections = document.querySelectorAll('section[id^="section"]').length;
        const knownSectionCount = Array.from(seen).filter(function (id) {
            return isTrackedSectionIdentifier(id);
        }).length;

        console.info('[LTITracker]', 'progress:snapshot', {
            pagePrefix: pagePrefix,
            knownSectionCount: knownSectionCount,
            expectedSections: expectedSections,
            complete: expectedSections > 0 ? knownSectionCount >= expectedSections : false
        });

        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                const el = mutation.target;
                if (el.tagName === 'SECTION' && el.id && el.classList.contains('visible')) {
                    logVisibleSection(el);
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true
        });

        document.querySelectorAll('section.visible').forEach(function (el) {
            logVisibleSection(el);
        });
    });
})();
