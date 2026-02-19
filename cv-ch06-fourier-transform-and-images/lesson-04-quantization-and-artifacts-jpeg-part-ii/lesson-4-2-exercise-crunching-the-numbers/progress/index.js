/**
 * Progress calculation for "entering-the-creative-universe".
 *
 * Loads structure.json to know the full set of sections per HTML file,
 * then checks how many of them have a 'show' log entry.
 *
 * structure.json shape:
 *   { "<file>": { "sections": ["section1", "section2", ...] } }
 *
 * Log identifiers sent by lti-tracker.js:
 *   type=show  identifier=<file>:<sectionId>   e.g.  show / index:section3
 *
 * This function is called by the LTI provider whenever progress needs to be
 * (re-)calculated for a user. The result is sent back to the LMS as a grade
 * between 0 and 1.
 *
 * @param {string}         contentId      The content folder name (= this package).
 * @param {string}         identifier     Goal/prefix from the LMS activity config.
 *                                        When it matches a key in structure.json (e.g. "index"),
 *                                        only that file is scored. Otherwise all files are averaged.
 *                                        Use this when one content package is linked as multiple
 *                                        separate LMS activities (e.g. per chapter).
 * @param {object}         progress       The user's stored progress document.
 *   progress.logs                        Array of all log entries for this user, each shaped as:
 *                                        { type, identifier, data, target, time, rejected, accept }
 *                                        Log entries are written by the content via:
 *                                        POST /:contentId/log/<type>  { identifier, data? }
 *                                        GET  /:contentId/log/<type>(<identifier>,<data>)
 * @param {ProgressResult} progressResult Accumulator for the final grade. Key methods:
 *   progressResult.setToPass(n)          Denominator: raw score is divided by this before clamping
 *                                        to [0,1]. Use 1 if your add() calls already produce [0,1].
 *   progressResult.add(type, value, count?, weight?)
 *                                        Record one scored item.
 *                                        type   – arbitrary bucket name (groups similar items)
 *                                        value  – earned points for this item
 *                                        count  – maximum points possible (default 1)
 *                                        weight – relative importance of this bucket (default 1)
 *   progressResult.weight(type, w)       Override the weight of a whole bucket.
 * @param {Function}       fileLoader     Async helper to load a JSON file from this content folder.
 *                                        const data = await fileLoader('structure.json');
 * @param {Function}       debug          Debug logger: debug('message %o', value)
 */
module.exports = async function (contentId, identifier, progress, progressResult, fileLoader, debug) {

    progressResult.setToPass(1);

    const structure = await fileLoader('structure.json');
    if (!structure) {
        debug('structure.json not found, falling back to full credit');
        progressResult.add('completion', 1);
        return;
    }

    // Build the set of identifiers that have been seen from the logs.
    const seen = new Set(
        (progress.logs || [])
            .filter(function (e) { return e.type === 'show' && !e.rejected; })
            .map(function (e) { return e.identifier; })
    );

    debug('seen identifiers: %o', Array.from(seen));

    // Score only the file matching `identifier`, or all files if no match.
    const filesToScore = (identifier && structure[identifier])
        ? [identifier]
        : Object.keys(structure);

    let totalSections = 0;
    let seenSections  = 0;

    filesToScore.forEach(function (file) {
        const sections = (structure[file] && structure[file].sections) || [];
        sections.forEach(function (sectionId) {
            totalSections++;
            if (seen.has(file + ':' + sectionId)) seenSections++;
        });
    });

    if (totalSections === 0) {
        debug('no sections defined in structure.json for identifier "%s"', identifier || '(all)');
        progressResult.add('completion', 1);
        return;
    }

    debug('%s: seen %d / %d sections', contentId, seenSections, totalSections);
    progressResult.add('sections', seenSections, totalSections);
};
