async function api(action, data = {}) {
  if (!API_URL || API_URL.includes("https://script.google.com/macros/s/AKfycbxhu4qm3YVa8pIfh89HLP6gYYxIouP3swRFKvEarGWrElemmj71s3HVDH6LGzfTt_RS/exec")) {
    throw new Error("Configure API_URL in js/config.js first.");
  }
  const payload = {action, ...data};
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type":"text/plain;charset=utf-8"},
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); } catch(e) { throw new Error("Invalid server response."); }
  if (!result.success) throw new Error(result.message || "Request failed.");
  return result;
}
