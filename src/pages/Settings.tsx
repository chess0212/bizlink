import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Shop } from '../types';
import { Store, Phone, MapPin, Save, CheckCircle, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchShop() {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          // In this app, we assume 1 shop per user and linked via ownerId
          // But for simplicity in fetching, we could have stored shopId in user profile
          // Let's find the shop
          const { query, collection, where, getDocs } = await import('firebase/firestore');
          const q = query(collection(db, 'shops'), where('ownerId', '==', auth.currentUser.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setShop(snap.docs[0].data() as Shop);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchShop();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'shops', shop.id), {
        name: shop.name,
        description: shop.description,
        slogan: shop.slogan || '',
        logo: shop.logo || '',
        whatsappNumber: shop.whatsappNumber,
        sliderImages: shop.sliderImages || [],
        city: shop.city,
        orangeMoney: shop.orangeMoney || '',
        mtnMoney: shop.mtnMoney || '',
        moovMoney: shop.moovMoney || '',
        instagram: shop.instagram || '',
        tiktok: shop.tiktok || '',
        accentColor: shop.accentColor || '#FF6600',
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shop.id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center">Chargement des paramètres...</div>;
  if (!shop) return <div className="py-20 text-center">Boutique introuvable.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-4 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-slate-500 font-medium mt-1">Gérez les informations de votre boutique et vos paiements</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* General Info */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-[#FF6600]" />
              Informations Générales
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom de la boutique</label>
                <input 
                  type="text"
                  required
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-bold"
                  value={shop.name}
                  onChange={e => setShop({...shop, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">WhatsApp Business</label>
                <input 
                  type="tel"
                  required
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-bold"
                  value={shop.whatsappNumber}
                  onChange={e => setShop({...shop, whatsappNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Slogan de la boutique</label>
                <input 
                  type="text"
                  placeholder="Ex: Le luxe à portée de main"
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-bold"
                  value={shop.slogan || ''}
                  onChange={e => setShop({...shop, slogan: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Biographie / Description</label>
                <textarea 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] h-32 font-medium"
                  value={shop.description}
                  onChange={e => setShop({...shop, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">URL du Logo</label>
                <input 
                  type="text"
                  placeholder="Ex: https://..."
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-bold"
                  value={shop.logo || ''}
                  onChange={e => setShop({...shop, logo: e.target.value})}
                />
                {shop.logo && <img src={shop.logo} className="w-16 h-16 object-cover rounded-2xl border border-slate-100" alt="" />}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ville</label>
              <select 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-bold"
                value={shop.city}
                onChange={e => setShop({...shop, city: e.target.value})}
              >
                <option>Abidjan</option>
                <option>Bouaké</option>
                <option>Yamoussoukro</option>
                <option>San-Pédro</option>
                <option>Korhogo</option>
              </select>
            </div>
          </section>

          {/* Social & Identity */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pink-500" />
              Réputation & Design
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Instagram (@)</label>
                <input 
                  type="text"
                  placeholder="Ex: @ma_boutique"
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-bold"
                  value={shop.instagram || ''}
                  onChange={e => setShop({...shop, instagram: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">TikTok (@)</label>
                <input 
                  type="text"
                  placeholder="Ex: @boutique_pro"
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-bold"
                  value={shop.tiktok || ''}
                  onChange={e => setShop({...shop, tiktok: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Couleur d'accentuation</label>
              <div className="flex gap-4">
                 {['#FF6600', '#25D366', '#000000', '#3b82f6', '#ec4899'].map(color => (
                   <button
                    key={color}
                    type="button"
                    onClick={() => setShop({...shop, accentColor: color})}
                    className={`w-12 h-12 rounded-2xl border-4 transition-all ${shop.accentColor === color ? 'border-slate-900 scale-110 shadow-xl' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                   />
                 ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Images du Slider (Bannières)</label>
              <div className="grid grid-cols-1 gap-4">
                {(shop.sliderImages || []).map((img, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <input 
                      type="text"
                      placeholder={`URL Image ${idx + 1}`}
                      className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-medium"
                      value={img}
                      onChange={e => {
                        const newImgs = [...(shop.sliderImages || [])];
                        newImgs[idx] = e.target.value;
                        setShop({...shop, sliderImages: newImgs});
                      }}
                    />
                    {img && <img src={img} className="w-16 h-16 object-cover rounded-xl border border-slate-100" alt="" />}
                  </div>
                ))}
                {(shop.sliderImages || []).length < 2 && (
                  <button 
                    type="button"
                    onClick={() => setShop({...shop, sliderImages: [...(shop.sliderImages || []), '']})}
                    className="text-xs font-black text-orange-600 uppercase tracking-widest hover:underline"
                  >
                    + Ajouter une bannière
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-500" />
              Modes de Paiement Mobile Money
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-orange-500 tracking-widest ml-1">Orange Money</label>
                <input 
                  type="tel"
                  placeholder="Ex: 0707..."
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500/20 font-bold"
                  value={shop.orangeMoney || ''}
                  onChange={e => setShop({...shop, orangeMoney: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-yellow-600 tracking-widest ml-1">MTN Mobile Money</label>
                <input 
                  type="tel"
                  placeholder="Ex: 0505..."
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-yellow-500/20 font-bold"
                  value={shop.mtnMoney || ''}
                  onChange={e => setShop({...shop, mtnMoney: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest ml-1">Moov Money</label>
                <input 
                  type="tel"
                  placeholder="Ex: 0101..."
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                  value={shop.moovMoney || ''}
                  onChange={e => setShop({...shop, moovMoney: e.target.value})}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Save Button */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6 sticky top-24">
             <div className="space-y-2">
               <h3 className="text-xl font-bold tracking-tight">Prêt à mettre à jour ?</h3>
               <p className="text-sm text-slate-400">Vos modifications seront visibles immédiatement sur votre boutique publique.</p>
             </div>

             <button 
               type="submit"
               disabled={saving}
               className="w-full py-4 bg-[#FF6600] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/20 flex items-center justify-center gap-3 active:scale-95"
             >
               {saving ? (
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : success ? (
                 <>
                   <CheckCircle className="w-5 h-5 text-white" />
                   Enregistré !
                 </>
               ) : (
                 <>
                   <Save className="w-5 h-5" />
                   Enregistrer
                 </>
               )}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}
