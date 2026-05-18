// GPS et conversion WGS84 vers LV95 selon la formule swisstopo.
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

function initGPS() {
  document.getElementById("btn-gps")?.addEventListener("click", getGPS);
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

      window.gpsData = { lat, lon, lv95, acc, alt };
      if (typeof saveState === "function") saveState();

      document.getElementById("coordE").value = lv95.E;
      document.getElementById("coordN").value = lv95.N;
      if (alt) document.getElementById("altitude").value = alt;

      let accClass;
      let accLabel;
      if (acc < 15) {
        accClass = "acc-good";
        accLabel = "Bonne précision";
      } else if (acc < 50) {
        accClass = "acc-med";
        accLabel = "Précision moyenne";
      } else {
        accClass = "acc-bad";
        accLabel = "Faible précision";
      }

      status.innerHTML = `<span class="acc-badge ${accClass}">${accLabel} — ±${acc} m</span>`;
      coords.innerHTML =
        `E : ${lv95.E.toLocaleString("fr-CH")}\n` +
        `N : ${lv95.N.toLocaleString("fr-CH")}\n` +
        (alt ? `Alt : ${alt} m\n` : "") +
        `WGS84 : ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      coords.classList.add("visible");

      const mapLink = document.getElementById("map-link");
      mapLink.href = `https://map.geo.admin.ch/?E=${lv95.E}&N=${lv95.N}&zoom=10`;
      mapLink.style.display = "inline-flex";

      btn.disabled = false;
      btn.textContent = "Actualiser la position";
      showToast(`Position obtenue — ±${acc} m`);
    },
    (err) => {
      const messages = {
        1: "Accès GPS refusé — autorisez la localisation",
        2: "Signal GPS indisponible",
        3: "Délai dépassé, réessayez",
      };
      status.textContent = messages[err.code] || "Erreur GPS inconnue";
      btn.disabled = false;
      btn.textContent = "Réessayer";
      showToast(messages[err.code] || "Erreur GPS");
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
}
