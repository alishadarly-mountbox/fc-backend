const School = require('../models/School');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (move these to your .env in production)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Add new school
exports.addSchool = async (req, res) => {
  try {
    const { name, address, principal, contactNumber } = req.body;
    let groupPhotoUrl = null;

    // If a file is uploaded, send to Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'school_photos',
        resource_type: 'image'
      });
      groupPhotoUrl = result.secure_url;
    }

    const school = new School({
      name,
      address,
      principal,
      contactNumber,
      groupPhoto: groupPhotoUrl // store public URL
    });

    await school.save();
    res.status(201).json({ message: 'School added successfully', school });
  } catch (error) {
    console.error('Error adding school:', error);
    res.status(500).json({ error: 'Failed to add school' });
  }
};

// Get all schools
exports.getSchools = async (req, res) => {
  try {
    const schools = await School.find();
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
};

// Update school
exports.updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, principal, contactNumber } = req.body;
    let groupPhotoUrl;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'school_photos',
        resource_type: 'image'
      });
      groupPhotoUrl = result.secure_url;
    }

    const updatedData = {
      name,
      address,
      principal,
      contactNumber
    };

    if (groupPhotoUrl) {
      updatedData.groupPhoto = groupPhotoUrl;
    }

    const updatedSchool = await School.findByIdAndUpdate(id, updatedData, { new: true });
    res.json({ message: 'School updated successfully', updatedSchool });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ error: 'Failed to update school' });
  }
};

// Delete school
exports.deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    await School.findByIdAndDelete(id);
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ error: 'Failed to delete school' });
  }
};
