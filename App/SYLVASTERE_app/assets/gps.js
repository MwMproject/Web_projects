// ── GPS & CONVERSION WGS84 → LV95 (formule officielle swisstopo) ──

function wgs84ToLV95(lat, lon) {
  const latAux = (lat * 3600 - 169028.66) / 10000;
  const lonAux = (lon * 3600 - 26782.5) / 10000;

  const E =
    2600072.37 +
    211455.93 * lonAux -
    10938.51 * lonAux * latAux -
    0.36 * lonAux * latAux * latAux -
    44.54 * lonAux * lonAux * lonAux;

  const N =
    1200147.07 +
    308807.95 * latAux +
    3745.25 * lonAux * lonAux +
    76.63 * latAux * latAux -
    194.56 * lonAux * lonAux * latAux +
    119.79 * latAux * latAux * latAux;

  return {
    E: Math.round(E),
    N: Math.round(N),
  };
}

function getGPS() {
  if (!navigator.geolocation) {
    showToast("GPS non disponible sur cet appareil");
    return;
  }

  const btn = document.getElementById("btn-gps");
  const status = document.getElementById("gps-status");
  const coords = document.getElementById("gps-coords");

  btn.disabled = true;
  btn.textContent = "Localisation en cours...";
  status.textContent = "Acquisition du signal GPS...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const acc = Math.round(pos.coords.accuracy);
      const alt = pos.coords.altitude ? Math.round(pos.coords.altitude) : null;

      const lv95 = wgs84ToLV95(lat, lon);

      // Sauvegarde globale pour le PDF
      window.gpsData = { lat, lon, lv95, acc, alt };

      // Remplissage automatique des champs
      document.getElementById("coordE").value = lv95.E;
      document.getElementById("coordN").value = lv95.N;
      if (alt) document.getElementById("altitude").value = alt;

      // Affichage précision
      let accClass, accLabel;
      if (acc < 15) {
        accClass = "acc-good";
        accLabel = "Bonne precision";
      } else if (acc < 50) {
        accClass = "acc-med";
        accLabel = "Precision moyenne";
      } else {
        accClass = "acc-bad";
        accLabel = "Faible precision";
      }

      status.innerHTML = `<span class="acc-badge ${accClass}">${accLabel} — ±${acc} m</span>`;

      // Affichage coordonnées
      coords.innerHTML =
        `E : ${lv95.E.toLocaleString("fr-CH")}\n` +
        `N : ${lv95.N.toLocaleString("fr-CH")}\n` +
        (alt ? `Alt : ${alt} m\n` : "") +
        `WGS84 : ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      coords.classList.add("visible");

      // Lien swisstopo
      const mapLink = document.getElementById("map-link");
      mapLink.href = `https://map.geo.admin.ch/?E=${lv95.E}&N=${lv95.N}&zoom=10`;
      mapLink.style.display = "inline-flex";

      btn.disabled = false;
      btn.textContent = "Actualiser la position";

      showToast(`Position obtenue — ±${acc} m`);
    },
    (err) => {
      const messages = {
        1: "Acces GPS refuse — autorisez la localisation",
        2: "Signal GPS indisponible",
        3: "Delai depasse, reessayez",
      };
      status.textContent = messages[err.code] || "Erreur GPS inconnue";
      btn.disabled = false;
      btn.textContent = "Reessayer";
      showToast(messages[err.code] || "Erreur GPS");
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
}
