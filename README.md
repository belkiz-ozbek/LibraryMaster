# 📚 LibraryMaster - Modern Library Management System

A full-stack library management system built with React, TypeScript, Express.js, and PostgreSQL. Features a modern UI with real-time updates, multi-language support, and comprehensive library operations.

![LibraryMaster](https://img.shields.io/badge/LibraryMaster-v1.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Express](https://img.shields.io/badge/Express-4.21.2-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)

## ✨ Features

### 📖 Book Management
- Add, edit, and delete books with detailed information
- ISBN validation and duplicate prevention
- Track available and total copies
- Search and filter books by title, author, genre, or ISBN
- Book categorization and shelf management

### 👥 Member Management
- Complete member registration and profile management
- Membership date tracking
- Admin ratings and notes for members
- Member borrowing history
- Member search and filtering

### 🔄 Borrowing System
- Check-out and check-in books
- Automatic due date calculation
- Extension request functionality
- Overdue book tracking
- Return date management

### 📊 Statistics & Analytics
- Real-time dashboard with key metrics
- Borrowing statistics and trends
- Member activity reports
- Book popularity analytics
- Overdue book reports

### 🌐 Multi-language Support
- Turkish and English language support
- Dynamic language switching
- Localized UI components

### 🔐 Authentication & Security
- Secure login system
- Session management
- Admin role management
- Password encryption with bcrypt

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Dark/light theme support
- Interactive components with Radix UI
- Real-time notifications
- Smooth animations with Framer Motion

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components
- **React Query** - Data fetching and caching
- **React Router** - Navigation
- **Framer Motion** - Animations
- **i18next** - Internationalization

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database (Neon)
- **Passport.js** - Authentication
- **Express Session** - Session management
- **Zod** - Schema validation

### Database
- **PostgreSQL** hosted on Neon
- **Drizzle Kit** - Database migrations
- **Relations** - Proper foreign key relationships

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon recommended)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/LibraryMaster.git
   cd LibraryMaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
   SESSION_SECRET=your-super-secret-session-key
   ```

4. **Database Setup**
   ```bash
   # Push database schema
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
LibraryMaster/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   └── assets/        # Static assets
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── db.ts            # Database configuration
│   └── types.ts         # TypeScript types
├── shared/               # Shared code between frontend and backend
│   └── schema.ts        # Database schema and types
├── migrations/           # Database migrations
└── uploads/             # File uploads directory
```

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Email address
- `password` - Encrypted password
- `isAdmin` - Admin role flag
- `membershipDate` - When user joined
- `adminRating` - Admin-assigned rating
- `adminNotes` - Admin notes

### Books Table
- `id` - Primary key
- `title` - Book title
- `author` - Book author
- `isbn` - Unique ISBN
- `genre` - Book genre
- `publishYear` - Publication year
- `shelfNumber` - Physical location
- `availableCopies` - Available copies
- `totalCopies` - Total copies owned
- `pageCount` - Number of pages
- `createdAt` - When added to system

### Borrowings Table
- `id` - Primary key
- `bookId` - Reference to book
- `userId` - Reference to user
- `borrowDate` - When borrowed
- `dueDate` - When due
- `returnDate` - When returned
- `status` - borrowed/returned/overdue
- `extensionRequested` - Extension flag
- `notes` - Additional notes

## 🚀 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema to database

# Type checking
npm run check        # TypeScript type checking
```

## 🌍 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Secret for session encryption | Yes |

## 🔧 Configuration

### Database Configuration
The application uses Drizzle ORM with PostgreSQL. Database migrations are handled automatically with `drizzle-kit`.

### Authentication
- Session-based authentication
- Password encryption with bcrypt
- Admin role management
- Secure session storage

### Internationalization
- Turkish and English support
- Dynamic language switching
- Localized date and number formatting

## 📱 Features in Detail

### Dashboard
- Real-time statistics
- Recent activities
- Quick actions
- System overview

### Book Management
- CRUD operations for books
- Advanced search and filtering
- Bulk operations
- ISBN validation

### Member Management
- Member registration
- Profile management
- Borrowing history
- Admin notes and ratings

### Borrowing System
- Check-out process
- Due date management
- Extension requests
- Return processing

### Reports & Analytics
- Statistical overview
- Trend analysis
- Export functionality
- Custom date ranges

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Drizzle ORM](https://orm.drizzle.team/) for database management
- [Neon](https://neon.tech/) for PostgreSQL hosting

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: [ceng.belkiz@gmail.com]

---

**LibraryMaster** - Modern library management made simple! 📚✨ 
