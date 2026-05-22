const knex = require('../../config/db'); // Points to your active DB connection
const cron = require('node-cron');

const generateAvailability = async () => {
    try {
        console.log('⏳ Starting daily room availability generation...');
        
        // 1. Fetch all active rooms
        const rooms = await knex('rooms').select('id', 'total_quantity', 'base_price_per_night');
        
        const today = new Date();
        const targetDate = new Date();
        targetDate.setMonth(today.getMonth() + 6); // Look 6 months ahead
        
        for (const room of rooms) {
            // Find the latest date currently in the database for this specific room
            const latestRecord = await knex('room_availability')
                .where('room_id', room.id)
                .max('date as maxDate')
                .first();
                
            let currentDate = latestRecord && latestRecord.maxDate 
                ? new Date(latestRecord.maxDate) 
                : new Date();
            
            // Start generating from the day AFTER the latest record
            currentDate.setDate(currentDate.getDate() + 1); 
            
            const newRecords = [];
            
            while (currentDate <= targetDate) {
                newRecords.push({
                    room_id: room.id,
                    date: currentDate.toISOString().split('T')[0],
                    available_quantity: room.total_quantity || 1,
                    dynamic_price: room.base_price_per_night || 0.00,
                    is_blocked: 0
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // 2. Perform the Insert with Conflict Handling
            if (newRecords.length > 0) {
                // This 'onConflict' prevents the duplicate entry crash
                await knex('room_availability')
                    .insert(newRecords)
                    .onConflict(['room_id', 'date']) 
                    .ignore(); 
            }
        }
        console.log('✅ Successfully synced room availability 6 months into the future.');
    } catch (error) {
        console.error('❌ Error generating availability:', error);
    }
};

// Schedule to run at 00:00 (Midnight) every day
cron.schedule('0 0 * * *', () => {
    generateAvailability();
});

module.exports = generateAvailability;