/**
 * Root-level progress calculation for the complete computer_vision deployment.
 *
 * structure.json maps each lesson page identifier to the sections that belong to
 * that page. Log identifiers use the same hierarchy plus the section id, e.g.
 *
 *   cv-ch01-an-introduction-to-vision
 *   :lesson-01-from-light-to-meaning-the-perception-pipeline
 *   :lesson-1-from-light-to-meaning-the-perception-pipeline
 *   :section1
 */
module.exports = async function (contentId, identifier, progress, progressResult, fileLoader, debug) {
    progressResult.setToPass(1);

    const structure = await fileLoader('structure.json');
    const pages = structure && structure.pages ? structure.pages : structure;

    if (!pages || typeof pages !== 'object' || Array.isArray(pages) || Object.keys(pages).length === 0) {
        debug('root structure.json missing or empty, falling back to full credit');
        progressResult.add('completion', 1);
        return;
    }

    const requestedIdentifier = typeof identifier === 'string' ? identifier.trim() : '';
    const allPageIds = Object.keys(pages).sort();

    let pageIdsToScore = allPageIds;
    if (requestedIdentifier && requestedIdentifier !== 'index') {
        if (pages[requestedIdentifier]) {
            pageIdsToScore = [requestedIdentifier];
        } else {
            const prefix = requestedIdentifier + ':';
            const matches = allPageIds.filter(function (pageId) {
                return pageId === requestedIdentifier || pageId.startsWith(prefix);
            });
            if (matches.length > 0) {
                pageIdsToScore = matches;
            } else {
                debug('identifier "%s" matched no pages, falling back to the full deployment', requestedIdentifier);
            }
        }
    }

    const seen = new Set(
        (progress.logs || [])
            .filter(function (entry) {
                return entry && entry.type === 'show' && !entry.rejected && typeof entry.identifier === 'string';
            })
            .map(function (entry) {
                return entry.identifier;
            })
    );

    let totalSections = 0;
    let seenSections = 0;

    pageIdsToScore.forEach(function (pageId) {
        const page = pages[pageId] || {};
        const sections = Array.isArray(page.sections) ? page.sections : [];
        sections.forEach(function (sectionId) {
            totalSections += 1;
            if (seen.has(pageId + ':' + sectionId)) {
                seenSections += 1;
            }
        });
    });

    debug('progress snapshot %o', {
        contentId: contentId,
        identifier: requestedIdentifier || '(all)',
        pageCount: pageIdsToScore.length,
        totalSections: totalSections,
        seenSections: seenSections
    });
    console.log('[progress]', {
        contentId: contentId,
        identifier: requestedIdentifier || '(all)',
        pageCount: pageIdsToScore.length,
        totalSections: totalSections,
        seenSections: seenSections
    });

    if (totalSections === 0) {
        debug('no sections defined for identifier "%s"', requestedIdentifier || '(all)');
        progressResult.add('completion', 1);
        return;
    }

    progressResult.add('sections', seenSections, totalSections);
};
