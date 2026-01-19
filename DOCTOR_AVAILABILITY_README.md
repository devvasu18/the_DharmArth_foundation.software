# Doctor Availability System

A comprehensive doctor availability management system designed for The Dharmarth Foundation, featuring admin controls and a user-friendly public interface.

## Features

### 🏥 Admin Panel Features

#### Doctor Management (`/admin/doctors`)
- Create, edit, and delete doctors
- Set doctor type (Government Hospital / Private Clinic)
- Assign expertise badges (Top Expert, Senior Specialist, Professional Doctor)
- Set priority levels for clinic doctors
- Toggle emergency availability
- Upload doctor photos
- Activate/deactivate doctors

#### Availability Management (`/admin/availability`)
- Weekly calendar view for next 7 days
- Select doctor and manage their schedule
- Add multiple time slots per day (Morning/Afternoon/Evening)
- Set availability status (Available/Limited/Not Available)
- Quick set week schedule feature
- Enable/disable specific dates
- Mark emergency availability per day
- Add notes for special instructions

### 👥 Public User Features (`/doctors`)

#### Two View Modes:
1. **Weekly Calendar View**
   - See next 7 days at a glance
   - Doctor count per day
   - Click any date to see available doctors

2. **Category View**
   - Direct access to Government Hospital or Private Clinic doctors
   - Filter by date and type
   - See available doctors for today

#### Emergency Doctors Section
- Prominently displays doctors available right now
- Real-time emergency availability
- Eye-catching design for urgent needs

#### Doctor Cards
- Large, readable text for elderly users
- Clear time slot information
- Visual status indicators (Available/Limited/Not Available)
- Experience and expertise badges
- Priority indicators for clinic doctors
- Book appointment button

## Design Philosophy

### 🎨 User-Friendly Design
- **Calm Medical Theme**: Trustworthy colors (teal/green)
- **Large Text**: Easy to read for elderly users
- **Simple Language**: "Available Now", "Book for Tomorrow"
- **Clear Icons**: Visual indicators for better understanding
- **No Technical Jargon**: Plain, simple words

### 🌈 Theme Colors
- Primary: `#00bfa5` (Teal)
- Primary Hover: `#009e89`
- Secondary: `#005f56`
- Accent: `#ff6d00` (Orange)
- Success: `#28a745` (Green)
- Danger: `#d9534f` (Red)

## API Endpoints

### Doctors
- `GET /api/doctors` - Get all doctors (with optional filters)
- `GET /api/doctors/:id` - Get single doctor
- `POST /api/doctors` - Create doctor (Admin)
- `PUT /api/doctors/:id` - Update doctor (Admin)
- `DELETE /api/doctors/:id` - Delete doctor (Admin)
- `PATCH /api/doctors/:id/emergency` - Toggle emergency availability (Admin)
- `GET /api/doctors/emergency` - Get emergency available doctors

### Availability
- `GET /api/availability/week` - Get next 7 days availability
- `GET /api/availability/date/:date` - Get availability for specific date
- `GET /api/availability` - Get availability with filters
- `POST /api/availability` - Create/update availability (Admin)
- `POST /api/availability/bulk` - Bulk create availability (Admin)
- `DELETE /api/availability/:id` - Delete availability (Admin)

## Database Models

### Doctor Model
```javascript
{
  name: String,
  title: String,
  experience: String,
  expertiseBadge: String (enum),
  type: String (government/clinic),
  priority: Number,
  photo: String,
  isActive: Boolean,
  isEmergencyAvailable: Boolean
}
```

### DoctorAvailability Model
```javascript
{
  doctorId: ObjectId (ref: Doctor),
  date: Date,
  dayName: String,
  timeSlots: [{
    period: String (Morning/Afternoon/Evening),
    startTime: String,
    endTime: String,
    status: String (Available/Limited/Not Available)
  }],
  isEnabled: Boolean,
  emergencyAvailable: Boolean,
  notes: String
}
```

## Usage Guide

### For Admins

1. **Add Doctors**
   - Go to `/admin/doctors`
   - Click "Add New Doctor"
   - Fill in doctor details
   - Set type (Government/Clinic)
   - Upload photo (optional)
   - Save

2. **Set Availability**
   - Go to `/admin/availability`
   - Select a doctor from dropdown
   - Click on any date in the calendar
   - Add time slots (Morning/Afternoon/Evening)
   - Set status for each slot
   - Enable emergency if needed
   - Save schedule

3. **Quick Week Setup**
   - Select a doctor
   - Click "Quick Set Week"
   - Default schedule applied to all 7 days
   - Customize individual days as needed

### For Users

1. **View Weekly Calendar**
   - Visit `/doctors`
   - See next 7 days
   - Click any date to see doctors

2. **Choose Hospital Type**
   - After selecting date
   - Choose Government Hospital or Private Clinic
   - View available doctors

3. **Direct Category Access**
   - Click "Find by Category"
   - Choose hospital type
   - See today's available doctors

4. **Emergency Doctors**
   - Automatically shown at top if available
   - Real-time emergency availability

## Responsive Design

- **Desktop**: Full grid layout with all features
- **Tablet**: Adjusted grid columns
- **Mobile**: Single column, stacked layout
- **Touch-Friendly**: Large buttons and cards

## Accessibility

- High contrast colors
- Large, readable fonts
- Clear visual hierarchy
- Simple navigation
- No complex interactions
- Keyboard accessible

## Future Enhancements

- [ ] Online appointment booking
- [ ] SMS/Email notifications
- [ ] Doctor profiles with detailed information
- [ ] Patient reviews and ratings
- [ ] Multi-language support (Hindi/English)
- [ ] Integration with hospital management system
- [ ] Video consultation scheduling
- [ ] Prescription management

## Technical Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Styling**: Custom CSS with CSS Variables
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Installation

1. Backend setup is already integrated
2. Frontend components are ready
3. Routes are configured
4. Start both servers:
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm run dev
   ```

## Notes

- All doctor management is admin-controlled
- No separate doctor accounts needed
- Simple and intuitive for non-technical users
- Designed for elderly and first-time users
- Focus on clarity and ease of use
