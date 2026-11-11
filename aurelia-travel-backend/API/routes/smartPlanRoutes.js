const express = require('express');
const router = express.Router();
const smartPlanController = require('../controllers/smartPlanController');

// POST /api/smart-plan/generate - Generate RAG AI Itinerary
router.post('/generate', smartPlanController.generateSmartPlan);

// GET /api/smart-plan/alternatives - Fetch 4 nearby hotels or places for item swapping
router.get('/alternatives', smartPlanController.getAlternatives);

module.exports = router;
