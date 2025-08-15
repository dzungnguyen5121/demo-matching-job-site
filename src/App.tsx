import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopPage from "./pages/TopPage";
import LoginPage from "./pages/login";
import JobListPage from "./pages/JobListPage";
import JobFindPage from "./pages/JobFindPage";
import JobCreatePage from "./pages/JobCreatePage";
import SeekerMatchHubPage from "./pages/SeekerMatchHubPage";
import ApplicantPage from "./pages/ApplicantPage";
import ProfilePage from "./pages/Profile";
import NotificationsPage from "./pages/NotificationsPage";
import ChatPage from "./pages/ChatPage";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TopPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/poster/jobs" element={<ProtectedRoute allowedRoles={['poster']}><JobListPage /></ProtectedRoute>} />
          <Route path="/seeker/find" element={<ProtectedRoute allowedRoles={['seeker']}><JobFindPage /></ProtectedRoute>} />
          <Route path="/poster/jobs/create" element={<ProtectedRoute allowedRoles={['poster']}><JobCreatePage /></ProtectedRoute>} />
          <Route path="/seeker/matches" element={<ProtectedRoute allowedRoles={['seeker']}><SeekerMatchHubPage /></ProtectedRoute>} />
          <Route path="/poster/jobs/:jobId/applicants" element={<ProtectedRoute allowedRoles={['poster']}><ApplicantPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
