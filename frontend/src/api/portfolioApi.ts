// src/api/portfolioApi.ts
import axios from "axios";

export async function fetchPortfolio() {
  const resp = await axios.get("/api/portfolio");
  return resp.data;
}


