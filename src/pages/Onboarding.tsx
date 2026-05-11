import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Store, Phone, MapPin, Check } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shopId, setShopId] = useState('');
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    whatsappNumber: '',
    city: 'Abidjan',
    slogan: '',
    orangeMoney: '',
    mtnMoney: '',
    moovMoney: '',
    instagram: '',
    tiktok: '',
    logo: '',
    accentColor: '#FF6600',
    sliderImages: [
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop'
    ],
  });

  const categories = ["Vêtements", "Chaussures", "Cosmétiques", "Électronique", "Restauration", "Autre"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const shopRef = doc(collection(db, 'shops'));
      const newShop = {
        id: shopRef.id,
        name: formData.shopName,
        description: formData.description,
        slogan: formData.slogan,
        logo: formData.logo,
        whatsappNumber: formData.whatsappNumber,
        city: formData.city,
        orangeMoney: formData.orangeMoney,
        mtnMoney: formData.mtnMoney,
        moovMoney: formData.moovMoney,
        instagram: formData.instagram,
        tiktok: formData.tiktok,
        accentColor: formData.accentColor,
        sliderImages: formData.sliderImages,
        ownerId: auth.currentUser.uid,
        currency: 'XOF',
        createdAt: serverTimestamp(),
      };
      
      try {
        await setDoc(shopRef, newShop);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `shops/${shopRef.id}`);
      }
      
      // Update user profile
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          onboarded: true,
          shopId: shopRef.id
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
      
      setShopId(shopRef.id);
      setShowSuccess(true);
    } catch (error) {
      console.error("Shop creation error:", error);
      // You might want to show a toast or error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const shopUrl = `${window.location.origin}/s/${shopId}`;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#FF6600] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-xl w-full text-center space-y-8"
        >
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">C'est prêt !</h1>
            <p className="text-slate-500 font-medium">Votre boutique <span className="text-[#FF6600] font-bold">{formData.shopName}</span> est maintenant en ligne et prête à recevoir des commandes.</p>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Lien de votre boutique</p>
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <span className="text-sm font-bold text-slate-600 truncate flex-1 text-left">{shopUrl}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(shopUrl); alert("Lien copié !"); }}
                className="text-xs font-black text-[#FF6600] uppercase"
              >
                Copier
              </button>
            </div>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Commencer à vendre
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Configurons votre boutique</h1>
          <p className="text-gray-500">C'est rapide, promis !</p>
        </div>

        {/* Stepper */}
        <div className="flex justify-between relative px-10">
          <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gray-200 -translate-y-1/2"></div>
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}
            >
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>

        <motion.form 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 4) setStep(step + 1);
            else handleSubmit(e);
          }}
        >
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Nom de la boutique
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Ma Robe Chic"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={formData.shopName}
                  onChange={(e) => setFormData({...formData, shopName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Description (Optionnel)</label>
                <textarea 
                  placeholder="Ce que vous vendez..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Slogan ou Phrase d'accroche (Ex: Le chic à petit prix)</label>
                <input 
                  type="text" 
                  placeholder="Apparaîtra sur votre bannière..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={formData.slogan}
                  onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                />
              </div>
              <button 
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.shopName}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Numéro WhatsApp (Paiements & Commandes)
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="Ex: 0707070707"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                />
                <p className="text-xs text-gray-400">Important: Ce numéro recevra les commandes.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ville principale
                </label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                >
                  <option>Abidjan</option>
                  <option>Bouaké</option>
                  <option>Yamoussoukro</option>
                  <option>San-Pédro</option>
                  <option>Korhogo</option>
                  <option>Autres</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-50 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Retour
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.whatsappNumber}
                  className="flex-1 bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          ) : step === 3 ? (
            <div className="space-y-6">
              <div className="text-center space-y-1 mb-4">
                <h2 className="font-bold text-gray-900">Identité & Réseaux</h2>
                <p className="text-xs text-gray-500">Personnalisez l'apparence et les liens sociaux.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Instagram (Nom d'utilisateur)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: ma_boutique_officiel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20"
                    value={formData.instagram}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Logo de la boutique (URL)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: https://lien-vers-mon-logo.png"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20"
                    value={formData.logo}
                    onChange={(e) => setFormData({...formData, logo: e.target.value})}
                  />
                  {formData.logo && <img src={formData.logo} className="h-12 w-12 object-cover rounded-xl border" alt="Preview Logo" />}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">TikTok (Nom d'utilisateur)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: boutiquepro"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20"
                    value={formData.tiktok}
                    onChange={(e) => setFormData({...formData, tiktok: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Couleur d'accentuation</label>
                  <div className="flex gap-3">
                    {['#FF6600', '#25D366', '#000000', '#3b82f6', '#ec4899'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({...formData, accentColor: color})}
                        className={`w-10 h-10 rounded-full border-2 ${formData.accentColor === color ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-700">Images du Slider (Bannières - max 2)</label>
                  <div className="grid grid-cols-1 gap-4">
                    {formData.sliderImages.map((img, idx) => (
                      <div key={idx} className="space-y-2">
                        <input 
                          type="text" 
                          placeholder={`URL Image ${idx + 1}`}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20"
                          value={img}
                          onChange={(e) => {
                            const newImgs = [...formData.sliderImages];
                            newImgs[idx] = e.target.value;
                            setFormData({...formData, sliderImages: newImgs});
                          }}
                        />
                        {img && <img src={img} className="h-20 w-40 object-cover rounded-xl border" alt="Preview" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-50 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Retour
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-1 mb-4">
                <h2 className="font-bold text-gray-900">Modes de Paiement</h2>
                <p className="text-xs text-gray-500">Configurez vos numéros Mobile Money pour recevoir vos paiements.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-orange-500">Orange Money</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: 0707..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20"
                    value={formData.orangeMoney}
                    onChange={(e) => setFormData({...formData, orangeMoney: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-yellow-600">MTN MoMo</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: 0505..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500/20"
                    value={formData.mtnMoney}
                    onChange={(e) => setFormData({...formData, mtnMoney: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-blue-600">Moov Money</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: 0101..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20"
                    value={formData.moovMoney}
                    onChange={(e) => setFormData({...formData, moovMoney: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-50 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Retour
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Créer ma boutique"
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.form>
      </div>
    </div>
  );
}
