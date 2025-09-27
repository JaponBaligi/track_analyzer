// web_panel/src/components/RegionSelector.tsx

import React from "react";
import { useAppContext } from "../context/AppContext";

const countries = [
  { code: "GLOBAL", name: "Global" },
  { code: "US", name: "Amerika" },
  { code: "GB", name: "İngiltere" },
  { code: "CA", name: "Kanada" },
  { code: "AU", name: "Avustralya" },
  { code: "FR", name: "Fransa" },
  { code: "BR", name: "Brezilya" },
  { code: "MX", name: "Meksika" },
  { code: "PL", name: "Polonya" },
  { code: "ES", name: "İspanya" },
  { code: "IT", name: "İtalya" },
  { code: "NL", name: "Hollanda" },
  { code: "ZA", name: "Güney Afrika" },
  { code: "AR", name: "Arjantin" },
  { code: "CO", name: "Kolombiya" },
  { code: "PH", name: "Filipinler" },
  { code: "IN", name: "Endonezya" },
  { code: "NG", name: "Nijerya" },
  { code: "AE", name: "Birleşik Arap Emirlikleri" },
];

const RegionSelector = () => {
  const { region, setRegion } = useAppContext();

  return (
    <div className="w-full max-w-xs mx-auto my-4">
      <label
        htmlFor="region-select"
        className="block mb-1 font-semibold text-gray-700 dark:text-gray-200"
      >
        Bölge seçin:
      </label>
      <select
        id="region-select"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
      >
        {countries.map((country) => (
          <option
            key={country.code}
            value={country.code}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RegionSelector;
