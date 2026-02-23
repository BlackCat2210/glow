// ===============================
//  FIREBASE CONFIG
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyA_q1WwLLEuEk_oaH3s-cy6Huv4sRG08",
  authDomain: "glow-356cc.firebaseapp.com",
  projectId: "glow-356cc",
  storageBucket: "glow-356cc.appspot.com",
  messagingSenderId: "170563093238",
  appId: "1:70563093238:web:e165b6baf8ea00dfc6ad7",
  measurementId: "G-TSGJF2LPNM"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===============================
//  ELEMENTOS DEL DOM
// ===============================
const dateInput = document.getElementById('date');
const stationInput = document.getElementById('station');
const amountInput = document.getElementById('amount');

const historyList = document.getElementById('historyList');
const currentMonthTotalEl = document.getElementById('currentMonthTotal');
const currentYearTotalEl = document.getElementById('currentYearTotal');
const totalCountEl = document.getElementById('totalCount');
const avgPerFillEl = document.getElementById('avgPerFill');

const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');

// NUEVO: elemento para mostrar total del mes seleccionado
let selectedMonthTotalEl;

// Fecha por defecto
dateInput.value = new Date().toISOString().split('T')[0];

// ===============================
//  UTILIDADES
// ===============================
function parseAmount(value) {
  if (!value) return NaN;
  return parseFloat(value.replace(',', '.').trim());
}

function getYearMonth(dateStr) {
  return dateStr.slice(0, 7);
}

function getYear(dateStr) {
  return dateStr.slice(0, 4);
}

// ===============================
//  SELECTOR DE MESES Y AÑOS
// ===============================
function loadMonthYearSelectors() {
  const months = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  monthSelect.innerHTML = "";
  months.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = i + 1;
    opt.textContent = m;
    if (i === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });

  yearSelect.innerHTML = "";
  for (let y = currentYear; y >= currentYear - 5; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

monthSelect.addEventListener("change", loadExpenses);
yearSelect.addEventListener("change", loadExpenses);

// ===============================
//  CARGAR REPOSTAJES
// ===============================
let allExpenses = [];

async function loadExpenses() {
  historyList.innerHTML = '<p>Cargando...</p>';

  try {
    const snapshot = await db
      .collection('repostajes')
      .orderBy('createdAt', 'desc')
      .get();

    allExpenses = [];
    snapshot.forEach(doc => {
      allExpenses.push({ id: doc.id, ...doc.data() });
    });

    renderHistory(allExpenses);
    updateStats(allExpenses);
    updateChart(allExpenses);

  } catch (e) {
    console.error('Error cargando datos:', e);
    historyList.innerHTML = '<p>Error cargando datos.</p>';
  }
}

// ===============================
//  PINTAR HISTORIAL
// ===============================
function renderHistory(expenses) {
  historyList.innerHTML = '';

  if (!expenses.length) {
    historyList.innerHTML = '<p>No hay repostajes todavía.</p>';
    return;
  }

  expenses.forEach(exp => {
    const div = document.createElement('div');
    div.className = 'history-item';

    const date = exp.date || '';
    const station = exp.station || '';
    const amount = (exp.amount || 0).toFixed(2);

    div.innerHTML = `
      <div>
        <strong>${station}</strong><br>
        <small style="color:#b3b3b3;">${date}</small>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-weight:bold;">${amount} €</span>
        <button class="delete-btn" onclick="deleteExpense('${exp.id}')">❌</button>
      </div>
    `;

    historyList.appendChild(div);
  });
}

// ===============================
//  ESTADÍSTICAS
// ===============================
function updateStats(expenses) {
  if (!expenses.length) {
    currentMonthTotalEl.textContent = '0.00 €';
    currentYearTotalEl.textContent = '0.00 €';
    totalCountEl.textContent = '0';
    avgPerFillEl.textContent = '0.00 €';
    return;
  }

  const now = new Date();
  const currentYearMonth = now.toISOString().slice(0, 7);
  const currentYear = now.getFullYear().toString();

  let totalMonth = 0;
  let totalYear = 0;
  let totalAll = 0;

  expenses.forEach(exp => {
    const amount = exp.amount || 0;
    const dateStr = exp.date || '';

    totalAll += amount;

    if (getYearMonth(dateStr) === currentYearMonth) {
      totalMonth += amount;
    }
    if (getYear(dateStr) === currentYear) {
      totalYear += amount;
    }
  });

  const count = expenses.length;
  const avg = count > 0 ? totalAll / count : 0;

  currentMonthTotalEl.textContent = totalMonth.toFixed(2) + ' €';
  currentYearTotalEl.textContent = totalYear.toFixed(2) + ' €';
  totalCountEl.textContent = count.toString();
  avgPerFillEl.textContent = avg.toFixed(2) + ' €';
}

// ===============================
//  AÑADIR REPOSTAJE
// ===============================
async function addExpense() {
  const date = dateInput.value;
  const station = stationInput.value;
  const amountRaw = amountInput.value;
  const amount = parseAmount(amountRaw);

  if (!date || !station || isNaN(amount)) {
    alert('Datos no válidos. Revisa fecha, gasolinera y cantidad.');
    return;
  }

  try {
    await db.collection('repostajes').add({
      date,
      station,
      amount: parseFloat(amount.toFixed(2)),
      createdAt: Date.now()
    });

    amountInput.value = '';
    await loadExpenses();
  } catch (e) {
    console.error('Error guardando repostaje:', e);
    alert('Error guardando el repostaje.');
  }
}

// ===============================
//  BORRAR REPOSTAJE
// ===============================
async function deleteExpense(id) {
  if (!confirm('¿Borrar este repostaje?')) return;

  try {
    await db.collection('repostajes').doc(id).delete();
    await loadExpenses();
  } catch (e) {
    console.error('Error borrando repostaje:', e);
    alert('Error borrando el repostaje.');
  }
}

// ===============================
//  MOSTRAR / OCULTAR HISTORIAL
// ===============================
function toggleHistory() {
  const card = document.getElementById('historyCard');
  const btn = document.getElementById('toggleBtn');
  const isHidden = card.style.display === 'none' || card.style.display === '';

  card.style.display = isHidden ? 'block' : 'none';
  btn.innerText = isHidden ? 'Ocultar historial' : 'Ver historial completo';
}

// ===============================
//  GRÁFICO MENSUAL (MEJORADO)
// ===============================
let chart;

function updateChart(expenses) {
  const selectedMonth = parseInt(monthSelect.value);
  const selectedYear = parseInt(yearSelect.value);

  const filtered = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Total del mes seleccionado
  const totalSelectedMonth = filtered.reduce((sum, exp) => sum + exp.amount, 0);

  // Crear texto encima de la gráfica si no existe
  if (!selectedMonthTotalEl) {
    selectedMonthTotalEl = document.createElement("h3");
    selectedMonthTotalEl.style.textAlign = "center";
    selectedMonthTotalEl.style.marginTop = "10px";
    selectedMonthTotalEl.style.color = "#00e5ff";
    selectedMonthTotalEl.style.fontWeight = "bold";
    const chartContainer = document.getElementById("chartContainer");
    chartContainer.parentNode.insertBefore(selectedMonthTotalEl, chartContainer);
  }

  selectedMonthTotalEl.textContent =
    `Total del mes seleccionado: ${totalSelectedMonth.toFixed(2)} €`;

  // Convertimos a array para evitar problemas en móviles
  const dayData = filtered.map(exp => ({
    day: parseInt(exp.date.slice(8, 10)),
    amount: exp.amount
  }));

  const grouped = {};
  dayData.forEach(item => {
    grouped[item.day] = (grouped[item.day] || 0) + item.amount;
  });

  const sorted = Object.keys(grouped)
    .map(d => parseInt(d))
    .sort((a, b) => a - b)
    .map(day => ({
      day: String(day).padStart(2, "0"),
      amount: grouped[day]
    }));

  const labels = sorted.map(item => item.day);
  const values = sorted.map(item => item.amount);

  const ctx = document.getElementById("monthlyChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Gasto (€)",
        data: values,
        backgroundColor: "#00e5ff88",
        borderColor: "#00e5ff",
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: { color: "#00e5ff" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#00e5ff" }
        }
      }
    }
  });
}

// ===============================
//  MODO DÍA / NOCHE
// ===============================
const themeToggle = document.getElementById('themeToggle');

if (localStorage.getItem('glowTheme') === 'light') {
  document.body.classList.add('light');
  themeToggle.textContent = "☀️";
} else {
  themeToggle.textContent = "🌙";
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');

  if (document.body.classList.contains('light')) {
    localStorage.setItem('glowTheme', 'light');
    themeToggle.textContent = "☀️";
  } else {
    localStorage.setItem('glowTheme', 'dark');
    themeToggle.textContent = "🌙";
  }
});

// ===============================
//  SALIR DE LA APLICACIÓN
// ===============================
function exitApp() {
  if (confirm('¿Quieres salir de la aplicación?')) {
    window.location.href = "about:blank";
  }
}

// ===============================
//  INICIALIZAR
// ===============================
loadMonthYearSelectors();
loadExpenses();
