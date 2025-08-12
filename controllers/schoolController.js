const School = require('../models/School');
const cloudinary = require('cloudinary').v2;
const xlsx = require('xlsx');
const fs = require('fs');

const schoolController = {
    getAllSchools: async (req, res) => {
        try {
            const schools = await School.find();
            res.status(200).json(schools);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching schools', error: error.message });
        }
    },

    createSchool: async (req, res) => {
        try {
            if (!req.files || !req.files.file) {
                return res.status(400).json({ message: 'Excel file is required' });
            }

            let imageUrl = null;
            if (req.files.image) {
                const imageResult = await cloudinary.uploader.upload(req.files.image[0].path, {
                    folder: 'schools',
                    resource_type: 'image'
                });
                imageUrl = imageResult.secure_url;
                // Clean up uploaded file
                fs.unlinkSync(req.files.image[0].path);
            }

            // Process Excel file
            const workbook = xlsx.readFile(req.files.file[0].path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            // Clean up Excel file
            fs.unlinkSync(req.files.file[0].path);

            const school = new School({
                name: data[0]?.schoolName || 'Unknown School',
                students: data.map(row => ({
                    name: row.studentName,
                    class: row.class,
                    // Add other student fields as needed
                })),
                groupPhoto: imageUrl
            });

            await school.save();
            res.status(201).json({ school });
        } catch (error) {
            console.error('School creation error:', error);
            res.status(500).json({ 
                message: 'Error creating school', 
                error: error.message 
            });
        }
    },

    getSchool: async (req, res) => {
        try {
            const school = await School.findById(req.params.id);
            if (!school) {
                return res.status(404).json({ message: 'School not found' });
            }
            res.status(200).json(school);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching school', error: error.message });
        }
    },

    updateSchool: async (req, res) => {
        try {
            const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!school) {
                return res.status(404).json({ message: 'School not found' });
            }
            res.status(200).json(school);
        } catch (error) {
            res.status(500).json({ message: 'Error updating school', error: error.message });
        }
    },

    deleteSchool: async (req, res) => {
        try {
            const school = await School.findByIdAndDelete(req.params.id);
            if (!school) {
                return res.status(404).json({ message: 'School not found' });
            }
            res.status(200).json({ message: 'School deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting school', error: error.message });
        }
    },

    uploadImage: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'schools',
                resource_type: 'auto'
            });

            res.status(200).json({
                url: result.secure_url,
                public_id: result.public_id
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ message: 'Error uploading file', error: error.message });
        }
    }
};

module.exports = schoolController;
