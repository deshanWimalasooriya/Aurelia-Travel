// API/controllers/travelPlanController.js
//
// Proxies the "Smart Plan" requests from the frontend to the Python agent
// service. Keeps the agent URL server-side. Maps the frontend's form fields
// into the agent's TripRequest shape.
//
// Add AGENT_URL to your .env, e.g.  AGENT_URL=http://localhost:8000

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

// Node 18+ has global fetch. On older Node, install node-fetch and import it.

function toTripRequest(body) {
  const budget = body.budget ? `LKR ${body.budget} total for the trip` : "flexible";

  const vibeMap = {
    adventure: "adventurous and active",
    relaxed: "relaxed and easygoing",
    cultural: "historical and cultural",
    family: "family-friendly",
    romantic: "romantic",
    nature: "nature and scenery focused",
  };
  const vibe = vibeMap[body.pace] || body.pace || "relaxed";

  const startDate = (body.startDate || "").split("T")[0];

  const adults = Number(body.adults) || 2;
  const children = Number(body.children) || 0;
  const rooms = Number(body.rooms) || 1;
  const travelers =
    `${adults} adult${adults !== 1 ? "s" : ""}` +
    (children > 0 ? `, ${children} child${children !== 1 ? "ren" : ""}` : "") +
    `, ${rooms} room${rooms !== 1 ? "s" : ""}`;

  const amenities = (body.amenityNames && body.amenityNames.length)
    ? body.amenityNames
    : (body.amenities || []);

  const descParts = [];
  if (body.tripDescription) descParts.push(body.tripDescription);
  if (amenities.length) descParts.push(`Preferred hotel amenities: ${amenities.join(", ")}.`);
  const tripDescription = descParts.join(" ") || `A ${vibe} trip from ${body.startLocation}.`;

  return {
    start_place: body.startLocation,
    end_place: body.endLocation || body.startLocation,
    start_date: startDate,
    duration: Number(body.duration) || 3,
    travelers,
    vibe,
    budget,
    transport: body.hasVehicle === "yes" ? "driving own car" : "arranged vehicle",
    trip_description: tripDescription,
    weather_preference: body.weatherPreference || "",
    amenities,
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
