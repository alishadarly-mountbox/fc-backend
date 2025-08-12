const express = require('express');
const router = express.Router();
const multer = require('multer');
const schoolController = require('../controllers/schoolController');
const auth = require('../middleware/auth');

// Configure multer for file upload
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Add the upload route
router.post('/upload', auth, upload.single('image'), schoolController.uploadImage);

// Existing routes
router.get('/', schoolController.getAllSchools);
router.post('/', auth, schoolController.createSchool);
router.get('/:id', schoolController.getSchool);
router.put('/:id', auth, schoolController.updateSchool);
router.delete('/:id', auth, schoolController.deleteSchool);

module.exports = router;