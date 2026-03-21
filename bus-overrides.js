// =============================================
// BUS OVERRIDES LOADER - SAFE VERSION
// =============================================

async function loadOverrides(route) {
    try {
        const res = await fetch(`${FIREBASE_URL}/nammadebus.json`);
        if (!res.ok) return { overrides: {}, extras: [] };
        
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
        console.warn('Firebase overrides failed, using default data:', e);
        return { overrides: {}, extras: [] };
    }
}

function applyOverrides(busData, overrides, extras) {
    try {
        const today = new Date().getDay();
        let result = [...busData];

        if (Array.isArray(extras) && extras.length > 0) {
            result = [...result, ...extras];
        }

        result = result.map((bus, i) => {
            const ov = overrides[String(i)] || {};

            let name = ov.permanentName || bus[1];
            let time = ov.permanentTime || bus[0];
            let period = bus[2];

            if (ov.status === 'replaced' && ov.replacedBy) {
                name = ov.replacedBy;
                if (ov.newTime) time = ov.newTime;
            }

            return [time, name, period, i, ov];
        });

        result = result.filter((bus) => {
            const ov = bus[4] || {};
            if (ov.status === 'cancelled') return false;
            if (ov.disabledDays && Array.isArray(ov.disabledDays) && ov.disabledDays.includes(today)) return false;
            return true;
        });

        return result.map(bus => [bus[0], bus[1], bus[2]]);

    } catch(e) {
        console.warn('applyOverrides failed, using original data:', e);
        return busData;
    }
}
