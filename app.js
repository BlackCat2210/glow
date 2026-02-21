// Firebase v8
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

// Ocultar splash
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('appRoot').style.display = 'block';
  }, 500);
});

// Guardar registro
async function saveEntry() {
  const litros = parseFloat(document.getElementById('litros').value);
  const precio = parseFloat(document.getElementById('precio').value);
  const km = parseFloat(document.getElementById('km').value);

  if (!litros || !precio || !km) return;

  await db.collection("registros").add({
    litros,
    precio,
    km,
    fecha: Date.now()
  });

  loadEntries();
}

// Cargar registros
async function loadEntries() {
  const container = document.getElementById('history');
  container.innerHTML = "";

  const snapshot = await db.collection("registros").orderBy("fecha", "desc").get();

  snapshot.forEach(doc => {
    const d = doc.data();
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <span>${new Date(d.fecha).toLocaleString()}</span>
      <span>${d.litros} L - ${d.precio} € - ${d.km} km</span>
      <button class="delete-btn" onclick="deleteEntry('${doc.id}')">X</button>
    `;
    container.appendChild(div);
  });
}

async function deleteEntry(id) {
  await db.collection("registros").doc(id).delete();
  loadEntries();
}

loadEntries();
