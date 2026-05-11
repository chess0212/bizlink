import { motion } from 'motion/react';
import { useState } from 'react';
import { ShoppingCart, Zap, MessageCircle, Smartphone, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LandingPage() {
  const navigate = useNavigate();

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists
      const docRef = doc(db, 'users', user.uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }

      if (docSnap && !docSnap.exists()) {
        try {
          await setDoc(docRef, {
            uid: user.uid,
            email: user.email,
            role: 'seller',
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Authentification annulée par l'utilisateur.");
      } else {
        console.error("Login Error:", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#FF6600]/10 selection:text-[#FF6600]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#FF6600] rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">BizLink</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Tarifs</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="text-sm font-bold text-slate-900 hover:text-[#FF6600] transition-colors px-4 py-2"
            >
              Connexion
            </button>
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              S'inscrire
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Nouveau en Côte d'Ivoire</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.9] tracking-tight">
              Vendez partout, <br />
              <span className="text-[#FF6600]">simplement.</span>
            </h1>
            
            <p className="text-xl text-slate-500 font-medium max-w-xl leading-relaxed">
              Créez votre boutique en ligne en 2 minutes, acceptez Orange, MTN et Moov Money, et gérez vos commandes sur WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="group px-10 py-6 bg-[#FF6600] text-white rounded-[2rem] font-black uppercase text-sm tracking-widest hover:bg-orange-700 transition-all shadow-2xl shadow-orange-200 flex items-center justify-center gap-3 active:scale-95"
              >
                {isLoggingIn ? 'Chargement...' : 'Démarrer Gratuitement'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-[2rem]">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-xs">
                  <p className="font-black text-slate-900">+500 Vendeurs</p>
                  <p className="font-medium text-slate-500 text-[10px]">Utilisent BizLink au pays</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Ventes générées", value: "2M CFA+", color: "bg-orange-500" },
              { label: "Vendeurs actifs", value: "500+", color: "bg-slate-900" },
              { label: "Commandes/jour", value: "150+", color: "bg-blue-600" },
              { label: "Disponibilité", value: "99.9%", color: "bg-green-500" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`${stat.color} p-8 rounded-[2.5rem] text-white space-y-2 shadow-xl shadow-slate-200`}
              >
                <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Pensé pour vous.</h2>
            <p className="text-slate-500 font-medium text-lg">Tout ce dont vous avez besoin pour vendre, sans la complexité.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageCircle className="w-6 h-6 text-green-500" />,
                title: "WhatsApp First",
                desc: "Recevez chaque commande directement sur votre WhatsApp avec tous les détails."
              },
              {
                icon: <Smartphone className="w-6 h-6 text-orange-600" />,
                title: "Mobile Money",
                desc: "Orange, MTN et Moov Money intégrés. Pas de compte bancaire requis."
              },
              {
                icon: <Zap className="w-6 h-6 text-blue-600" />,
                title: "Ultra Rapide",
                desc: "Une boutique optimisée pour le mobile qui charge instantanément, même avec peu de connexion."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px]"></div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Prêt à booster votre business ?</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">Rejoignez des centaines de vendeurs qui font confiance à BizLink pour simplifier leur e-commerce.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-10 py-5 bg-[#FF6600] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/20"
            >
              S'inscrire Maintenant
            </button>
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
            >
              Plus d'infos
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-5 h-5" />
            <span className="font-bold">BizLink 2024. Made for African Sellers.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-slate-900">Confidentialité</a>
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-slate-900">Conditions</a>
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-slate-900">Aide</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
