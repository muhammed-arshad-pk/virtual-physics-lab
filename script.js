// --- GLOBAL STATE & DOM ELEMENTS ---
const mainMenu = document.getElementById('main-menu');
const experimentsContainer = document.getElementById('experiments-container');
const G_ACCELERATION = 9.81; // Standard gravity constant for Earth

// Modal elements
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCloseBtn = document.getElementById('modal-close-btn');

// --- NAVIGATION & MODAL LOGIC ---

/**
 * Hides the main menu and shows the selected experiment view.
 * @param {string} experimentId - The ID of the experiment div to show.
 */
function showExperiment(experimentId) {
    mainMenu.classList.add('hidden');
    // Hide all other experiments before showing the selected one
    Array.from(experimentsContainer.children).forEach(el => el.classList.add('hidden'));
    
    const expEl = document.getElementById(experimentId);
    if (expEl) {
        expEl.classList.remove('hidden');
    }

    // Initialize the specific experiment's logic
    if (experimentId === 'simple-pendulum') initPendulumExperiment();
    if (experimentId === 'flywheel') initFlywheelExperiment();
}

/**
 * Hides all experiment views and shows the main menu.
 */
function showMainMenu() {
    mainMenu.classList.remove('hidden');
    Array.from(experimentsContainer.children).forEach(el => el.classList.add('hidden'));
}

/**
 * Opens the theory modal with specified title and content.
 * @param {string} title - The title to display in the modal header.
 * @param {string} content - The HTML content to display in the modal body.
 */
function openModal(title, content) {
    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modalOverlay.classList.remove('hidden');
    modalOverlay.classList.add('flex');
    setTimeout(() => { // Small delay for smooth transition
        modalOverlay.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
}

/**
 * Closes the theory modal.
 */
function closeModal() {
    modalOverlay.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    setTimeout(() => {
        modalOverlay.classList.add('hidden');
        modalOverlay.classList.remove('flex');
    }, 300); // Wait for transition to finish
}

// Event listeners for the modal
modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    // Close modal only if the overlay itself is clicked, not the content inside
    if (e.target === modalOverlay) closeModal();
});

// --- UTILITY FUNCTIONS ---

/**
 * Displays a temporary notification message on the screen.
 * @param {string} message - The message to display.
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    // Uses TailwindCSS classes for styling
    notification.className = 'fixed top-5 right-5 bg-red-500 text-white py-2 px-4 rounded-lg shadow-md z-50 animate-pulse';
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000); // Notification disappears after 3 seconds
}

/**
 * Calculates the slope, intercept, and R-squared value for a set of data points.
 * @param {number[]} x - Array of x-coordinates.
 * @param {number[]} y - Array of y-coordinates.
 * @returns {object} - An object containing the slope, intercept, and r2.
 */
function linearRegression(x, y) {
    const n = x.length;
    if (n === 0) return { slope: 0, intercept: 0, r2: 0 };
    let sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0, sum_yy = 0;
    for (let i = 0; i < n; i++) {
        sum_x += x[i]; sum_y += y[i]; sum_xy += (x[i] * y[i]);
        sum_xx += (x[i] * x[i]); sum_yy += (y[i] * y[i]);
    }
    const denominator = (n * sum_xx - sum_x * sum_x);
    if (denominator === 0) return { slope: 0, intercept: 0, r2: 0 };
    const slope = (n * sum_xy - sum_x * sum_y) / denominator;
    const intercept = (sum_y - slope * sum_x) / n;
    const r2_denominator = Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y));
    const r2 = r2_denominator === 0 ? 1 : Math.pow((n * sum_xy - sum_x * sum_y) / r2_denominator, 2);
    return { slope, intercept, r2 };
}

// --- EXPERIMENT 1: SIMPLE PENDULUM ---

const simplePendulumTheory = `
    <div class="space-y-4">
        <p>A simple pendulum consists of a point mass (bob) suspended from a fixed support by a light, inextensible string. When displaced, it oscillates under the influence of gravity.</p>
        <p>The period of oscillation (T), the time for one complete swing, is given by:</p>
        <div class="bg-slate-100 p-4 rounded-lg text-center my-4 font-mono">T = 2π * √(L/g)</div>
        <p>Where: <b>T</b> is the period, <b>L</b> is the length, and <b>g</b> is the acceleration due to gravity.</p>
        <p>To find 'g', we rearrange the formula to <b>T² = (4π²/g) * L</b>. This is a linear equation (y = mx). By plotting L vs. T², the slope of the line is <b>g / 4π²</b>.</p>
        <p>Therefore, 'g' can be calculated from the slope:</p>
        <div class="bg-slate-100 p-4 rounded-lg text-center my-4 font-mono font-bold text-blue-600">g = 4π² * Slope</div>
    </div>
`;

let sp_state = {}; // State object to hold all variables for the Simple Pendulum experiment

function initPendulumExperiment() {
    sp_state = {
        readings: [],
        chart: null,
        mode: 'simulation',
        gravity: 0,
        dom: {
            lengthSlider: document.getElementById('sp-length'),
            environmentSelect: document.getElementById('sp-environment'),
            oscillationsSlider: document.getElementById('sp-oscillations'),
            lengthValueSpan: document.getElementById('sp-length-value'),
            oscillationsValueSpan: document.getElementById('sp-oscillations-value'),
            addReadingBtn: document.getElementById('sp-add-reading-btn'),
            resetBtn: document.getElementById('sp-reset-btn'),
            readingsTable: document.getElementById('sp-readings-table'),
            resultDisplay: document.getElementById('sp-result-display'),
            pendulumRod: document.getElementById('pendulum-rod'),
            simModeBtn: document.getElementById('sp-sim-mode-btn'),
            manualModeBtn: document.getElementById('sp-manual-mode-btn'),
            simulationControls: document.getElementById('sp-simulation-controls'),
            manualEntryControls: document.getElementById('sp-manual-entry-controls'),
            manualLengthInput: document.getElementById('sp-manual-length'),
            manualTimeInput: document.getElementById('sp-manual-time'),
            chartCanvas: document.getElementById('sp-chart'),
            theoryBtn: document.getElementById('sp-theory-btn'),
        }
    };

    const D = sp_state.dom; // Shortcut for DOM elements
    // Attach event listeners
    D.simModeBtn.addEventListener('click', () => sp_setMode('simulation'));
    D.manualModeBtn.addEventListener('click', () => sp_setMode('manual'));
    D.lengthSlider.addEventListener('input', () => { D.lengthValueSpan.textContent = parseFloat(D.lengthSlider.value).toFixed(2); sp_updatePendulumAnimation(); });
    D.environmentSelect.addEventListener('change', () => { sp_state.readings = []; sp_setSimulationGravity(); sp_updateUI(); });
    D.oscillationsSlider.addEventListener('input', () => { D.oscillationsValueSpan.textContent = D.oscillationsSlider.value; });
    D.addReadingBtn.addEventListener('click', sp_addReading);
    D.resetBtn.addEventListener('click', initPendulumExperiment);
    D.theoryBtn.addEventListener('click', () => openModal('Simple Pendulum Theory', simplePendulumTheory));
    
    // Initial setup
    D.environmentSelect.value = 'unknown';
    sp_setMode('simulation');
    sp_setSimulationGravity();
    sp_initChart();
    sp_updateUI();
}

function sp_setMode(mode) {
    sp_state.mode = mode;
    const D = sp_state.dom;
    const isSim = mode === 'simulation';
    D.simulationControls.classList.toggle('hidden', !isSim);
    D.manualEntryControls.classList.toggle('hidden', isSim);
    D.simModeBtn.classList.toggle('active', isSim);
    D.manualModeBtn.classList.toggle('active', !isSim);
}

function sp_setSimulationGravity() {
    const D = sp_state.dom;
    const envVal = D.environmentSelect.value;
    sp_state.gravity = (envVal === 'unknown') ? (5 + Math.random() * 15) : parseFloat(envVal); // Random g for unknown
    sp_updatePendulumAnimation();
}

function sp_addReading() {
    const D = sp_state.dom;
    const n = parseInt(D.oscillationsSlider.value);
    let L, t_measured;

    if (sp_state.mode === 'simulation') {
        L = parseFloat(D.lengthSlider.value);
        const T_theoretical = 2 * Math.PI * Math.sqrt(L / sp_state.gravity);
        t_measured = (n * T_theoretical) * (1 + (Math.random() - 0.5) * 0.04); // Add small random error
        sp_playPendulumAnimation();
    } else { // Manual mode
        L = parseFloat(D.manualLengthInput.value);
        t_measured = parseFloat(D.manualTimeInput.value);
        if (isNaN(L) || isNaN(t_measured) || L <= 0 || t_measured <= 0) {
            showNotification('Please enter valid positive numbers.'); return;
        }
    }
    if (sp_state.readings.some(r => r.L === L)) {
        showNotification('A reading for this length already exists.'); return;
    }

    const T = t_measured / n;
    sp_state.readings.push({ sno: 0, L: L, t: t_measured, T: T, T2: T * T });
    sp_state.readings.sort((a, b) => a.L - b.L).forEach((r, i) => r.sno = i + 1); // Sort and re-number
    
    sp_updateUI();
    if (sp_state.mode === 'manual') { D.manualLengthInput.value = D.manualTimeInput.value = ''; D.manualLengthInput.focus(); }
}

function sp_updateUI() {
    const D = sp_state.dom;
    // Update table
    D.readingsTable.innerHTML = sp_state.readings.length === 0 ? `<tr><td colspan="5" class="p-4 text-center text-slate-500">No readings.</td></tr>` : sp_state.readings.map(r => `<tr class="bg-white border-b"><td class="px-4 py-2">${r.sno}</td><td class="px-4 py-2">${r.L.toFixed(2)}</td><td class="px-4 py-2">${r.t.toFixed(2)}</td><td class="px-4 py-2">${r.T.toFixed(3)}</td><td class="px-4 py-2">${r.T2.toFixed(3)}</td></tr>`).join('');
    
    // Update chart
    const dataPoints = sp_state.readings.map(r => ({ y: r.L, x: r.T2 }));
    sp_state.chart.data.datasets[0].data = dataPoints;
    if (sp_state.readings.length >= 2) {
        const { slope, intercept } = linearRegression(sp_state.readings.map(r => r.T2), sp_state.readings.map(r => r.L));
        const xVals = sp_state.readings.map(r => r.T2);
        const minX = Math.min(...xVals), maxX = Math.max(...xVals);
        sp_state.chart.data.datasets[1].data = [{ x: minX, y: slope * minX + intercept }, { x: maxX, y: slope * maxX + intercept }];
    } else {
        sp_state.chart.data.datasets[1].data = [];
    }
    sp_state.chart.update();

    // Update result
    if (sp_state.readings.length < 2) {
        D.resultDisplay.innerHTML = `<p class="text-slate-500">Add at least two readings.</p>`;
        return;
    }
    const { slope, r2 } = linearRegression(sp_state.readings.map(r => r.T2), sp_state.readings.map(r => r.L));
    const g_exp = slope * 4 * Math.PI * Math.PI;
    const trueG_HTML = (sp_state.mode === 'simulation' && D.environmentSelect.value !== 'unknown') ? `<p class="flex justify-between"><strong>True g:</strong> <span>${sp_state.gravity.toFixed(2)} m/s²</span></p>` : '';
    D.resultDisplay.innerHTML = `<div class="space-y-3 text-left"><p class="flex justify-between"><strong>Graph Slope:</strong> <span>${slope.toFixed(4)}</span></p>${trueG_HTML}<p class="flex justify-between text-blue-600 font-bold text-lg"><strong>Calculated g:</strong> <span>${g_exp.toFixed(2)} m/s²</span></p><p class="flex justify-between text-sm text-slate-500"><strong>Correlation (R²):</strong> <span>${r2.toFixed(4)}</span></p></div>`;
}

function sp_initChart() {
    if (sp_state.chart) sp_state.chart.destroy();
    Chart.defaults.font.family = "'Inter', sans-serif";
    sp_state.chart = new Chart(sp_state.dom.chartCanvas.getContext('2d'), {
        type: 'scatter',
        data: { datasets: [ { label: 'Data', data: [], backgroundColor: 'rgba(59, 130, 246, 0.7)', pointRadius: 6 }, { label: 'Best Fit', data: [], borderColor: 'rgb(239, 68, 68)', type: 'line', fill: false, pointRadius: 0, borderWidth: 2 } ]},
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'T² (s²)' } }, y: { title: { display: true, text: 'L (m)' } } } }
    });
}

function sp_updatePendulumAnimation() {
    const D = sp_state.dom;
    const L = parseFloat(D.lengthSlider.value);
    if (sp_state.gravity <= 0) return;
    const rodHeight = 100 + (L - 0.5) * (150 / 2.0);
    D.pendulumRod.style.height = `${rodHeight}px`;
    D.pendulumRod.style.animationDuration = `${2 * Math.PI * Math.sqrt(L / sp_state.gravity)}s`;
}
function sp_playPendulumAnimation() {
    const D = sp_state.dom;
    D.pendulumRod.style.animation = 'none';
    void D.pendulumRod.offsetHeight; // Trigger reflow
    const period = parseFloat(D.pendulumRod.style.animationDuration) || 2;
    D.pendulumRod.style.animation = `sp_swing ${period}s ease-in-out 0s 2`;
}


// --- EXPERIMENT 2: FLYWHEEL ---

const flywheelTheory = `
    <div class="space-y-4">
        <p>A flywheel stores rotational energy. Its Moment of Inertia (I) is a measure of its resistance to changes in rotation.</p>
        <p>A mass (m) attached to a string wrapped around the axle (radius r) falls a height (h), causing the wheel to rotate. From energy conservation, the Moment of Inertia (I) can be calculated using:</p>
        <div class="bg-slate-100 p-4 rounded-lg text-center my-4 overflow-x-auto font-mono">I = [ m*r²*(g*t² - 2h)*n₂ ] / [ 2*h*(n₁ + n₂) ]</div>
        <p>Where: <b>I</b> is Moment of Inertia, <b>m</b> is mass, <b>r</b> is axle radius, <b>g</b> is gravity, <b>t</b> is fall time, <b>h</b> is fall height (2πrn₁), <b>n₁</b> is windings, and <b>n₂</b> is rotations after fall.</p>
    </div>
`;

let fw_state = {}; // State object for the Flywheel experiment

const FLYWHEEL_MODELS = { 'A': { I: 0.005, Tf: 0.002 }, 'B': { I: 0.015, Tf: 0.004 }, 'unknown': { I: 0, Tf: 0 } };

function initFlywheelExperiment() {
    fw_state = {
        readings: [],
        mode: 'simulation',
        dom: {
            simModeBtn: document.getElementById('fw-sim-mode-btn'),
            manualModeBtn: document.getElementById('fw-manual-mode-btn'),
            simulationControls: document.getElementById('fw-simulation-controls'),
            manualEntryControls: document.getElementById('fw-manual-entry-controls'),
            modelSelect: document.getElementById('fw-model'),
            massSlider: document.getElementById('fw-mass'),
            massValue: document.getElementById('fw-mass-value'),
            radiusSlider: document.getElementById('fw-radius'),
            radiusValue: document.getElementById('fw-radius-value'),
            n1Slider: document.getElementById('fw-n1'),
            n1Value: document.getElementById('fw-n1-value'),
            manualMass: document.getElementById('fw-manual-mass'),
            manualT: document.getElementById('fw-manual-t'),
            manualN2: document.getElementById('fw-manual-n2'),
            addBtn: document.getElementById('fw-add-reading-btn'),
            resetBtn: document.getElementById('fw-reset-btn'),
            table: document.getElementById('fw-readings-table'),
            result: document.getElementById('fw-result-display'),
            wheel: document.getElementById('flywheel-wheel'),
            mass: document.getElementById('flywheel-mass'),
            theoryBtn: document.getElementById('fw-theory-btn'),
        }
    };
    
    const D = fw_state.dom;
    D.simModeBtn.addEventListener('click', () => fw_setMode('simulation'));
    D.manualModeBtn.addEventListener('click', () => fw_setMode('manual'));
    D.addBtn.addEventListener('click', fw_addReading);
    D.resetBtn.addEventListener('click', initFlywheelExperiment);
    D.theoryBtn.addEventListener('click', () => openModal('Flywheel Theory', flywheelTheory));
    D.modelSelect.addEventListener('change', () => { fw_state.readings = []; fw_setFlywheelModel(); fw_updateUI(); });
    D.massSlider.addEventListener('input', () => D.massValue.textContent = D.massSlider.value);
    D.radiusSlider.addEventListener('input', () => D.radiusValue.textContent = parseFloat(D.radiusSlider.value).toFixed(1));
    D.n1Slider.addEventListener('input', () => D.n1Value.textContent = D.n1Slider.value);

    fw_setMode('simulation');
    fw_setFlywheelModel();
    fw_updateUI();
}

function fw_setMode(mode) {
    fw_state.mode = mode;
    const D = fw_state.dom;
    const isSim = mode === 'simulation';
    D.simulationControls.classList.toggle('hidden', !isSim);
    D.manualEntryControls.classList.toggle('hidden', isSim);
    D.simModeBtn.classList.toggle('active', isSim);
    D.manualModeBtn.classList.toggle('active', !isSim);
}

function fw_setFlywheelModel() {
    const modelKey = fw_state.dom.modelSelect.value;
    if (modelKey === 'unknown') { // Randomize properties for unknown model
        FLYWHEEL_MODELS.unknown.I = 0.003 + Math.random() * 0.015;
        FLYWHEEL_MODELS.unknown.Tf = 0.001 + Math.random() * 0.005;
    }
    fw_state.model = FLYWHEEL_MODELS[modelKey];
}

function fw_addReading() {
    const D = fw_state.dom;
    let m_kg, r_m, n1, t, n2;
    r_m = parseFloat(D.radiusSlider.value) / 100; // cm to m
    n1 = parseInt(D.n1Slider.value);
    const h = 2 * Math.PI * r_m * n1;

    if (fw_state.mode === 'simulation') {
        m_kg = parseFloat(D.massSlider.value) / 1000; // g to kg
        const {I, Tf} = fw_state.model;
        const a = (m_kg * G_ACCELERATION - Tf / r_m) / (m_kg + I / (r_m * r_m));
        if (a <= 0) { showNotification("Mass is too light."); return; }
        t = Math.sqrt(2 * h / a);
        const omega = (a * t) / r_m;
        const theta_after = (I * omega * omega) / (2 * Tf);
        n2 = theta_after / (2 * Math.PI);
        t *= (1 + (Math.random() - 0.5) * 0.03); // Add error
        n2 *= (1 + (Math.random() - 0.5) * 0.03); // Add error
        fw_animate(t, n2, omega);
    } else { // Manual mode
        m_kg = parseFloat(D.manualMass.value) / 1000;
        t = parseFloat(D.manualT.value);
        n2 = parseFloat(D.manualN2.value);
        if (isNaN(m_kg) || isNaN(t) || isNaN(n2) || m_kg <= 0 || t <= 0 || n2 <= 0) {
             showNotification('Please enter valid positive numbers.'); return;
        }
    }
    
    const term1 = 2 * h * (n1 + n2);
    const term2 = m_kg * r_m * r_m * (G_ACCELERATION * t * t - 2 * h) * n2;
    if (term1 === 0) { showNotification("Invalid parameters."); return; }
    const I_calc = term2 / term1;
    if (I_calc <= 0) { showNotification("Non-physical result. Check inputs."); return; }

    fw_state.readings.push({ m: m_kg, h: h, t: t, n2: n2, I: I_calc });
    fw_updateUI();
}

function fw_updateUI() {
    const D = fw_state.dom;
    // Update table
    D.table.innerHTML = fw_state.readings.length === 0 ? `<tr><td colspan="5" class="p-4 text-center text-slate-500">No readings.</td></tr>` : fw_state.readings.map(r => `<tr class="bg-white border-b"><td class="px-2 py-2">${r.m.toFixed(3)}</td><td class="px-2 py-2">${r.h.toFixed(3)}</td><td class="px-2 py-2">${r.t.toFixed(2)}</td><td class="px-2 py-2">${r.n2.toFixed(1)}</td><td class="px-2 py-2 font-medium">${r.I.toExponential(3)}</td></tr>`).join('');
    
    // Update result
    if (fw_state.readings.length === 0) {
        D.result.innerHTML = `<p class="text-slate-500">Add readings to calculate 'I'.</p>`;
        return;
    }
    const sumI = fw_state.readings.reduce((acc, r) => acc + r.I, 0);
    const avgI = sumI / fw_state.readings.length;
    const trueI_HTML = (fw_state.mode === 'simulation' && D.modelSelect.value !== 'unknown') ? `<p class="flex justify-between"><strong>True I:</strong> <span>${fw_state.model.I.toExponential(3)} kg·m²</span></p>` : '';
    D.result.innerHTML = `<div class="space-y-3 text-left">${trueI_HTML}<p class="flex justify-between text-blue-600 font-bold text-lg"><strong>Average Calc. I:</strong> <span>${avgI.toExponential(3)} kg·m²</span></p><p class="flex justify-between text-sm text-slate-500"><strong>Readings:</strong> <span>${fw_state.readings.length}</span></p></div>`;
}

function fw_animate(t_fall, n2, omega_max) {
    const D = fw_state.dom;
    const r_m = parseFloat(D.radiusSlider.value) / 100;
    const n1 = parseInt(D.n1Slider.value);
    const h = 2 * Math.PI * r_m * n1;
    const final_pos = (h / (r_m * 0.1)) + 20; // Scale height for animation
    const t_stop = omega_max > 0 ? (2 * n2 * 2 * Math.PI) / omega_max : 0;
    D.mass.animate([ { top: '0px' }, { top: `${final_pos}px` } ], { duration: t_fall * 1000, easing: 'ease-in' });
    D.wheel.animate([ { transform: 'rotate(0deg)' }, { transform: `rotate(${360 * (n1 + n2)}deg)` } ], { duration: (t_fall + t_stop) * 1000, easing: 'ease-in-out' });
}
