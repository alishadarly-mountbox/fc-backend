const express = require('express');
const router = express.Router();
const multer = require('multer');
const schoolController = require('../controllers/schoolController');
const auth = require('../middleware/auth');

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Route handlers
router.get('/', schoolController.getAllSchools);
router.post('/', auth, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), schoolController.createSchool);
router.get('/:id', schoolController.getSchool);
router.put('/:id', auth, schoolController.updateSchool);
router.delete('/:id', auth, schoolController.deleteSchool);

module.exports = router;