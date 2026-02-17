(function () {
    // Send a log entry to the LTI provider.
    // The relative URL resolves to /:contentId/log/<type> — correct within the LTI provider.
    // type       – log type, e.g. 'show', 'answer'
    // identifier – unique id for the logged item
    // data       – optional additional payload
    function log(type, identifier, data) {
        const body = { identifier };
        if (data !== undefined) body.data = data;
        fetch('log/' + type, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).catch(function () {}); // silently ignore outside LTI context (e.g. direct file open)
    }

    // Fetch existing logs for this user and hand them to the caller.
    //
    // types    – comma-separated log types to fetch, e.g. 'show' or 'show,answer'
    // prefix   – optional identifier prefix to filter server-side, e.g. 'index'
    // callback – called with a Set<string> of already-logged identifiers
    //
    // Call this once on page load. Use the callback to restore state before
    // attaching your own observer — DOM changes made inside the callback are
    // invisible to any observer registered afterwards.
    //
    // Silently falls back to an empty Set outside the LTI context.
    function init(types, prefix, callback) {
        let url = 'logs?types=' + encodeURIComponent(types);
        if (prefix) url += '&prefix=' + encodeURIComponent(prefix);
        fetch(url)
            .then(function (r) { return r.ok ? r.json() : { logs: [] }; })
            .catch(function () { return { logs: [] }; })
            .then(function (data) {
                const seen = new Set();
                (data.logs || []).forEach(function (e) { seen.add(e.identifier); });
                callback(seen);
            });
    }

    // Expose globally:
    //   LTITracker.log('answer', 'section5:q1', 'optionA')
    //   LTITracker.init('show', 'index', function(seen) { /* restore + observe */ })
    window.LTITracker = { log, init };
})();
