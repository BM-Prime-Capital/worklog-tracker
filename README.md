# Developer Worklog Dashboard

A modern, responsive dashboard for tracking developer productivity and work hours from Jira tasks. Built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### 📊 Dashboard Overview
- **Real-time Statistics**: Total hours, active developers, completed tasks, and productivity scores
- **Interactive Charts**: Weekly hours overview with team breakdown
- **Team Distribution**: Visual representation of team allocation and productivity status
- **Developer Performance**: Detailed table with individual developer metrics

### 🔐 Jira Integration
- **Secure Authentication**: Jira API token-based authentication
- **Real-time Data**: Fetch worklogs directly from Jira
- **Date Range Filtering**: Filter data by today, yesterday, this week, last week, etc.
- **Team Filtering**: Filter developers by team (Frontend, Backend, Mobile, QA)
- **Server-side API**: Secure API routes to avoid CORS issues

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Clean Interface**: Modern card-based layout with smooth hover effects
- **Interactive Elements**: Search, filtering, and date range selection
- **Visual Indicators**: Color-coded status indicators and trend arrows

### 📈 Data Visualization
- **Line Charts**: Weekly hours tracking with team breakdown
- **Pie Charts**: Team distribution and productivity status
- **Progress Indicators**: Visual representation of task completion rates
- **Trend Analysis**: Productivity trends with up/down indicators

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **HTTP Client**: Axios
- **Authentication**: Jira API tokens with secure cookie storage

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd worklog-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Jira Setup

### 1. Generate API Token
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Worklog Dashboard")
4. Copy the generated token

### 2. Get Your Jira Domain
- For Jira Cloud: `your-company.atlassian.net`
- For Jira Server: Your Jira server URL

### 3. Login to Dashboard
1. Navigate to the dashboard
2. You'll be redirected to the login page
3. Enter your Jira domain, email, and API token
4. Click "Connect to Jira"

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── jira/          # Jira API proxy
│   ├── login/             # Authentication page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard container
│   ├── StatsCard.tsx      # Statistics cards
│   ├── WeeklyChart.tsx    # Weekly hours chart
│   ├── TeamOverview.tsx   # Team distribution sidebar
│   ├── DeveloperList.tsx  # Developer performance table
│   ├── DateRangePicker.tsx # Date range selector
│   └── ProtectedRoute.tsx # Authentication wrapper
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state management
├── lib/                   # Utilities and data
│   ├── types.ts           # TypeScript type definitions
│   ├── mockData.ts        # Mock data for development
│   └── jiraApi.ts         # Jira API service
└── constants/             # Application constants
```

## 🎯 Key Components

### Authentication Flow
1. **ProtectedRoute**: Wraps dashboard and redirects unauthenticated users
2. **AuthContext**: Manages authentication state across the app
3. **Login Page**: Secure form for Jira credentials
4. **Jira API Service**: Handles all Jira API calls with proper error handling

### Dashboard Features
- **Real-time Data**: Fetches worklogs based on selected date range
- **Interactive Filtering**: Filter by team and search developers
- **Responsive Design**: Works on all screen sizes
- **Loading States**: Proper loading indicators during data fetching

## 🔮 Future Enhancements

### Advanced Jira Integration
- **OAuth 2.0**: More secure authentication flow
- **Webhook Support**: Real-time updates via Jira webhooks
- **Custom Fields**: Support for custom Jira fields and worklog data
- **Sprint Filtering**: Filter data by specific sprints
- **Project Filtering**: Filter by specific Jira projects

### Advanced Features
- **Export Functionality**: PDF/Excel report generation
- **Advanced Filtering**: More granular filtering options
- **Notifications**: Real-time alerts for productivity issues
- **Team Management**: Add/edit team members and roles
- **Historical Data**: Long-term trend analysis and reporting

### Performance & UX
- **Real-time Updates**: WebSocket integration for live data
- **Offline Support**: Service worker for offline functionality
- **Dark Mode**: Toggle between light and dark themes
- **Accessibility**: WCAG 2.1 compliance improvements

## 🎨 Customization

### Styling
The dashboard uses Tailwind CSS for styling. You can customize colors, spacing, and components by modifying the Tailwind configuration.

### Data Structure
Mock data is centralized in `src/lib/mockData.ts`. When integrating with Jira API, the data structure automatically adapts to your Jira worklog format.

### Components
All components are modular and reusable. You can easily add new components or modify existing ones to match your specific requirements.

## 🔧 Development

### Environment Variables
Create a `.env.local` file for environment-specific configuration:

```env
# Optional: Override default API timeout
NEXT_PUBLIC_API_TIMEOUT=10000
```

### API Routes
The dashboard uses Next.js API routes to proxy Jira API calls, avoiding CORS issues and providing better security. All Jira API calls go through `/api/jira`.

### Error Handling
The application includes comprehensive error handling:
- Network errors with retry logic
- Authentication errors with automatic logout
- Data validation errors with user-friendly messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or support, please open an issue in the repository or contact the development team.

## 🔒 Security

- API tokens are stored securely in HTTP-only cookies
- All Jira API calls are proxied through server-side routes
- No sensitive data is exposed in client-side code
- Automatic logout on authentication failures
