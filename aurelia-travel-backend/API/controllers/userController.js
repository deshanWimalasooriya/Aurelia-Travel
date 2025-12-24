const userModel = require('../Models/userModel');
const bcrypt = require('bcrypt');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message})
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await userModel.getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found'});
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message})
    }
};

exports.createUser = async (req, res) => {
    try {
        const {username, email, password, role} =  req.body;
        const existingUser = await userModel.getUserByEmail(email);
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await userModel.createUser({ username, email, password: hashedPassword, role });
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            username, 
            email, 
            password, 
            role, 
            address_line_1, 
            address_line_2, 
            address_line_3, 
            city, 
            postal_code, 
            country,
            profile_image,
            card_type,
            card_number,
            expiry_date,
            cvv
        } = req.body;

        const currentUserId = req.user.userId;
        const currentUserRole = req.user.role;

        // Verify user exists
        const existingUser = await userModel.getUserById(id);
        if (!existingUser) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Check if user is trying to update their own data or is admin
        if (parseInt(id) !== currentUserId && currentUserRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access forbidden. You can only update your own data.'
            });
        }

        // Prepare update data
        const updateData = {};

        if (username) updateData.username = username;

        if (email && email !== existingUser.email) {
            const emailExists = await userModel.getUserByEmail(email);
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
            updateData.email = email;
        }

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (role) {
            if (currentUserRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only admins can change user roles'
                });
            }
            updateData.role = role;
        }

        // Address fields update
        if (address_line_1) updateData.address_line_1 = address_line_1;
        if (address_line_2) updateData.address_line_2 = address_line_2;
        if (address_line_3) updateData.address_line_3 = address_line_3;
        if (city) updateData.city = city;
        if (postal_code) updateData.postal_code = postal_code;
        if (country) updateData.country = country;

        // Payment info update
        if (card_type) updateData.card_type = card_type;
        if (card_number) updateData.card_number = card_number;
        if (expiry_date) updateData.expiry_date = expiry_date;
        if (cvv) updateData.cvv = await bcrypt.hash(cvv, 10);

        if (profile_image) updateData.profile_image = profile_image;

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        // Perform update
        const updatedUser = await userModel.updateUser(id, updateData);

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });

    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.getUserById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const deleted = await userModel.deleteUser(id);
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        // ✅ Get userId from JWT token (set by verifyToken middleware)
        const userId = req.user.userId;
        
        // Find user by ID
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error('Error fetching current user:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
