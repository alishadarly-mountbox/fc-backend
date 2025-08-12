const School = require('../models/School');

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
            const school = new School(req.body);
            await school.save();
            res.status(201).json(school);
        } catch (error) {
            res.status(500).json({ message: 'Error creating school', error: error.message });
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
    }
};

module.exports = schoolController;
