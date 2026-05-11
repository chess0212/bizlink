import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from './types';

// Pages & Components
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ShopPublic from './pages/ShopPublic';
import ProductManagement from './pages/ProductManagement';
import OrderManagement from './pages/OrderManagement';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

function AppContent({ user, profile }: { user: User | null, profile: UserProfile | null }) {
  const location = useLocation();
  const isShopPublic = location.pathname.startsWith('/s/');

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {!isShopPublic && <Navbar user={user} profile={profile} />}
      <main className={isShopPublic ? "" : "container mx-auto px-4 py-6 max-w-7xl"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/s/:shopId" element={<ShopPublic />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/products" 
            element={user ? <ProductManagement /> : <Navigate to="/" />} 
          />
          <Route 
            path="/orders" 
            element={user ? <OrderManagement /> : <Navigate to="/" />} 
          />
           <Route 
            path="/onboarding" 
            element={user ? <Onboarding /> : <Navigate to="/" />} 
          />
          <Route 
            path="/settings" 
            element={user ? <Settings /> : <Navigate to="/" />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppContent user={user} profile={profile} />
    </BrowserRouter>
  );
}
