const API_BASE_URL = "http://127.0.0.1:5000";

export const sendTrendlineData = async (coordinates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/trendline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(coordinates),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending trendline coordinates:", error);
    throw error;
  }
}
