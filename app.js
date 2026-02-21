// ===============================
//  FIREBASE v8 CONFIG
// ===============================
var firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDER",
  appId: "TU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===============================
//  ELEMENTOS DEL DOM
// ===============================
const litrosInput = document.getElementById('litros');
const precioInput = document.getElementById('precio');
const kmInput = document.getElementById('km');
const historyContainer = document.getElementById('history');

// Si más adelante añades estos elementos en el HTML, ya estarán listos:
const totalLitrosEl = document.getElementById('totalLitros');
const totalGastoEl = document.getElementById('totalGasto');
const totalKmEl = document.getElementById('totalKm');
const mediaConsumoEl = document.getElementById('mediaConsumo');

let chart = null;

// ===============================
//  OCULTAR SPLASH (por si falla el inline)
// ===============================
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    const appRoot = document.getElementById('appRoot');
    if (splash) splash.style.display = 'none';
    if (appRoot) appRoot.style.display = 'block';
  }, 500);
});

// ===============================
//  GUARDAR REGISTRO
// ===============================
async function saveEntry() {
  const litros = parseFloat(litrosInput.value);
  const precio = parseFloat(precioInput.value);
  const km = parseFloat(kmInput.value);

  if (!litros || !precio || !km) {
    alert("Completa todos los campos");
    return;
  }

  try {
    await db.collection("registros").add({
      litros,
      precio,
      km,
      fecha: Date.now()
    });

    litrosInput.value = "";
    precioInput.value = "";
    kmInput.value = "";

    await loadEntries();
  } catch (e) {
    console.error("Error guardando en Firestore:", e);
    alert("Error guardando el registro");
  }
}

// ===============================
//  CARGAR REGISTROS
// ===============================
async function loadEntries() {
  historyContainer.innerHTML = "";

  try {
    const snapshot = await db.collection("registros")
      .orderBy("fecha", "desc")
      .get();

    const registros = [];
    snapshot.forEach(doc => {
      registros.push({ id: doc.id, ...doc.data() });
    });

    renderHistory(registros);
    updateStats(registros);
    updateChart(registros);

  } catch (e) {
    console.error("Error cargando registros:", e);
    historyContainer.innerHTML = "<p>Error cargando datos</p>";
  }
}

// ===============================
//  PINTAR HISTORIAL
// ===============================
function renderHistory(registros) {
  historyContainer.innerHTML = "";

  if (!registros.length) {
    historyContainer.innerHTML = "<p>No hay registros todavía.</p>";
    return;
  }

  registros.forEach(reg => {
    const div = document.createElement("div");
    div.className = "history-item";

    const fechaStr = new Date(reg.fecha).toLocaleString();

    div.innerHTML = `
      <div>
        <div><strong>${fechaStr}</strong></div>
        <div>${reg.litros} L — ${reg.precio.toFixed(2)} € — ${reg.km} km</div>
      </div>
      <button class="delete-btn" onclick="deleteEntry('${reg.id}')">X</button>
    `;

    historyContainer.appendChild(div);
  });
}

// ===============================
//  BORRAR REGISTRO
// ===============================
async function deleteEntry(id) {
  if (!confirm("¿Eliminar este registro?")) return;

  try {
    await db.collection("registros").doc(id).delete();
    await loadEntries();
  } catch (e) {
    console.error("Error eliminando registro:", e);
    alert("Error eliminando el registro");
  }
}

// ===============================
//  ESTADÍSTICAS BÁSICAS
// ===============================
function updateStats(registros) {
  if (!registros.length) {
    if (totalLitrosEl) totalLitrosEl.textContent = "0 L";
    if (totalGastoEl) totalGastoEl.textContent = "0 €";
    if (totalKmEl) totalKmEl.textContent = "0 km";
    if (mediaConsumoEl) mediaConsumoEl.textContent = "0 L/100km";
    return;
  }

  const totalLitros = registros.reduce((sum, r) => sum + (r.litros || 0), 0);
  const totalGasto = registros.reduce((sum, r) => sum + (r.precio || 0), 0);
  const totalKm = registros.reduce((sum, r) => sum + (r.km || 0), 0);

  const consumoMedio = totalKm > 0 ? (totalLitros / totalKm) * 100 : 0;

  if (totalLitrosEl) totalLitrosEl.textContent = `${totalLitros.toFixed(2)} L`;
  if (totalGastoEl) totalGastoEl.textContent = `${totalGasto.toFixed(2)} €`;
  if (totalKmEl) totalKmEl.textContent = `${totalKm.toFixed(0)} km`;
  if (mediaConsumoEl) mediaConsumoEl.textContent = `${consumoMedio.toFixed(2)} L/100km`;
}

// ===============================
//  GRÁFICO CON CHART.JS
// ===============================
function updateChart(registros) {
  const canvas = document.getElementById('chart');
  if (!canvas) return; // por si aún no lo has añadido al HTML

  const ctx = canvas.getContext('2d');

  const sorted = [...registros].sort((a, b) => a.fecha - b.fecha);

  const labels = sorted.map(r => new Date(r.fecha).toLocaleDateString());
  const dataLitros = sorted.map(r => r.litros || 0);
  const dataPrecio = sorted.map(r => r.precio || 0);

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Litros',
          data: dataLitros,
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0,229,255,0.2)',
          tension: 0.3
        },
        {
          label: 'Precio (€)',
          data: dataPrecio,
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255,152,0,0.2)',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#ffffff' }
        }
      },
      scales: {
        x: {
          ticks: { color: '#ffffff' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          ticks: { color: '#ffffff' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      }
    }
  });
}

// ===============================
//  INICIALIZAR
// ===============================
loadEntries();
