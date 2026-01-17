const userModel = require('../models/userModel');
const bookingModel = require('../models/bookingModel'); // Needed for Dashboard
const bcrypt = require('bcrypt');

// 1. GET USER (Admin or Self)
exports.getUserById = async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Security: Don't show hash
        delete user.password;
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. UPDATE USER (Protected & Filtered)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.userId;
        const currentUserRole = req.user.role;

        // Permission Check
        if (parseInt(id) !== currentUserId && currentUserRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { 
            first_name, last_name, phone, bio,
            address_line_1, city, country, postal_code, profile_image,
            password // Optional
        } = req.body;

        const updateData = {};

        // Profile Fields
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (phone) updateData.phone = phone;
        if (bio) updateData.bio = bio;
        if (profile_image) updateData.profile_image = profile_image;

        // Address Fields
        if (address_line_1) updateData.address_line_1 = address_line_1;
        if (city) updateData.city = city;
        if (country) updateData.country = country;
        if (postal_code) updateData.postal_code = postal_code;

        // Password Change
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // ⚠️ REMOVED: card_number, cvv, expiry_date logic (PCI Compliance)

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        const updatedUser = await userModel.update(id, updateData);
        delete updatedUser.password;

        res.status(200).json({ success: true, message: 'Profile updated', data: updatedUser });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. TRAVELER DASHBOARD (Stats for the User)
exports.getTravelerDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // We use bookingModel here (assuming it exists or will be updated in Phase 3)
        // If your bookingModel isn't updated yet, this might return empty, which is fine.
        const bookings = await bookingModel.getBookingsByUserId(userId);

        const stats = {
            totalTrips: bookings.length,
            upcomingTrips: bookings.filter(b => new Date(b.check_in) > new Date()).length,
            completedTrips: bookings.filter(b => b.status === 'completed').length,
            // Calculate total only for confirmed/paid bookings
            totalSpent: bookings
                .filter(b => b.status === 'confirmed' || b.status === 'completed')
                .reduce((acc, curr) => acc + parseFloat(curr.total_price || 0), 0)
        };

        res.json({ success: true, stats, recentBookings: bookings.slice(0, 5) });

    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// 4. MANAGER UPGRADE (Preserved)
exports.upgradeToManager = async (req, res) => {
    try {
        const userId = req.user.userId;
        await userModel.update(userId, { role: 'hotel_manager' }); // Fixed enum case 'hotel_manager'
        res.status(200).json({ success: true, message: 'Upgraded to Hotel Manager' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. GET CUSTOMERS (For Managers)
exports.getMyCustomers = async (req, res) => {
    try {
        const customers = await userModel.getCustomersByManagerId(req.user.userId);
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. DELETE (Soft Delete)
exports.deleteUser = async (req, res) => {
    try {
        await userModel.softDelete(req.params.id);
        res.json({ success: true, message: "User deactivated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. GET ALL (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// 8. CREATE (Admin)
exports.createUser = async (req, res) => {
    // Re-use auth controller logic or keep separate for Admin only
    // For now, redirecting to standard create logic
    const { username, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await userModel.create({ username, email, password: hashedPassword, role });
        res.status(201).json({ message: 'User created' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};