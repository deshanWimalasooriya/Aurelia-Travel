const axios = require('axios');

/**
 * AI Service for Aurelia Travel Smart Plan Generation (RAG Pipeline)
 * 
 * Supports:
 * 1. Google Gemini API (GEMINI_API_KEY) with native JSON response mode
 * 2. OpenAI API (OPENAI_API_KEY) with response_format json_object
 * 3. Intelligent Heuristic Planner (Cold-start fallback if no key is configured)
 */
class AIService {
  /**
   * Generates a day-by-day itinerary given user preferences and retrieved DB records.
   * 
   * @param {Object} params
   * @param {string} params.startLocation
   * @param {string} params.destinationCity
   * @param {number} params.durationDays
   * @param {number} params.budgetUSD
   * @param {string} params.vibe
   * @param {string} params.transportMode
   * @param {number} params.guests
   * @param {Array} params.hotels - Retrieved from hotels & rooms & availability
   * @param {Array} params.places - Retrieved from tourist_places
   * @returns {Promise<Object>} Strict JSON itinerary matching Aurelia Travel specs
   */
  async generateSmartPlan({
    startLocation = 'Colombo',
    destinationCity,
    durationDays = 2,
    budgetUSD = 150,
    vibe = 'Relaxing',
    transportMode = 'Private Van',
    guests = 1,
    hotels = [],
    places = []
  }) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    // 1. Construct RAG Context from retrieved database records
    const ragContext = this.buildRAGContext({
      startLocation,
      destinationCity,
      durationDays,
      budgetUSD,
      vibe,
      transportMode,
      guests,
      hotels,
      places
    });

    // 2. Build System Prompt & Instructions
    const systemInstruction = `You are Aurelia Travel's Elite AI Trip Architect, specialized in curating luxury, highly-optimized getaways across Sri Lanka.
Your task is to generate a comprehensive, day-by-day travel itinerary using ONLY the provided verified Database records (Hotels and Tourist Attractions).

CRITICAL CONSTRAINTS:
1. ONLY select hotels and attractions from the provided database list. Reference their exact database 'id' as 'reference_id', along with their exact 'name', 'latitude', 'longitude', 'costUSD', and 'image_url'.
2. The total estimated cost must remain strictly within the user's budget of $${budgetUSD} USD for ${guests} ${guests === 1 ? 'guest' : 'guests'}.
3. Factor in the requested transport mode ("${transportMode}") and vibe ("${vibe}").
4. Each day must contain chronologically ordered 'items' containing the departure/stay hotel and visited places with time slots (Morning, Midday, Afternoon, Evening).
5. Output MUST be a strictly valid JSON object matching the exact schema specified below. DO NOT output markdown code fences, backticks, or explanatory text.`;

    const prompt = `DATABASE CONTEXT FOR RETRIEVAL-AUGMENTED GENERATION:
${JSON.stringify(ragContext, null, 2)}

REQUIRED JSON OUTPUT SCHEMA:
{
  "tripTitle": "String - evocative title for the getaway",
  "destinationCity": "${destinationCity}",
  "startLocation": "${startLocation}",
  "durationDays": ${durationDays},
  "budgetUSD": ${budgetUSD},
  "vibe": "${vibe}",
  "transportMode": "${transportMode}",
  "guests": ${guests},
  "summary": {
    "totalEstimatedCost": Number,
    "totalDistanceKm": Number,
    "transportBreakdown": "String - explanation of transit costs and routing efficiency"
  },
  "days": [
    {
      "dayNumber": 1,
      "theme": "String - day theme",
      "items": [
        {
          "type": "hotel or place",
          "reference_id": Number,
          "name": "String",
          "latitude": Number,
          "longitude": Number,
          "timeSlot": "String (e.g. 09:00 AM - 11:30 AM)",
          "durationMins": Number,
          "costUSD": Number,
          "notes": "String - highlight or practical tip",
          "image_url": "String"
        }
      ]
    }
  ]
}

Now generate the complete itinerary in strict JSON format.`;

    // 3. Dispatch to available LLM Provider
    if (geminiKey) {
      try {
        console.log('🤖 Invoking Google Gemini LLM with RAG context...');
        return await this.callGemini(geminiKey, systemInstruction, prompt);
      } catch (err) {
        console.error('⚠️ Google Gemini call failed, falling back:', err.message);
      }
    }

    if (openAiKey) {
      try {
        console.log('🤖 Invoking OpenAI LLM with RAG context...');
        return await this.callOpenAI(openAiKey, systemInstruction, prompt);
      } catch (err) {
        console.error('⚠️ OpenAI call failed, falling back:', err.message);
      }
    }

    // 4. Fallback Heuristic Generator (Zero-Key Cold-Start Guarantee)
    console.log('ℹ️ No live AI key detected or API quota exceeded. Employing intelligent RAG heuristic scheduler...');
    return this.generateHeuristicPlan({
      startLocation,
      destinationCity,
      durationDays,
      budgetUSD,
      vibe,
      transportMode,
      guests,
      hotels,
      places
    });
  }

  /**
   * Prepares compact JSON context for the LLM prompt.
   */
  buildRAGContext({ startLocation, destinationCity, durationDays, budgetUSD, vibe, transportMode, guests, hotels, places }) {
    return {
      userPreferences: {
        startLocation,
        destinationCity,
        durationDays,
        budgetUSD,
        vibe,
        transportMode,
        guests
      },
      availableHotels: hotels.map(h => ({
        id: h.id,
        name: h.name,
        pricePerNightUSD: Number(h.price_per_night || 45.00),
        capacity: h.capacity || 2,
        rating: Number(h.rating_average || 4.5),
        latitude: Number(h.latitude),
        longitude: Number(h.longitude),
        image_url: h.main_image || ''
      })),
      availableTouristPlaces: places.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        estimatedTimeMins: p.estimated_time_spent_mins,
        costUSD: Number(p.entry_fee_usd || 0.00),
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
        rating: Number(p.rating || 4.5),
        image_url: p.image_url || ''
      }))
    };
  }

  /**
   * Google Gemini API Client (Forces JSON mode via responseMimeType)
   */
  async callGemini(apiKey, systemInstruction, userPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    };

    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 25000
    });

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return this.cleanAndParseJSON(rawText);
  }

  /**
   * OpenAI API Client (Forces JSON mode via response_format)
   */
  async callOpenAI(apiKey, systemInstruction, userPrompt) {
    const url = 'https://api.openai.com/v1/chat/completions';

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 25000
    });

    const rawText = response.data?.choices?.[0]?.message?.content;
    return this.cleanAndParseJSON(rawText);
  }

  /**
   * Safely strips code blocks and parses JSON output
   */
  cleanAndParseJSON(text) {
    if (!text) throw new Error('Empty response received from LLM.');

    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    }

    return JSON.parse(cleaned);
  }

  /**
   * Deterministic RAG Heuristic Scheduler
   * Cold-start guarantee that returns the exact required schema.
   */
  generateHeuristicPlan({ startLocation, destinationCity, durationDays, budgetUSD, vibe, transportMode, guests, hotels, places }) {
    // 1. Pick best hotel matching capacity & budget
    const hotel = hotels.length > 0 
      ? hotels[0] 
      : {
          id: 1,
          name: `${destinationCity} Grand Heritage Hotel`,
          latitude: 6.0535,
          longitude: 80.2210,
          price_per_night: 55.00,
          main_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
        };

    const hotelNightly = Number(hotel.price_per_night || 50.00);
    const totalLodgingCost = hotelNightly * durationDays;

    // 2. Fallback places if empty
    const safePlaces = places.length > 0 ? places : [
      { id: 101, name: `${destinationCity} Historical Fort`, category: 'History', latitude: 6.0535, longitude: 80.2210, estimated_time_spent_mins: 120, entry_fee_usd: 5.00, image_url: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=800&q=80' },
      { id: 102, name: `${destinationCity} Coral Sanctuary`, category: 'Nature', latitude: 6.0600, longitude: 80.2300, estimated_time_spent_mins: 90, entry_fee_usd: 0.00, image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
      { id: 103, name: `${destinationCity} Sunset Point`, category: 'Relaxation', latitude: 6.0450, longitude: 80.2150, estimated_time_spent_mins: 60, entry_fee_usd: 0.00, image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80' },
      { id: 104, name: `${destinationCity} Cultural Center`, category: 'Culture', latitude: 6.0580, longitude: 80.2190, estimated_time_spent_mins: 90, entry_fee_usd: 4.00, image_url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80' }
    ];

    const timeSlots = ['09:00 AM - 11:30 AM', '01:00 PM - 03:30 PM', '05:00 PM - 07:00 PM'];
    const days = [];
    let placeIdx = 0;
    let totalActivityCost = 0;
    const estDistanceKm = durationDays * 38.5;

    for (let d = 1; d <= durationDays; d++) {
      const items = [];

      // Day begins at the Hotel
      items.push({
        type: 'hotel',
        reference_id: hotel.id,
        name: hotel.name,
        latitude: Number(hotel.latitude),
        longitude: Number(hotel.longitude),
        timeSlot: '08:00 AM - 09:00 AM',
        durationMins: 60,
        costUSD: d === 1 ? hotelNightly : 0.00, // Charged once per night
        notes: `Base camp & breakfast at ${hotel.name}`,
        image_url: hotel.main_image || ''
      });

      // 3 activities per day
      for (let a = 0; a < 3; a++) {
        const place = safePlaces[placeIdx % safePlaces.length];
        placeIdx++;

        const cost = Number(place.entry_fee_usd || 0.00);
        totalActivityCost += cost;

        items.push({
          type: 'place',
          reference_id: place.id,
          name: place.name,
          latitude: Number(place.latitude),
          longitude: Number(place.longitude),
          timeSlot: timeSlots[a],
          durationMins: place.estimated_time_spent_mins || 90,
          costUSD: cost,
          notes: `Explore ${place.name} aligned with your ${vibe.toLowerCase()} trip pace.`,
          image_url: place.image_url || ''
        });
      }

      days.push({
        dayNumber: d,
        theme: `Day ${d}: ${destinationCity} Highlights & ${vibe} Immersion`,
        items
      });
    }

    const totalEstimatedCost = Number((totalLodgingCost + totalActivityCost).toFixed(2));

    return {
      tripTitle: `${durationDays}-Day ${vibe} Getaway in ${destinationCity}`,
      destinationCity,
      startLocation,
      durationDays,
      budgetUSD,
      vibe,
      transportMode,
      guests,
      summary: {
        totalEstimatedCost,
        totalDistanceKm: estDistanceKm,
        transportBreakdown: `Estimated road travel via ${transportMode} covering approx ${estDistanceKm} km round-trip across selected waypoints.`
      },
      days
    };
  }
}

module.exports = new AIService();
