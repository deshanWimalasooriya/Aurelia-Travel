// API/routes/travelPlanRoutes.js
//
// Wire these into server.js the same way your other routes are mounted, e.g.:
//   const travelPlanRoutes = require("./API/routes/travelPlanRoutes");
//   app.use("/api/travel", travelPlanRoutes);
//
// Protect with your existing auth middleware so only logged-in users can plan,
// matching the frontend's `user ? <TravelPage/> : redirect` guard.

const express = require("express");
const router = express.Router();
const { startPlan, getPlanStatus } = require("../controllers/travelPlanController");

// const { protect } = require("../middleware/authMiddleware"); // if you want auth
// router.post("/plan", protect, startPlan);
// router.get("/plan/:jobId", protect, getPlanStatus);

router.post("/plan", startPlan);
router.get("/plan/:jobId", getPlanStatus);

module.exports = router;
