(function () {
    function getContentRoot() {
        const parts = (window.location.pathname || '').split('/').filter(Boolean);
        const contentId = parts[0] || 'computer-vision';
        return '/' + contentId + '/';
    }

    const ROOT = getContentRoot();

    function status(message, payload) {
        if (payload !== undefined) {
            console.info('[LTITracker]', message, payload);
        } else {
            console.info('[LTITracker]', message);
        }
    }
    // Send a log entry to the LTI provider.
    // The relative URL resolves to /:contentId/log/<type> â€” correct within the LTI provider.
    // type       â€“ log type, e.g. 'show', 'answer'
    // identifier â€“ unique id for the logged item
    // data       â€“ optional additional payload
    function log(type, identifier, data) {
        const body = { identifier };
        if (data !== undefined) body.data = data;
        const url = ROOT + 'log/' + type;
        status('log:send', { type, identifier, url });
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(function (r) {
                status('log:response', { type, identifier, status: r.status, ok: r.ok });
                if (!r.ok) {
                    console.warn('[LTITracker] log request failed', { type, identifier, status: r.status, url });
                }
                return r;
            })
            .catch(function (error) {
                console.error('[LTITracker] log request error', { type, identifier, url, error: String(error) });
            });
    }

    // Fetch existing logs for this user and hand them to the caller.
    //
    // types    â€“ comma-separated log types to fetch, e.g. 'show' or 'show,answer'
    // prefix   â€“ optional identifier prefix to filter server-side, e.g. 'index'
    // callback â€“ called with a Set<string> of already-logged identifiers
    //
    // Call this once on page load. Use the callback to restore state before
    // attaching your own observer â€” DOM changes made inside the callback are
    // invisible to any observer registered afterwards.
    //
    // Silently falls back to an empty Set outside the LTI context.
    function init(types, prefix, callback) {
        let url = ROOT + 'logs?types=' + encodeURIComponent(types);
        if (prefix) url += '&prefix=' + encodeURIComponent(prefix);
        status('init:fetch', { types, prefix: prefix || null, url });
        fetch(url)
            .then(function (r) {
                status('init:response', { status: r.status, ok: r.ok, url });
                return r.ok ? r.json() : { logs: [] };
            })
            .catch(function (error) {
                console.error('[LTITracker] init request error', { types, prefix: prefix || null, url, error: String(error) });
                return { logs: [] };
            })
            .then(function (data) {
                const seen = new Set();
                (data.logs || []).forEach(function (e) { seen.add(e.identifier); });
                status('init:loaded', { count: seen.size, types, prefix: prefix || null });
                callback(seen);
            });
    }

    // Expose globally:
    //   LTITracker.log('answer', 'section5:q1', 'optionA')
    //   LTITracker.init('show', 'index', function(seen) { /* restore + observe */ })
    window.LTITracker = { log, init };
})();
