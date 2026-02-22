// ===============================
//  FIREBASE CONFIG (tu proyecto)
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

// Fecha por defecto: hoy
dateInput.value = new Date().toISOString().split('T')[0];

// ===============================
//  UTILIDADES
// ===============================
function parseAmount(value) {
  if (!value) return NaN;
  const normalized = value.replace(',', '.').trim();
  return parseFloat(normalized);
}

function getYearMonth(dateStr) {
  return dateStr.slice(0, 7);
}

function getYear(dateStr) {
  return dateStr.slice(0, 4);
}

// ===============================
//  CARGAR REPOSTAJES
// ===============================
async function loadExpenses() {
  historyList.innerHTML = '<p>Cargando...</p>';

  try {
    const snapshot = await db
      .collection('repostajes')
      .orderBy('createdAt', 'desc')
      .get();

    const expenses = [];
    snapshot.forEach(doc => {
      expenses.push({ id: doc.id, ...doc.data() });
    });

    renderHistory(expenses);
    updateStats(expenses);
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
//  MODO DÍA / NOCHE
// ===============================
const themeToggle = document.getElementById('themeToggle');

// Cargar tema guardado
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
    window.open("https://www.google.com", "_self");
  }
}

// ===============================
//  INICIALIZAR
// ===============================
loadExpenses();
