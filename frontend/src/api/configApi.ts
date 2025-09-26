// src/api/configApi.ts
import axios from "axios";

export async function fetchConfig() {
  const resp = await axios.get("/api/config");
  return resp.data;
}

export async function updateConfig(payload: Record<string, string>) {
  return await axios.patch("/api/config", payload);
}


