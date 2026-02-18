(function () {
    function getContentRoot() {
        const parts = (window.location.pathname || '').split('/').filter(Boolean);
        const contentId = parts[0] || 'computer-vision';
        return '/' + contentId + '/';
    }

    const ROOT = getContentRoot();

    function log(type, identifier, data) {
        const body = { identifier };
        if (data !== undefined) body.data = data;

        fetch(ROOT + 'log/' + type, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).catch(function () {});
    }

    function init(types, prefix, callback) {
        let url = ROOT + 'logs?types=' + encodeURIComponent(types);
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

    window.LTITracker = { log, init };
})();
