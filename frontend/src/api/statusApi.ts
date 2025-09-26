// src/api/statusApi.ts
import axios from "axios";

export async function fetchStatus() {
  const resp = await axios.get("/api/status");
  return resp.data;
}


