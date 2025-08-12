const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const auth = require('../middleware/auth');

// All routes with their handlers
router.get('/', schoolController.getAllSchools);
router.post('/', auth, schoolController.createSchool);
router.get('/:id', schoolController.getSchool);
router.put('/:id', auth, schoolController.updateSchool);
router.delete('/:id', auth, schoolController.deleteSchool);

module.exports = router;