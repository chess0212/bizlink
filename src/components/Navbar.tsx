import { Link, useNavigate } from 'react-router-dom';
import { User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ShoppingBag, LayoutDashboard, LogOut, LogIn, Store, Settings as SettingsIcon } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface NavbarProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function Navbar({ user, profile }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          email: user.email,
          role: 'seller',
          createdAt: serverTimestamp(),
        });
        navigate('/onboarding');
      } else {
        const userData = docSnap.data() as UserProfile;
        if (userData.onboarded) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (error: any) {
      console.error("Navbar Login Error:", error);
      if (error.code === 'auth/network-request-failed') {
        alert("Erreur de connexion réseau. Si vous êtes dans l'aperçu, veuillez cliquer sur l'icône 'Ouvrir dans un nouvel onglet' en haut à droite pour une meilleure compatibilité.");
      } else {
        alert("Une erreur est survenue lors de la connexion. Veuillez réessayer.");
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 h-16 flex items-center">
      <div className="container mx-auto flex items-center justify-between max-w-7xl">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xl uppercase">B</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">BizLink CI</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Commerce Digital</p>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <div className="hidden lg:flex gap-6 border-r border-slate-100 pr-6 mr-2">
                <Link 
                  to="/dashboard" 
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${window.location.pathname === '/dashboard' ? 'text-[#FF6600]' : 'text-slate-600 hover:text-[#FF6600]'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Tableau de bord
                </Link>
                <Link 
                  to="/products"
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${window.location.pathname === '/products' ? 'text-[#FF6600]' : 'text-slate-600 hover:text-[#FF6600]'}`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Produits
                </Link>
                <Link 
                  to="/settings"
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors ${window.location.pathname === '/settings' ? 'text-[#FF6600]' : 'text-slate-600 hover:text-[#FF6600]'}`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  Paramètres
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">{user.displayName || 'Marchand'}</p>
                  <p className="text-xs text-slate-500">Compte Pro</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLogin}
                className="hidden sm:block px-5 py-2.5 text-slate-600 font-bold text-sm hover:text-slate-900 transition-colors"
              >
                Connexion
              </button>
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 bg-[#FF6600] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-700 transition-all shadow-sm shadow-orange-200"
              >
                <LogIn className="w-4 h-4" />
                Démarrer gratuitement
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
