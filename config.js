// Global API Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbz_KTJ3XAwjwOTiJCd8HpweaycghHu2mNvTG3zOEcsy4-6p81XrRIHo9hIbOSMI845M/exec";

/**
 * Universal API Handler
 * @param {string} action - The action/route to trigger in Apps Script
 * @param {Object} data - Additional payload attributes
 */
async function api(action, data = {}) {
  if (!API_URL || API_URL.includes("YOUR_EXEC_URL_HERE")) {
    throw new Error("Configure API_URL in js/config.js first.");
  }

  const payload = { action, ...data };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let result;

  try {
    result = JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid server response from Apps Script.");
  }

  if (!result.success) {
    throw new Error(result.message || "Request failed.");
  }

  return result;
}
