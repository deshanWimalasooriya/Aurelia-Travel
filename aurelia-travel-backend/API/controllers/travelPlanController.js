// API/controllers/travelPlanController.js
//
// Proxies the "Smart Plan" requests from the frontend to the Python agent
// service. Keeps the agent URL server-side (frontend never talks to the agent
// directly). Maps the frontend's form fields into the agent's TripRequest shape.
//
// Add AGENT_URL to your .env, e.g.  AGENT_URL=http://localhost:8000

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

// Node 18+ has global fetch. If on older Node, install node-fetch and import it.

// Translate the frontend form (LKR, datetime-local, pace) into the agent schema.
function toTripRequest(body) {
  // budget arrives in LKR for the whole trip; agent expects a free-text budget.
  const budget = body.budget ? `LKR ${body.budget} total for the trip` : "flexible";
  // pace -> vibe
  const vibeMap = { adrenaline: "adventurous and active", chill: "relaxed", cultural: "historical and cultural" };
  const vibe = vibeMap[body.pace] || body.pace || "relaxed";
  // datetime-local "2026-07-01T08:00" -> "2026-07-01"
  const startDate = (body.startDate || "").split("T")[0];

  return {
    start_place: body.startLocation,
    end_place: body.endLocation || body.startLocation, // round trip if no end given
    start_date: startDate,
    duration: Number(body.duration) || 3,
    travelers: body.travelers || "2 adults",
    vibe,
    budget,
    transport: body.hasVehicle === "yes" ? "driving own car" : "arranged vehicle",
    trip_description: body.notes || `A ${vibe} trip from ${body.startLocation}.`,
    weather_preference: body.weatherPreference || "",
  };
}

// POST /api/travel/plan  -> starts a job, returns { jobId }
exports.startPlan = async (req, res) => {
  try {
    const tripRequest = toTripRequest(req.body);
    const r = await fetch(`${AGENT_URL}/design-trip/async`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripRequest),
    });
    if (!r.ok) {
      const text = await r.text();
      return res.status(502).json({ message: "Agent rejected request", detail: text });
    }
    const data = await r.json();
    return res.json({ jobId: data.job_id, status: data.status });
  } catch (err) {
    console.error("startPlan error:", err);
    return res.status(500).json({ message: "Could not reach planning service." });
  }
};

// GET /api/travel/plan/:jobId  -> poll progress / result
exports.getPlanStatus = async (req, res) => {
  try {
    const r = await fetch(`${AGENT_URL}/design-trip/status/${req.params.jobId}`);
    if (r.status === 404) return res.status(404).json({ message: "Job not found" });
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error("getPlanStatus error:", err);
    return res.status(500).json({ message: "Could not reach planning service." });
  }
};
