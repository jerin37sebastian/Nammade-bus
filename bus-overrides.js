// =============================================
// BUS OVERRIDES LOADER - FIXED VERSION
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

        // Combine base + extra buses
        let result = [...busData];
        if (Array.isArray(extras) && extras.length > 0) {
            result = [...result, ...extras];
        }

        // Map each bus — apply overrides using ORIGINAL index
        result = result.map((bus, i) => {
            const ov = overrides[String(i)] || {};

            // Start with base data
            let name   = bus[1];
            let time   = bus[0];
            let period = bus[2];
            let regNum = bus[3] || '';

            // Apply permanent edits
            if (ov.permanentName) name   = ov.permanentName;
            if (ov.permanentTime) time   = ov.permanentTime;
            if (ov.regNum)        regNum = ov.regNum;  // ← Firebase reg number overrides local

            // Apply today's replacement
            if (ov.status === 'replaced' && ov.replacedBy) {
                name = ov.replacedBy;
                if (ov.newTime)       time   = ov.newTime;
                if (ov.replacedRegNum) regNum = ov.replacedRegNum;
            }

            return {
                time,
                name,
                period,
                regNum,
                originalIndex: i,
                ov
            };
        });

        // Filter out cancelled and day-disabled buses
        result = result.filter(bus => {
            const ov = bus.ov || {};
            if (ov.status === 'cancelled') return false;
            if (ov.disabledDays && Array.isArray(ov.disabledDays) && ov.disabledDays.includes(today)) return false;
            return true;
        });

        // Return clean array [time, name, period, regNum, originalIndex]
        // originalIndex is needed so pin system still works correctly
        return result.map(bus => [bus.time, bus.name, bus.period, bus.regNum, bus.originalIndex]);

    } catch(e) {
        console.warn('applyOverrides failed:', e);
        return busData.map((bus, i) => [bus[0], bus[1], bus[2], bus[3] || '', i]);
    }
}
