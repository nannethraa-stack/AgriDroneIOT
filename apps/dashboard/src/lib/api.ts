const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  return res.json();
}
