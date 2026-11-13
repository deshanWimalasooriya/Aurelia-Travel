const express = require('express');
const router = express.Router();
const smartPlanController = require('../controllers/smartPlanController');
const agentController = require('../controllers/agentController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/smart-plan/generate - Generate RAG AI Itinerary
router.post('/generate', smartPlanController.generateSmartPlan);

// GET /api/smart-plan/alternatives - Fetch 4 nearby hotels or places for item swapping
router.get('/alternatives', smartPlanController.getAlternatives);

// --- travel-Agent-2.0 (Python CrewAI service) ---
// POST /api/smart-plan/agent/start            - start a long-running agent job, returns { jobId }
// GET  /api/smart-plan/agent/status/:jobId    - poll progress; returns itinerary + routeOptions when done
router.post('/agent/start', verifyToken, agentController.startAgentTrip);
router.get('/agent/status/:jobId', verifyToken, agentController.agentTripStatus);
// GET /api/smart-plan/reverse-geocode?lat=&lng= - turn a GPS fix / map pin into a town name
router.get('/reverse-geocode', verifyToken, agentController.reverseGeocodeHandler);
// GET /api/smart-plan/geocode?q=Jaffna - typed town name -> coordinates for the map pin
router.get('/geocode', verifyToken, agentController.geocodeHandler);

module.exports = router;
