async function api(action, data = {}) {
    if (!API_URL || API_URL.includes("YOUR_EXEC_URL_HERE")) {
        throw new Error("API URL is not configured.");
    }

    const payload = {
        action: action,
        ...data
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }

        const text = await response.text();

        if (!text) {
            throw new Error("Empty response from Apps Script.");
        }

        let result;

        try {
            result = JSON.parse(text);
        } catch (error) {
            console.error("Apps Script response:", text);
            throw new Error("Invalid response from Apps Script.");
        }

        if (!result.success) {
            throw new Error(result.message || "Request failed.");
        }

        return result;

    } catch (error) {
        console.error("API Error:", error);

        if (error.message === "Failed to fetch") {
            throw new Error(
                "Cannot connect to the EMCOR server. Check your Apps Script deployment and API URL."
            );
        }

        throw error;
    }
}
