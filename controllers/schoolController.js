// Simplified school controller without face recognition

const School = require('../models/School');
const Student = require('../models/Student');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Simplified function that doesn't require face recognition
async function extractGroupDescriptors(imagePath) {
  try {
    console.log('Processing group photo (demo mode - no face recognition)');
    // Return empty array for demo purposes
    // In production, this would extract actual face descriptors
    return [];
  } catch (error) {
    console.error('Error in extractGroupDescriptors:', error);
    throw error;
  }
}

// Normalize object keys: lowercase, remove spaces, underscores, dots and non-alphanumerics
function normalizeRowKeys(row) {
  const normalized = {};
  Object.keys(row || {}).forEach((key) => {
    const normKey = String(key)
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[._-]+/g, '')
      .replace(/[^a-z0-9]/g, '');
    normalized[normKey] = row[key];
  });
  return normalized;
}

// Get first non-empty value for a set of possible normalized header names
function getCellNormalized(rowNorm, possibleNormKeys) {
  for (const key of possibleNormKeys) {
    const value = rowNorm[key];
    if (value !== undefined && value !== null && String(value).toString().trim() !== '') {
      return value;
    }
  }
  return '';
}

exports.addSchool = async (req, res) => {
  try {
    const xlsFile = req.files.xlsFile ? req.files.xlsFile[0] : null;
    const groupPhoto = req.files.groupPhoto ? req.files.groupPhoto[0] : null;

    if (!xlsFile) return res.status(400).json({ message: 'XLS file is required' });

    // Parse XLS
    const workbook = XLSX.readFile(xlsFile.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'XLS file appears to be empty' });
    }

    // School-level fields from the first row
    const normalizedData = data.map(normalizeRowKeys);
    const firstRow = normalizedData[0] || {};
    const schoolName = getCellNormalized(firstRow, ['school', 'schoolname']) || 'Unnamed School';
    const affNo = getCellNormalized(firstRow, ['affno', 'affiliationno']);

    // Prepare school data
    const schoolData = {
      name: schoolName,
      affNo: affNo || undefined,
      students: []
    };

    // Save group photo path if provided
    if (groupPhoto) {
      // Normalize path for static serving: ensure it is relative to uploads/ and uses forward slashes
      const relativePath = groupPhoto.path
        .replace(/^[.\\/]+/, '')
        .replace(/\\/g, '/');
      schoolData.groupPhoto = relativePath;
    }

    // Create school
    const school = new School(schoolData);
    await school.save();

    // Extract and save group descriptors if group photo exists
    if (groupPhoto) {
      try {
        console.log('Extracting face descriptors from group photo...');
        const descriptors = await extractGroupDescriptors(groupPhoto.path);
        school.groupDescriptors = descriptors;
        await school.save();
        console.log(`Successfully saved ${descriptors.length} face descriptors for school: ${school.name}`);
      } catch (err) {
        console.error('Error extracting group descriptors:', err);
      }
    }

    // Add students with robust header mapping
    const studentsPayload = normalizedData
      .map((row) => {
        const name = getCellNormalized(row, ['name', 'studentname', 'student_fullname', 'fullname']);
        const rollNumber = getCellNormalized(row, ['rollnumber', 'rollno', 'roll', 'rollnumberno']);
        const registrationNo = getCellNormalized(row, [
          'registrationno',
          'regno',
          'regnumber',
          'registerno',
          'admissionno',
          'admissionnumber'
        ]);
        const klass = getCellNormalized(row, ['class', 'std', 'standard', 'grade']);
        const dob = getCellNormalized(row, ['dob', 'dateofbirth', 'dateofbirthdob']);
        const ageGroup = getCellNormalized(row, ['agegroup', 'age', 'agegrou']);

        const hasAny = [name, rollNumber, registrationNo, klass, dob, ageGroup]
          .some((v) => String(v).trim() !== '');

        if (!hasAny) return null;

        return {
          name: name || undefined,
          rollNumber: String(rollNumber || '').toString(),
          registrationNo: String(registrationNo || '').toString(),
          class: String(klass || '').toString(),
          dob: String(dob || '').toString(),
          ageGroup: String(ageGroup || '').toString(),
          school: school._id
        };
      })
      .filter(Boolean);

    const students = studentsPayload.length > 0
      ? await Student.insertMany(studentsPayload)
      : [];

    // Link students to school
    school.students = students.map(s => s._id);
    await school.save();

    // Clean up XLS file
    if (xlsFile && fs.existsSync(xlsFile.path)) {
      fs.unlinkSync(xlsFile.path);
    }

    res.json({
      message: 'School and students added successfully',
      school: {
        _id: school._id,
        name: school.name,
        affNo: school.affNo,
        groupPhoto: school.groupPhoto,
        studentsCount: students.length
      }
    });

  } catch (err) {
    console.error('Error in addSchool:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getSchools = async (req, res) => {
  try {
    const schools = await School.find().select('name affNo _id groupPhoto');
    res.json(schools);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentsBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const students = await Student.find({ school: schoolId });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSchoolById = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json({
      _id: school._id,
      name: school.name,
      affNo: school.affNo,
      groupPhoto: school.groupPhoto
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    // Get school info for cleanup
    const school = await School.findById(schoolId);
    if (school && school.groupPhoto) {
      try {
        if (fs.existsSync(school.groupPhoto)) {
          fs.unlinkSync(school.groupPhoto);
        }
      } catch (fileError) {
        console.log('Error deleting group photo file:', fileError);
      }
    }
    // Delete all students associated with this school
    await Student.deleteMany({ school: schoolId });
    // Delete the school
    await School.findByIdAndDelete(schoolId);
    res.json({ message: 'School and all students deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Regenerate group descriptors for a school
exports.regenerateGroupDescriptors = async (req, res) => {
  try {
    const { schoolId } = req.params;
    console.log('Regenerating group descriptors for school:', schoolId);
    
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    if (!school.groupPhoto) {
      return res.status(400).json({ message: 'No group photo found for this school. Please upload a group photo first.' });
    }
    
    // Check if group photo file exists
    if (!fs.existsSync(school.groupPhoto)) {
      return res.status(400).json({ 
        message: 'Group photo file not found on server. The file may have been deleted or moved. Please upload a new group photo.' 
      });
    }
    
    console.log('Group photo file exists at:', school.groupPhoto);
    console.log('File size:', fs.statSync(school.groupPhoto).size, 'bytes');
    
    try {
      console.log('Starting face descriptor extraction...');
      const descriptors = await extractGroupDescriptors(school.groupPhoto);
      
      if (!descriptors || descriptors.length === 0) {
        return res.status(400).json({ 
          message: 'No face descriptors could be extracted from the group photo',
          suggestion: 'Please ensure the group photo contains clear, visible faces with good lighting and try again.'
        });
      }
      
      school.groupDescriptors = descriptors;
      await school.save();
      
      console.log(`Successfully regenerated ${descriptors.length} face descriptors for school: ${school.name}`);
      
      res.json({
        message: `Successfully regenerated ${descriptors.length} face descriptors`,
        descriptorsCount: descriptors.length,
        school: {
          _id: school._id,
          name: school.name,
          groupPhoto: school.groupPhoto
        }
      });
    } catch (err) {
      console.error('Error regenerating group descriptors:', err);
      res.status(400).json({ 
        message: 'Failed to extract face descriptors from group photo',
        error: err.message,
        suggestion: 'Please ensure the group photo contains clear, visible faces with good lighting and minimal obstructions. Try uploading a different photo if the issue persists.'
      });
    }
  } catch (err) {
    console.error('Error in regenerateGroupDescriptors:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.downloadVerifiedProfiles = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const school = await School.findById(schoolId);
    const students = await Student.find({ school: schoolId });

    const excelData = students.map(student => ({
      'Name': student.name,
      'Roll Number': student.rollNumber,
      'Verification Status': student.verificationResult === 'success' ? 'Verified' :
        student.verificationResult === 'failed' ? 'Failed' : 'Pending',
      'School': school?.name || 'Unknown'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verified Profiles');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${school?.name || 'school'}_verified_profiles.xlsx"`);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};