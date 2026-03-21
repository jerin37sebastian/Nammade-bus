// =============================================
// BUS OVERRIDES LOADER
// Include this in tothodupuzha.html and fromthodupuzha.html
// It fetches overrides from Firebase and applies them
// =============================================

async function loadOverrides(route) {
    try {
        const res = await fetch(`${FIREBASE_URL}/nammadebus.json`);
        const data = await res.json();
        if (!data) return { overrides: {}, extras: [] };

        const overrides = route === 'to'
            ? (data.overrides_to || {})
            : (data.overrides_from || {});

        const extras = route === 'to'
            ? (data.extra_to || [])
            : (data.extra_from || []);

        return { overrides, extras };
    } catch(e) {
        console.warn('Could not load overrides:', e);
        return { overrides: {}, extras: [] };
    }
}

// Apply overrides to bus data array
// Returns filtered + modified bus array
function applyOverrides(busData, overrides, extras) {
    const today = new Date().getDay(); // 0=Sun, 6=Sat
    let result = [...busData, ...extras];

    result = result.map((bus, i) => {
        const ov = overrides[i] || {};

        // Apply permanent edits
        let name = ov.permanentName || bus[1];
        let time = ov.permanentTime || bus[0];
        let period = bus[2];

        // Apply today's replacement
        if (ov.status === 'replaced' && ov.replacedBy) {
            name = ov.replacedBy;
            if (ov.newTime) time = ov.newTime;
        }

        return [time, name, period, i, ov];
    });

    // Filter out cancelled and day-disabled buses
    result = result.filter((bus) => {
        const ov = bus[4] || {};
        const originalIndex = bus[3];

        // Hide if cancelled today
        if (ov.status === 'cancelled') return false;

        // Hide if disabled on today's day
        if (ov.disabledDays && ov.disabledDays.includes(today)) return false;

        return true;
    });

    // Clean up — return [time, name, period] format
    return result.map(bus => [bus[0], bus[1], bus[2]]);
}
