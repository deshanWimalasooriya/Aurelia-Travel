const crypto = require('crypto');
const knex = require('../../config/db');

/**
 * Controller: Save or Update Trip (Atomic Knex Transaction)
 * Route: POST /api/trips/save
 * Access: Protected (JWT required)
 */
exports.saveTrip = async (req, res) => {
  const trx = await knex.transaction();
  try {
    const userId = req.user ? req.user.id : null;
    const {
      id,
      title,
      destinationCity,
      destination_city,
      durationDays,
      duration_days,
      targetBudgetUSD,
      budgetUSD,
      totalEstimatedCostUSD,
      totalEstimatedCost,
      transportMode,
      transport_mode,
      vibe,
      isPublic = true,
      is_public = true,
      days = [],
      recommendedHotel = null
    } = req.body;

    const city = (destinationCity || destination_city || 'Sri Lanka').trim();
    const tripTitle = (title || `${city} Smart Escapade`).trim();
    const daysCount = parseInt(durationDays || duration_days || days.length || 2, 10);
    const targetBudget = parseFloat(targetBudgetUSD || budgetUSD || 0);
    const estimatedCost = parseFloat(totalEstimatedCostUSD || totalEstimatedCost || 0);
    const transport = transportMode || transport_mode || 'Private Van';
    const vibeClean = vibe || 'Relaxing';
    const publicFlag = isPublic !== undefined ? isPublic : is_public;

    let tripId = id ? parseInt(id, 10) : null;
    let shareUuid = null;

    if (tripId) {
      // 1. Updating existing trip: verify ownership
      const existing = await trx('saved_trips').where('id', tripId).first();
      if (!existing) {
        await trx.rollback();
        return res.status(404).json({ success: false, message: 'Saved trip not found.' });
      }

      if (existing.user_id && existing.user_id !== userId && req.user?.role !== 'admin') {
        await trx.rollback();
        return res.status(403).json({ success: false, message: 'You do not have permission to update this trip.' });
      }

      shareUuid = existing.share_uuid;

      await trx('saved_trips')
        .where('id', tripId)
        .update({
          title: tripTitle,
          destination_city: city,
          duration_days: daysCount,
          target_budget_usd: targetBudget,
          total_estimated_cost_usd: estimatedCost,
          transport_mode: transport,
          vibe: vibeClean,
          is_public: publicFlag,
          updated_at: trx.fn.now()
        });

      // Clear old items for clean bulk-insert
      await trx('trip_items').where('trip_id', tripId).del();

    } else {
      // 2. Creating new trip: generate share UUID
      shareUuid = crypto.randomUUID().replace(/-/g, '').substring(0, 24);

      const [newId] = await trx('saved_trips').insert({
        user_id: userId,
        title: tripTitle,
        destination_city: city,
        duration_days: daysCount,
        target_budget_usd: targetBudget,
        total_estimated_cost_usd: estimatedCost,
        transport_mode: transport,
        vibe: vibeClean,
        share_uuid: shareUuid,
        is_public: publicFlag,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });

      tripId = newId;
    }

    // 3. Prepare bulk trip_items
    const itemsToInsert = [];

    // Optional Hotel Stay Item (Day 1 anchor)
    if (recommendedHotel) {
      const hotelId = recommendedHotel.reference_id || recommendedHotel.id || null;
      itemsToInsert.push({
        trip_id: tripId,
        item_type: 'hotel',
        reference_id: hotelId,
        day_number: 1,
        order_index: 0,
        time_slot: '02:00 PM Check-in',
        custom_notes: recommendedHotel.description || recommendedHotel.notes || null,
        estimated_cost_usd: parseFloat(recommendedHotel.pricePerNightUSD || recommendedHotel.costUSD || 0),
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    // Daily Attraction Stops
    if (Array.isArray(days)) {
      days.forEach((day) => {
        const dayNum = parseInt(day.dayNumber || 1, 10);
        if (Array.isArray(day.items)) {
          day.items.forEach((item, index) => {
            const placeId = item.reference_id || item.id || null;
            itemsToInsert.push({
              trip_id: tripId,
              item_type: item.type === 'hotel' ? 'hotel' : 'place',
              reference_id: placeId,
              day_number: dayNum,
              order_index: index + 1,
              time_slot: item.timeSlot || null,
              custom_notes: item.notes || item.description || null,
              estimated_cost_usd: parseFloat(item.costUSD || 0),
              created_at: trx.fn.now(),
              updated_at: trx.fn.now()
            });
          });
        }
      });
    }

    if (itemsToInsert.length > 0) {
      await trx('trip_items').insert(itemsToInsert);
    }

    await trx.commit();

    return res.status(200).json({
      success: true,
      message: 'Trip saved successfully.',
      data: {
        id: tripId,
        share_uuid: shareUuid,
        title: tripTitle,
        itemCount: itemsToInsert.length
      }
    });

  } catch (error) {
    await trx.rollback();
    console.error('❌ [saveTrip Transaction Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save customized trip.',
      error: error.message
    });
  }
};

/**
 * Controller: Get Logged-in User's Saved Trips
 * Route: GET /api/trips/my-trips
 * Access: Protected (JWT required)
 */
exports.getMyTrips = async (req, res) => {
  try {
    const userId = req.user.id;

    const trips = await knex('saved_trips')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');

    if (!trips || trips.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Hydrate each trip with item count and cover photo
    const hydratedTrips = await Promise.all(
      trips.map(async (t) => {
        const items = await knex('trip_items')
          .where('trip_id', t.id)
          .orderBy('day_number', 'asc')
          .orderBy('order_index', 'asc');

        // Look for a hotel or place image for cover photo
        let coverImage = null;
        const hotelItem = items.find(i => i.item_type === 'hotel');
        const placeItem = items.find(i => i.item_type === 'place');

        if (hotelItem && hotelItem.reference_id) {
          const hotel = await knex('hotels').where('id', hotelItem.reference_id).select('main_image').first();
          if (hotel && hotel.main_image) coverImage = hotel.main_image;
        }

        if (!coverImage && placeItem && placeItem.reference_id) {
          const place = await knex('tourist_places').where('id', placeItem.reference_id).select('image_url').first();
          if (place && place.image_url) coverImage = place.image_url;
        }

        if (!coverImage) {
          coverImage = 'https://images.unsplash.com/photo-1546768292-fb12f6c92568?auto=format&fit=crop&w=800&q=80';
        }

        return {
          id: t.id,
          title: t.title,
          destinationCity: t.destination_city,
          durationDays: t.duration_days,
          targetBudgetUSD: t.target_budget_usd,
          totalEstimatedCostUSD: t.total_estimated_cost_usd,
          transportMode: t.transport_mode,
          vibe: t.vibe,
          share_uuid: t.share_uuid,
          isPublic: Boolean(t.is_public),
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          itemCount: items.length,
          coverImage
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: hydratedTrips
    });

  } catch (error) {
    console.error('❌ [getMyTrips Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your saved trips.',
      error: error.message
    });
  }
};

/**
 * Controller: Delete Saved Trip
 * Route: DELETE /api/trips/:id
 * Access: Protected (JWT required)
 */
exports.deleteTrip = async (req, res) => {
  try {
    const userId = req.user.id;
    const tripId = parseInt(req.params.id, 10);

    const trip = await knex('saved_trips').where('id', tripId).first();
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Saved trip not found.' });
    }

    if (trip.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this trip.' });
    }

    // Cascade delete via FK will delete trip_items automatically
    await knex('saved_trips').where('id', tripId).del();

    return res.status(200).json({
      success: true,
      message: 'Trip deleted successfully.'
    });

  } catch (error) {
    console.error('❌ [deleteTrip Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete trip.',
      error: error.message
    });
  }
};

/**
 * Controller: Get Public Shared Trip Itinerary (Hydrated)
 * Route: GET /api/trips/shared/:uuid
 * Access: Public (NO JWT required)
 */
exports.getSharedTrip = async (req, res) => {
  try {
    const { uuid } = req.params;

    if (!uuid || typeof uuid !== 'string') {
      return res.status(400).json({ success: false, message: 'Share UUID is required.' });
    }

    const trip = await knex('saved_trips')
      .where('share_uuid', uuid.trim())
      .first();

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Shared trip not found or link has expired.' });
    }

    if (!trip.is_public) {
      return res.status(403).json({ success: false, message: 'This itinerary has been marked private by its author.' });
    }

    // Fetch all items
    const rawItems = await knex('trip_items')
      .where('trip_id', trip.id)
      .orderBy('day_number', 'asc')
      .orderBy('order_index', 'asc');

    let recommendedHotel = null;
    const daysMap = {};

    for (let i = 1; i <= trip.duration_days; i++) {
      daysMap[i] = {
        dayNumber: i,
        theme: `Day ${i} Exploration`,
        items: []
      };
    }

    for (const item of rawItems) {
      if (item.item_type === 'hotel') {
        let hotelDetails = null;
        if (item.reference_id) {
          hotelDetails = await knex('hotels').where('id', item.reference_id).first();
        }

        recommendedHotel = {
          id: item.reference_id || 101,
          reference_id: item.reference_id || 101,
          name: hotelDetails?.name || 'Curated Boutique Stay',
          city: hotelDetails?.city || trip.destination_city,
          latitude: hotelDetails?.latitude ? Number(hotelDetails.latitude) : 7.2936,
          longitude: hotelDetails?.longitude ? Number(hotelDetails.longitude) : 80.6382,
          pricePerNightUSD: Number(item.estimated_cost_usd || 65),
          costUSD: Number(item.estimated_cost_usd || 65),
          rating: hotelDetails?.rating_average ? Number(hotelDetails.rating_average) : 4.8,
          image_url: hotelDetails?.main_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
          description: hotelDetails?.description || item.custom_notes || 'Comfortable stay selected for your route.'
        };
      } else {
        // Tourist Place
        let placeDetails = null;
        if (item.reference_id) {
          placeDetails = await knex('tourist_places').where('id', item.reference_id).first();
        }

        const dayNum = item.day_number || 1;
        if (!daysMap[dayNum]) {
          daysMap[dayNum] = {
            dayNumber: dayNum,
            theme: `Day ${dayNum} Adventure`,
            items: []
          };
        }

        daysMap[dayNum].items.push({
          type: 'place',
          reference_id: item.reference_id,
          id: item.reference_id,
          name: placeDetails?.name || 'Scenic Sight',
          city: placeDetails?.city || trip.destination_city,
          category: placeDetails?.category || 'Culture',
          latitude: placeDetails?.latitude ? Number(placeDetails.latitude) : 7.2936,
          longitude: placeDetails?.longitude ? Number(placeDetails.longitude) : 80.6413,
          timeSlot: item.time_slot || '10:00 AM - 12:00 PM',
          durationMins: placeDetails?.estimated_time_spent_mins || 90,
          costUSD: Number(item.estimated_cost_usd || placeDetails?.entry_fee_usd || 0),
          rating: placeDetails?.rating ? Number(placeDetails.rating) : 4.8,
          notes: item.custom_notes || placeDetails?.description || 'Must-visit travel destination.',
          image_url: placeDetails?.image_url || 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=600&q=80'
        });
      }
    }

    const daysArray = Object.values(daysMap);

    // Format full itinerary response
    const hydratedItinerary = {
      id: trip.id,
      tripTitle: trip.title,
      destinationCity: trip.destination_city,
      durationDays: trip.duration_days,
      budgetUSD: Number(trip.target_budget_usd),
      transportMode: trip.transport_mode,
      vibe: trip.vibe,
      share_uuid: trip.share_uuid,
      isPublic: Boolean(trip.is_public),
      recommendedHotel,
      days: daysArray,
      summary: {
        totalEstimatedCost: Number(trip.total_estimated_cost_usd),
        totalDistanceKm: 120,
        transportBreakdown: `${trip.transport_mode} • Curated road routes`
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Shared itinerary retrieved successfully.',
      data: hydratedItinerary
    });

  } catch (error) {
    console.error('❌ [getSharedTrip Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve shared trip itinerary.',
      error: error.message
    });
  }
};

