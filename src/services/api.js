const BASE_URL = "http://127.0.0.1:5000/api";

export async function getSpots() {
  const res = await fetch(`${BASE_URL}/spots`);
  if (!res.ok) throw new Error("Errore nel caricamento dei posti");
  return res.json();
}

export async function updateSpot(spotId, spotData) {
  const res = await fetch(`${BASE_URL}/spots/${spotId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(spotData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Errore nel salvataggio");
  }
  return res.json();
}