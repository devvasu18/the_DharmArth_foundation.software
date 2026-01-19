const mongoose = require('mongoose');
require('dotenv').config();

const Doctor = require('../models/Doctor');
const DoctorAvailability = require('../models/DoctorAvailability');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Dummy doctor data
const doctors = [
    // Government Hospital Doctors
    {
        name: 'Dr. Rajesh Kumar',
        title: 'General Physician',
        experience: '15+ Years Experience',
        expertiseBadge: 'Senior Specialist',
        type: 'government',
        priority: 0,
        photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
        isActive: true,
        isEmergencyAvailable: true
    },
    {
        name: 'Dr. Priya Sharma',
        title: 'Cardiologist',
        experience: '20+ Years Experience',
        expertiseBadge: 'Top Expert',
        type: 'government',
        priority: 0,
        photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
        isActive: true,
        isEmergencyAvailable: false
    },
    {
        name: 'Dr. Amit Patel',
        title: 'Pediatrician',
        experience: '12+ Years Experience',
        expertiseBadge: 'Professional Doctor',
        type: 'government',
        priority: 0,
        photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
        isActive: true,
        isEmergencyAvailable: false
    },
    {
        name: 'Dr. Sunita Verma',
        title: 'Gynecologist',
        experience: '18+ Years Experience',
        expertiseBadge: 'Senior Specialist',
        type: 'government',
        priority: 0,
        photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400',
        isActive: true,
        isEmergencyAvailable: false
    },

    // Private Clinic Doctors
    {
        name: 'Dr. Vikram Singh',
        title: 'Orthopedic Surgeon',
        experience: '22+ Years Experience',
        expertiseBadge: 'Top Expert',
        type: 'clinic',
        priority: 10,
        photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400',
        isActive: true,
        isEmergencyAvailable: true
    },
    {
        name: 'Dr. Neha Gupta',
        title: 'Dermatologist',
        experience: '10+ Years Experience',
        expertiseBadge: 'Professional Doctor',
        type: 'clinic',
        priority: 7,
        photo: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400',
        isActive: true,
        isEmergencyAvailable: false
    },
    {
        name: 'Dr. Arjun Mehta',
        title: 'Neurologist',
        experience: '16+ Years Experience',
        expertiseBadge: 'Senior Specialist',
        type: 'clinic',
        priority: 9,
        photo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400',
        isActive: true,
        isEmergencyAvailable: true
    },
    {
        name: 'Dr. Kavita Reddy',
        title: 'Ophthalmologist',
        experience: '14+ Years Experience',
        expertiseBadge: 'Senior Specialist',
        type: 'clinic',
        priority: 8,
        photo: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400',
        isActive: true,
        isEmergencyAvailable: false
    },
    {
        name: 'Dr. Rahul Joshi',
        title: 'Dentist',
        experience: '8+ Years Experience',
        expertiseBadge: 'Professional Doctor',
        type: 'clinic',
        priority: 5,
        photo: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400',
        isActive: true,
        isEmergencyAvailable: false
    },
    {
        name: 'Dr. Anjali Desai',
        title: 'ENT Specialist',
        experience: '11+ Years Experience',
        expertiseBadge: 'Professional Doctor',
        type: 'clinic',
        priority: 6,
        photo: 'https://images.unsplash.com/photo-1609557927087-f9cf8e88de18?w=400',
        isActive: true,
        isEmergencyAvailable: false
    }
];

// Function to generate availability for next 7 days
const generateAvailability = (doctorId, doctorType) => {
    const availabilities = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayName = dayNames[date.getDay()];

        // Different schedules for government vs clinic
        let timeSlots = [];

        if (doctorType === 'government') {
            // Government hospital - more structured, limited hours
            if (i % 2 === 0) { // Available on alternate days
                timeSlots = [
                    {
                        period: 'Morning',
                        startTime: '09:00',
                        endTime: '12:00',
                        status: 'Available'
                    },
                    {
                        period: 'Afternoon',
                        startTime: '14:00',
                        endTime: '17:00',
                        status: i === 0 ? 'Limited' : 'Available'
                    }
                ];
            } else {
                timeSlots = [
                    {
                        period: 'Morning',
                        startTime: '09:00',
                        endTime: '12:00',
                        status: 'Not Available'
                    }
                ];
            }
        } else {
            // Private clinic - more availability, flexible hours
            if (i < 6) { // Available 6 days a week
                timeSlots = [
                    {
                        period: 'Morning',
                        startTime: '08:00',
                        endTime: '12:00',
                        status: 'Available'
                    },
                    {
                        period: 'Afternoon',
                        startTime: '14:00',
                        endTime: '18:00',
                        status: 'Available'
                    },
                    {
                        period: 'Evening',
                        startTime: '18:00',
                        endTime: '21:00',
                        status: i === 0 ? 'Limited' : 'Available'
                    }
                ];
            } else {
                // Sunday - limited hours
                timeSlots = [
                    {
                        period: 'Morning',
                        startTime: '09:00',
                        endTime: '13:00',
                        status: 'Limited'
                    }
                ];
            }
        }

        availabilities.push({
            doctorId,
            date,
            dayName,
            timeSlots,
            isEnabled: true,
            emergencyAvailable: i === 0 && Math.random() > 0.5, // Random emergency for today
            notes: i === 0 ? 'First day of the week' : ''
        });
    }

    return availabilities;
};

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...\n');

        // Clear existing data
        console.log('🗑️  Clearing existing doctors and availability...');
        await Doctor.deleteMany({});
        await DoctorAvailability.deleteMany({});
        console.log('✅ Cleared existing data\n');

        // Insert doctors
        console.log('👨‍⚕️  Creating doctors...');
        const createdDoctors = await Doctor.insertMany(doctors);
        console.log(`✅ Created ${createdDoctors.length} doctors\n`);

        // Generate and insert availability
        console.log('📅 Generating availability schedules...');
        let totalAvailability = 0;

        for (const doctor of createdDoctors) {
            const availabilities = generateAvailability(doctor._id, doctor.type);
            await DoctorAvailability.insertMany(availabilities);
            totalAvailability += availabilities.length;
            console.log(`   ✓ Created schedule for ${doctor.name} (${availabilities.length} days)`);
        }

        console.log(`\n✅ Created ${totalAvailability} availability records\n`);

        // Summary
        console.log('📊 SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`👨‍⚕️  Total Doctors: ${createdDoctors.length}`);
        console.log(`🏥 Government Doctors: ${createdDoctors.filter(d => d.type === 'government').length}`);
        console.log(`🏨 Clinic Doctors: ${createdDoctors.filter(d => d.type === 'clinic').length}`);
        console.log(`🚨 Emergency Available: ${createdDoctors.filter(d => d.isEmergencyAvailable).length}`);
        console.log(`📅 Total Availability Records: ${totalAvailability}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('🎉 Database seeding completed successfully!\n');
        console.log('🌐 You can now visit:');
        console.log('   📍 Public Page: http://localhost:5173/doctors');
        console.log('   📍 Admin Doctors: http://localhost:5173/admin/doctors');
        console.log('   📍 Admin Availability: http://localhost:5173/admin/availability\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
};

// Run the seed function
connectDB().then(() => {
    seedDatabase();
});
