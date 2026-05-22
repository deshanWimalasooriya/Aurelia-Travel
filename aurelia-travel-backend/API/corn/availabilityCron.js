const knex = require('../../knexfile'); // Adjust this path to your actual knex/db connection file
const cron = require('node-cron');

const generateAvailability = async () => {
    try {
        console.log('⏳ Starting daily room availability generation...');
        
        // 1. Fetch all active rooms
        // Note: Update 'quantity' and 'base_price' if your actual columns in the `rooms` table are named differently.
        const rooms = await knex('rooms').select('id', 'quantity', 'base_price'); 
        
        // 2. Set the target date (e.g., Generate availability for exactly 6 months from today)
        const today = new Date();
        const targetDate = new Date();
        targetDate.setMonth(today.getMonth() + 6);
        
        for (const room of rooms) {
            // Find the latest date currently in the database for this specific room
            const latestRecord = await knex('room_availability')
                .where('room_id', room.id)
                .max('date as maxDate')
                .first();
                
            let currentDate = latestRecord && latestRecord.maxDate 
                ? new Date(latestRecord.maxDate) 
                : new Date();
            
            // If the latest record is already 6 months out, skip this room
            if (currentDate >= targetDate) continue;
            
            // Start generating from the day AFTER the latest record
            currentDate.setDate(currentDate.getDate() + 1); 
            
            const newRecords = [];
            
            // Loop day-by-day until we reach the target date
            while (currentDate <= targetDate) {
                newRecords.push({
                    room_id: room.id,
                    date: currentDate.toISOString().split('T')[0],
                    available_quantity: room.quantity || 5,     // Fallback to 5 if room.quantity is null
                    dynamic_price: room.base_price || 250.00,   // Fallback to 250.00 if room.base_price is null
                    is_blocked: 0
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Bulk insert the new dates into the database safely
            if (newRecords.length > 0) {
                await knex.batchInsert('room_availability', newRecords, 100);
            }
        }
        console.log('✅ Successfully synced room availability 6 months into the future.');
    } catch (error) {
        console.error('❌ Error generating availability:', error);
    }
};

// 3. Schedule the Cron Job to run at 00:00 (Midnight) every single day
cron.schedule('0 0 * * *', () => {
    generateAvailability();
});

// Export the function so we can run it immediately on server startup if we want
module.exports = generateAvailability;