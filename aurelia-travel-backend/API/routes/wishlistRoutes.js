const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);
router.delete('/:hotelId', wishlistController.removeItem);
router.delete('/', wishlistController.clearAll);

module.exports = router;