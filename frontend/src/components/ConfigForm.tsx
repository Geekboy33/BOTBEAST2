// src/components/ConfigForm.tsx
import React, { useEffect, useState } from "react";
import { fetchConfig, updateConfig } from "../api/configApi";

type Config = {
  DRY_RUN?: string;
  MAKER_ENABLED?: string;
  MAKER_SPREAD?: string;
  MAKER_ORDER_SIZE?: string;
  MAKER_MAX_ORDERS?: string;
  MAKER_REBROADCAST_SEC?: string;
  ARB_ENABLED?: string;
  ARB_MIN_SPREAD?: string;
  AI_CONTROLLER_ENABLED?: string;
  TWITTER_BEARER_TOKEN?: string;
};

export default function ConfigForm() {
  const [config, setConfig] = useState<Config>({});
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    fetchConfig().then(setConfig).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateConfig(config);
    if (result.ok) setMsg("✅ Configuración guardada. Reinicia el bot.");
    else setMsg("❌ Error al guardar la configuración.");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Ajustes del Bot</h3>

      {/* DRY_RUN */}
      <div className="mb-3">
        <label className="block mb-1">DRY_RUN</label>
        <select name="DRY_RUN" value={config.DRY_RUN} onChange={handleChange}
                className="w-full p-2 bg-gray-700 rounded">
          <option value="True">True</option>
          <option value="False">False</option>
        </select>
      </div>

      {/* MAKER_ENABLED */}
      <div className="mb-3">
        <label className="block mb-1">MAKER_ENABLED</label>
        <select name="MAKER_ENABLED" value={config.MAKER_ENABLED} onChange={handleChange}
                className="w-full p-2 bg-gray-700 rounded">
          <option value="True">True</option>
          <option value="False">False</option>
        </select>
      </div>

      {/* MAKER_SPREAD */}
      <div className="mb-3">
        <label className="block mb-1">MAKER_SPREAD (decimal)</label>
        <input type="number" step="0.0001" name="MAKER_SPREAD"
               value={config.MAKER_SPREAD} onChange={handleChange}
               className="w-full p-2 bg-gray-700 rounded"/>
      </div>

      {/* ARB_ENABLED */}
      <div className="mb-3">
        <label className="block mb-1">ARB_ENABLED</label>
        <select name="ARB_ENABLED" value={config.ARB_ENABLED} onChange={handleChange}
                className="w-full p-2 bg-gray-700 rounded">
          <option value="True">True</option>
          <option value="False">False</option>
        </select>
      </div>

      {/* ARB_MIN_SPREAD */}
      <div className="mb-3">
        <label className="block mb-1">ARB_MIN_SPREAD (decimal)</label>
        <input type="number" step="0.0001" name="ARB_MIN_SPREAD"
               value={config.ARB_MIN_SPREAD} onChange={handleChange}
               className="w-full p-2 bg-gray-700 rounded"/>
      </div>

      {/* AI_CONTROLLER_ENABLED */}
      <div className="mb-3">
        <label className="block mb-1">AI_CONTROLLER_ENABLED</label>
        <select name="AI_CONTROLLER_ENABLED" value={config.AI_CONTROLLER_ENABLED} onChange={handleChange}
                className="w-full p-2 bg-gray-700 rounded">
          <option value="True">True</option>
          <option value="False">False</option>
        </select>
      </div>

      {/* Twitter token */}
      <div className="mb-3">
        <label className="block mb-1">TWITTER_BEARER_TOKEN</label>
        <input type="text" name="TWITTER_BEARER_TOKEN"
               value={config.TWITTER_BEARER_TOKEN} onChange={handleChange}
               className="w-full p-2 bg-gray-700 rounded"/>
      </div>

      <button type="submit"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full mt-4">
        Guardar Configuración
      </button>

      {msg && <p className="mt-2 text-center">{msg}</p>}
    </form>
  );
}


