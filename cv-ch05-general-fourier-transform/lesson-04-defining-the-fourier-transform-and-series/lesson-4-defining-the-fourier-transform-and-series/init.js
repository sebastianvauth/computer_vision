// Deployment-wide LTI integration for section visibility tracking.
//
// Depends on logger.js (window.LTITracker).
//
// Each logged identifier mirrors the deployment structure so the root
// progress script can compute Moodle grades across the full package.

(function () {
    function getPagePrefix() {
        const pathParts = (window.location.pathname || '').split('/').filter(Boolean);
        const contentRelativeParts = pathParts.slice(1);

        if (contentRelativeParts.length && /\.[a-z0-9]+$/i.test(contentRelativeParts[contentRelativeParts.length - 1])) {
            contentRelativeParts.pop();
        }

        if (!contentRelativeParts.length) {
            return 'index';
        }

        return contentRelativeParts.join(':');
    }

    function escapeRegex(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const pagePrefix = getPagePrefix();
    const sectionPrefix = pagePrefix + ':';
    const sectionPattern = new RegExp('^' + escapeRegex(sectionPrefix) + 'section\\d+$');

    function logVisibleSection(el) {
        if (!el || !el.id) return;
        LTITracker.log('show', sectionPrefix + el.id);
    }

    LTITracker.init('show', pagePrefix, function (seen) {
        const expectedSections = document.querySelectorAll('section[id^="section"]').length;
        const knownSectionCount = Array.from(seen).filter(function (id) {
            return sectionPattern.test(id);
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
