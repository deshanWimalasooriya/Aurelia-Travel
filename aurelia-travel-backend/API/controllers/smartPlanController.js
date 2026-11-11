const knex = require('../../config/db');
const aiService = require('../services/aiService');

/**
 * Controller: Generate Smart Plan Itinerary using RAG
 * Route: POST /api/smart-plan/generate
 */
exports.generateSmartPlan = async (req, res) => {
  try {
    const {
      startLocation = 'Colombo',
      destinationCity,
      durationDays = 2,
      budgetUSD = 150,
      vibe = 'Relaxing',
      transportMode = 'Private Van',
      guests = 1
    } = req.body;

    // 1. Validation
    if (!destinationCity || typeof destinationCity !== 'string' || !destinationCity.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Destination city is required (e.g. Galle, Kandy, Ella, Colombo, Sigiriya, Mirissa, Nuwara Eliya).'
      });
    }

    const cityClean = destinationCity.trim();
    const days = Math.min(Math.max(parseInt(durationDays, 10) || 2, 1), 7);
    const budget = Math.max(parseFloat(budgetUSD) || 100, 25);
    const guestCount = Math.max(parseInt(guests, 10) || 1, 1);
    const vibeClean = typeof vibe === 'string' && vibe.trim() ? vibe.trim() : 'Relaxing';
    const transportClean = typeof transportMode === 'string' && transportMode.trim() ? transportMode.trim() : 'Private Van';

    console.log(`🔍 [SmartPlan RAG] Searching DB for City: "${cityClean}", Budget: $${budget}, Days: ${days}, Guests: ${guestCount}, Vibe: "${vibeClean}"`);

    // ------------------------------------------------------------------------
    // 2. RETRIEVAL STEP 1: Query Available Hotels (rooms & room_availability)
    // ------------------------------------------------------------------------
    let hotels = [];
    const hasAvailabilityTable = await knex.schema.hasTable('room_availability');

    if (hasAvailabilityTable) {
      hotels = await knex('hotels')
        .join('rooms', 'hotels.id', 'rooms.hotel_id')
        .leftJoin('room_availability', function() {
          this.on('rooms.id', '=', 'room_availability.room_id')
              .andOn('room_availability.date', '>=', knex.raw('CURDATE()'))
              .andOn('room_availability.available_quantity', '>', 0);
        })
        .select(
          'hotels.id',
          'hotels.name',
          'hotels.city',
          'hotels.latitude',
          'hotels.longitude',
          'hotels.rating_average',
          'hotels.star_rating',
          'hotels.main_image',
          'hotels.description',
          'rooms.id as room_id',
          'rooms.title as room_title',
          'rooms.base_price_per_night',
          'rooms.capacity',
          knex.raw('COALESCE(room_availability.dynamic_price, rooms.base_price_per_night, 45.00) as price_per_night')
        )
        .where('hotels.is_active', true)
        .whereRaw('LOWER(hotels.city) LIKE LOWER(?)', [`%${cityClean}%`])
        .where('rooms.capacity', '>=', guestCount)
        .where('rooms.base_price_per_night', '<=', budget)
        .groupBy('hotels.id')
        .orderBy('hotels.rating_average', 'desc')
        .limit(10);
    }

    // Fallback if availability table has no current date matches or strict budget exceeded
    if (!hotels || hotels.length === 0) {
      console.log(`ℹ️ [SmartPlan RAG] Fallback to available rooms query in ${cityClean}...`);
      hotels = await knex('hotels')
        .leftJoin('rooms', 'hotels.id', 'rooms.hotel_id')
        .select(
          'hotels.id',
          'hotels.name',
          'hotels.city',
          'hotels.latitude',
          'hotels.longitude',
          'hotels.rating_average',
          'hotels.star_rating',
          'hotels.main_image',
          'hotels.description',
          'rooms.capacity',
          knex.raw('COALESCE(MIN(rooms.base_price_per_night), 45.00) as price_per_night')
        )
        .where('hotels.is_active', true)
        .whereRaw('LOWER(hotels.city) LIKE LOWER(?)', [`%${cityClean}%`])
        .groupBy('hotels.id')
        .orderBy('hotels.rating_average', 'desc')
        .limit(10);
    }

    // ------------------------------------------------------------------------
    // 3. RETRIEVAL STEP 2: Query Matching Tourist Places
    // ------------------------------------------------------------------------
    let places = [];
    const hasPlacesTable = await knex.schema.hasTable('tourist_places');
    
    if (hasPlacesTable) {
      places = await knex('tourist_places')
        .select(
          'id',
          'name',
          'city',
          'category',
          'latitude',
          'longitude',
          'estimated_time_spent_mins',
          'entry_fee_usd',
          'description',
          'image_url',
          'rating'
        )
        .whereRaw('LOWER(city) LIKE LOWER(?)', [`%${cityClean}%`])
        .where('entry_fee_usd', '<=', budget)
        .orderBy('rating', 'desc')
        .limit(15);

      // If budget was too strict, grab lowest cost top places
      if (places.length === 0) {
        places = await knex('tourist_places')
          .select('*')
          .whereRaw('LOWER(city) LIKE LOWER(?)', [`%${cityClean}%`])
          .orderBy('entry_fee_usd', 'asc')
          .limit(15);
      }
    }

    console.log(`📦 [SmartPlan RAG] Retrieved Context: ${hotels.length} Hotels, ${places.length} Attractions`);

    // ------------------------------------------------------------------------
    // 4. GENERATION STEP: Pass RAG Context to LLM Pipeline
    // ------------------------------------------------------------------------
    const itinerary = await aiService.generateSmartPlan({
      startLocation,
      destinationCity: cityClean,
      durationDays: days,
      budgetUSD: budget,
      vibe: vibeClean,
      transportMode: transportClean,
      guests: guestCount,
      hotels,
      places
    });

    return res.status(200).json({
      success: true,
      message: 'Smart Plan generated successfully with RAG context',
      data: itinerary
    });

  } catch (error) {
    console.error('❌ [SmartPlan Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate Smart Plan itinerary',
      error: error.message
    });
  }
};

/**
 * Controller: Get Alternative Items (Hotels or Places) for Dynamic Swapping
 * Route: GET /api/smart-plan/alternatives?city=Galle&type=hotel&excludeIds=1,2&maxPrice=100
 */
exports.getAlternatives = async (req, res) => {
  try {
    const { city, type = 'place', excludeIds = '', maxPrice } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City query parameter is required.'
      });
    }

    const cityClean = city.trim();
    const parsedExclude = excludeIds
      ? excludeIds.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean)
      : [];
    const priceCap = maxPrice ? parseFloat(maxPrice) : null;

    if (type === 'hotel') {
      let query = knex('hotels')
        .leftJoin('rooms', 'hotels.id', 'rooms.hotel_id')
        .select(
          'hotels.id',
          'hotels.name',
          'hotels.city',
          'hotels.latitude',
          'hotels.longitude',
          'hotels.rating_average as rating',
          'hotels.star_rating',
          'hotels.main_image as image_url',
          'hotels.description',
          knex.raw('COALESCE(MIN(rooms.base_price_per_night), 50.00) as costUSD')
        )
        .where('hotels.is_active', true)
        .whereRaw('LOWER(hotels.city) LIKE LOWER(?)', [`%${cityClean}%`]);

      if (parsedExclude.length > 0) {
        query = query.whereNotIn('hotels.id', parsedExclude);
      }

      query = query.groupBy('hotels.id');

      if (priceCap) {
        query = query.havingRaw('MIN(rooms.base_price_per_night) <= ? OR MIN(rooms.base_price_per_night) IS NULL', [priceCap]);
      }

      const alternatives = await query.orderBy('hotels.rating_average', 'desc').limit(4);

      return res.status(200).json({
        success: true,
        type: 'hotel',
        city: cityClean,
        data: alternatives.map(h => ({
          ...h,
          type: 'hotel',
          reference_id: h.id
        }))
      });
    } else {
      // Type is tourist place
      let query = knex('tourist_places')
        .select(
          'id as reference_id',
          'name',
          'city',
          'category',
          'latitude',
          'longitude',
          'estimated_time_spent_mins as durationMins',
          'entry_fee_usd as costUSD',
          'description',
          'image_url',
          'rating'
        )
        .whereRaw('LOWER(city) LIKE LOWER(?)', [`%${cityClean}%`]);

      if (parsedExclude.length > 0) {
        query = query.whereNotIn('id', parsedExclude);
      }

      if (priceCap !== null) {
        query = query.where('entry_fee_usd', '<=', priceCap);
      }

      const alternatives = await query.orderBy('rating', 'desc').limit(4);

      return res.status(200).json({
        success: true,
        type: 'place',
        city: cityClean,
        data: alternatives.map(p => ({
          ...p,
          type: 'place'
        }))
      });
    }

  } catch (error) {
    console.error('❌ [SmartPlan Alternatives Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve alternatives',
      error: error.message
    });
  }
};
