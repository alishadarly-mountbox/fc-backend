// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/auth');
// const Student = require('../models/Student');

// // Mark verification result
// router.post('/:studentId', auth, async (req, res) => {
//     const { result } = req.body; // 'success' or 'failed'
//     const student = await Student.findByIdAndUpdate(
//         req.params.studentId,
//         { verified: result === 'success', verificationResult: result },
//         { new: true }
//     );
//     res.json(student);
// });

// module.exports = router;

// Simplified verification route without face recognition
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Student = require('../models/Student');
const School = require('../models/School');
const path = require('path');
const fs = require('fs');

router.post('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { capturedImage, schoolId } = req.body;

    const student = await Student.findById(studentId);
    const school = await School.findById(schoolId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Store the captured image
    let capturedImagePath = null;
    if (capturedImage) {
      try {
        // Create verification images directory if it doesn't exist
        const verificationDir = path.join(__dirname, '../uploads/verification');
        if (!fs.existsSync(verificationDir)) {
          fs.mkdirSync(verificationDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `verification_${studentId}_${timestamp}.jpg`;
        const filepath = path.join(verificationDir, filename);

        // Convert base64 to buffer and save
        const base64Data = capturedImage.replace(/^data:image\/jpeg;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filepath, buffer);

        // Store relative path for database
        capturedImagePath = `verification/${filename}`;
        
        console.log(`Captured image saved: ${capturedImagePath}`);
      } catch (imageError) {
        console.error('Error saving captured image:', imageError);
        // Continue with verification even if image save fails
      }
    }

    // For demo purposes, simulate verification (always succeeds)
    // In production, this would use actual face recognition
    const match = true;

    // Update student with verification result and captured image path
    await Student.findByIdAndUpdate(studentId, {
      verified: match,
      verificationResult: match ? 'success' : 'failed',
      capturedImage: capturedImagePath,
      verificationDate: new Date()
    });

    res.json({
      result: match ? 'success' : 'failed',
      message: match ? 'Verification successful (demo mode).' : 'Verification failed (demo mode).',
      capturedImage: capturedImagePath
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;