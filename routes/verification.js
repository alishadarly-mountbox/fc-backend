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

    // For demo purposes, simulate verification (always succeeds)
    // In production, this would use actual face recognition
    const match = true;

    await Student.findByIdAndUpdate(studentId, {
      verified: match,
      verificationResult: match ? 'success' : 'failed'
    });

    res.json({
      result: match ? 'success' : 'failed',
      message: match ? 'Verification successful (demo mode).' : 'Verification failed (demo mode).'
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;