# Utsarg - Connecting Hearts, Creating Impact

A comprehensive web platform that connects NGOs, donors, and volunteers to create meaningful social impact through transparency and collaboration.

## 🌟 Features

### For NGOs
- **Registration & Verification**: Complete NGO registration with DARPAN ID validation, dynamic state/district selection via API
- **Smart City Selection**: Automatic normalization of city names (removes diacritical marks like "Bhānder" → "Bhander")
- **Campaign Management**: Create and manage multiple types of campaigns (money, clothes, food, blood, volunteer)
- **Real-time Tracking**: Monitor donations and volunteer activities in real-time
- **Impact Reports**: Generate detailed reports showing campaign progress and impact
- **Volunteer Management**: Coordinate with volunteers for various activities
- **Flexible Registration**: Optional description field during registration for easier onboarding

### For Donors
- **Multiple Donation Types**: Support causes through money, clothes, food, or blood donations
- **Secure Payments**: Integrated Razorpay for secure financial transactions
- **Transparency**: Track how donations are being utilized with real-time updates
- **Impact Visualization**: See the direct impact of contributions through detailed reports

### For Volunteers
- **Opportunity Discovery**: Find volunteer opportunities based on location and interests
- **Skill Matching**: Get matched with campaigns that need your specific skills
- **Activity Tracking**: Log volunteer hours and track contributions
- **Community Building**: Connect with like-minded volunteers

### For Super Admins
- **NGO Verification**: Approve and verify NGO registrations
- **Platform Oversight**: Monitor all activities and ensure platform integrity
- **User Management**: Manage all user types and their permissions
- **Analytics Dashboard**: Comprehensive platform analytics and reporting

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT-based authentication with OTP verification
- **Payments**: Razorpay integration
- **Email**: Nodemailer for notifications and OTP
- **UI Components**: Custom component library with Lucide React icons

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Razorpay account (for payments)
- Email service (Gmail recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ngo-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.local.example` to `.env.local` and fill in your credentials:
   
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # JWT Secret for Custom Auth
   JWT_SECRET=your_jwt_secret_here_make_it_very_long_and_secure

   # Email Configuration (for OTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Razorpay Configuration
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # App Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

4. **Set up Supabase Database**
   
   Run the SQL schema from `src/lib/database-schema.sql` in your Supabase SQL editor:
   
   ```bash
   # Copy the contents of src/lib/database-schema.sql
   # Paste and run in Supabase SQL Editor
   ```

5. **Configure Email Service**
   
   For Gmail:
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password in EMAIL_PASS

6. **Set up Razorpay**
   
   - Create a Razorpay account
   - Get your Key ID and Key Secret from the dashboard
   - Add them to your environment variables

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The platform uses the following main tables:

- **users**: Core user authentication and basic info
- **ngo_profiles**: NGO-specific information and verification status
- **donor_profiles**: Donor preferences and donation history
- **volunteer_profiles**: Volunteer skills and availability
- **campaigns**: Campaign details and progress tracking
- **donations**: Donation records and payment information
- **volunteer_registrations**: Volunteer participation in campaigns
- **campaign_updates**: Progress updates from NGOs
- **notifications**: User notifications system

## 🔐 Authentication Flow

1. **Registration**: Users register with email and user type (NGO/Donor/Volunteer)
2. **OTP Verification**: Email OTP sent for verification
3. **Profile Creation**: Type-specific profile information collected
4. **NGO Verification**: NGOs undergo admin verification process
5. **JWT Tokens**: Secure JWT tokens for session management

## 💳 Payment Integration

- **Razorpay Integration**: Secure payment processing for donations
- **Multiple Payment Methods**: Support for cards, UPI, net banking, wallets
- **Transaction Tracking**: Complete audit trail of all transactions
- **Refund Management**: Automated refund processing when needed

## 📧 Email System

- **OTP Verification**: Secure email verification during registration
- **Welcome Emails**: Personalized welcome messages
- **Notifications**: Campaign updates, donation confirmations
- **Reports**: Periodic impact reports to stakeholders

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Color Palette**: Professional blue and green theme
- **Accessibility**: WCAG compliant components
- **Loading States**: Smooth loading animations and states
- **Error Handling**: User-friendly error messages and recovery

## 🔧 Development

### Project Structure

```
ngo-platform/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── ngo/               # NGO dashboard pages
│   │   ├── donor/             # Donor dashboard pages
│   │   ├── volunteer/         # Volunteer dashboard pages
│   │   └── ...                # Other pages
│   ├── components/            # Reusable components
│   │   ├── ui/               # Basic UI components
│   │   ├── layout/           # Layout components
│   │   └── dashboard/        # Dashboard components
│   └── lib/                  # Utility functions
│       ├── supabase.js       # Database client
│       ├── auth.js           # Authentication utilities
│       └── email.js          # Email utilities
├── public/                   # Static assets
└── ...
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The application can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@ngoplatform.com
- Documentation: [Link to docs]

## 🙏 Acknowledgments

- Supabase for the excellent database platform
- Razorpay for secure payment processing
- Tailwind CSS for the beautiful styling system
- Lucide React for the icon library
- Next.js team for the amazing framework

---

**Made with ❤️ for social impact**