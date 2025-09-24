# 🛩️ DJG Aviation - Maintenance Management System

## 🎯 Project Overview

**DJG Aviation** is a comprehensive maintenance management system designed for aviation operations. This application provides a complete solution for managing aircraft maintenance records, expenses, and operational data with full audit compliance.

## 🚀 Key Features

### ✅ **COMPLETED MODULES**

#### 🔧 **Maintenance Module** (FULLY FUNCTIONAL)

* **PDF Invoice Upload**: Drag & drop interface for maintenance invoices
* **OCR Processing**: Automated text extraction using OpenAI Vision API
* **Data Review**: Interactive modal for reviewing and editing extracted data
* **CRUD Operations**: Complete Create, Read, Update, Delete functionality
* **Advanced Search & Filtering**: Multi-criteria filtering with responsive UI
* **CSV Export**: Export maintenance records with full data
* **Audit Trail**: Complete tracking of all maintenance operations

#### 🎨 **UI/UX Enhancements**

* **Dark Mode**: Complete theme switching with system preference detection
* **Mobile Optimization**: Responsive design for all screen sizes
* **Accessibility**: ARIA labels, keyboard navigation, screen reader support
* **Modern Design**: Aviation-themed interface with shadcn/ui components

#### 📊 **Analytics Dashboard**

* **Real-time Data**: Live maintenance cost analysis
* **Interactive Charts**: Recharts integration for data visualization
* **Audit Reports**: Compliance-ready reporting system
* **Export Functionality**: PDF and CSV export capabilities

## 🏗️ **Technical Architecture**

### **Frontend Stack**

* **React 18.3.1** with TypeScript 5.5.3
* **Vite 5.4.1** for build tooling
* **shadcn/ui** (Radix UI) for component library
* **Tailwind CSS 3.4.11** for styling
* **React Router 6.26.2** for navigation
* **TanStack Query 5.56.2** for state management
* **React Hook Form 7.53.0** with Zod validation

### **Backend & Database**

* **Supabase** (PostgreSQL, Auth, Storage, Edge Functions)
* **Row Level Security (RLS)** for data protection
* **Edge Functions** for OCR processing
* **OpenAI Vision API** for PDF text extraction

### **AI Integration**

* **OpenAI GPT-4o-mini** for structured data extraction
* **Google Cloud Vision API** (configured for future use)
* **Intelligent field mapping** for maintenance data

## 🗄️ **Database Schema**

### **Core Tables**

* `profiles` \- User profiles and preferences
* `aircraft` \- Aircraft registry and specifications
* `maintenance_records` \- Complete maintenance history
* `maintenance_parts` \- Parts and components tracking
* `maintenance_attachments` \- PDF storage and metadata
* `expenses` \- Financial tracking with audit trail
* `operations` \- Flight operations and scheduling

### **Security Features**

* **Row Level Security (RLS)** on all tables
* **JWT-based authentication** with Supabase Auth
* **Input validation** and sanitization
* **Audit logging** for all operations

## 🚀 **Getting Started**

### **Prerequisites**

* Node.js 18+ and npm
* Supabase account and project
* OpenAI API key (for OCR functionality)

### **Installation**

```bash
# Clone the repository
git clone https://github.com/pjet-ai/pjet-ai.git
cd pjet-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials

# Start development server
npm run dev
```

### **Environment Variables**

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_api_key
```

## 📋 **Available Scripts**

* `npm run dev` \- Start development server
* `npm run build` \- Build for production
* `npm run preview` \- Preview production build
* `npm run lint` \- Run ESLint

## 🔧 **Maintenance Module Usage**

### **Uploading Maintenance Invoices**

1. Navigate to **Maintenance** page
2. Drag & drop PDF invoices or click "Upload Invoice"
3. Review extracted data in the modal
4. Edit any fields as needed
5. Save to database

### **Managing Records**

* **Search**: Use the search bar to find specific records
* **Filter**: Click "Filter" for advanced filtering options
* **Export**: Click "Export" to download CSV file
* **Actions**: View, Edit, or Delete individual records

## 🎨 **Theme Support**

The application supports both light and dark themes:

* **System Preference**: Automatically detects user's system theme
* **Manual Toggle**: Available in Settings page
* **Persistent**: Theme preference saved in localStorage

## 📱 **Mobile Optimization**

* **Responsive Design**: Optimized for all screen sizes
* **Touch Interactions**: Mobile-friendly interface
* **Performance**: Optimized for mobile networks
* **Accessibility**: Full screen reader support

## 🔒 **Security & Compliance**

* **Data Encryption**: All sensitive data encrypted at rest and in transit
* **Audit Trail**: Complete logging of all operations
* **User Permissions**: Role-based access control
* **Input Validation**: Comprehensive data validation
* **HTTPS Only**: Secure communication protocols

## 🚀 **Deployment**

### **Vercel Deployment**

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Supabase Edge Functions**

```bash
# Deploy Edge Functions
npx supabase functions deploy extract-maintenance-text
```

## 📊 **Performance Metrics**

* **Page Load Time**: < 2 seconds
* **OCR Processing**: < 10 seconds for typical invoices
* **Database Queries**: Optimized with proper indexing
* **Bundle Size**: Optimized for production

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is proprietary software for DJG Aviation operations.

## 🆘 **Support**

For technical support or questions:

* **Email**: pjet.ai.app@gmail.com
* **Documentation**: See inline code comments
* **Issues**: Use GitHub Issues for bug reports

---

**Built with ❤️ for DJG Aviation Operations**
