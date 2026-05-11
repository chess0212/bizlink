import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, getDocs, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Shop, Product, OrderItem } from '../types';
import { ShoppingCart, MessageCircle, ArrowLeft, Info, Plus, Minus, X, Check, Trash2, Smartphone, ArrowRight, Search, Filter as FilterIcon, Instagram, Facebook, Phone, Coffee, Milk, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ShopPublic() {
  const { shopId } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [orderProcessed, setOrderProcessed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'OM' | 'MOMO' | 'MOOV' | 'CASH' | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'FORM' | 'GUIDE'>('FORM');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  useEffect(() => {
    async function fetchData() {
      if (!shopId) return;
      try {
        const docSnap = await getDoc(doc(db, 'shops', shopId));
        if (docSnap.exists()) {
          const shopData = docSnap.data() as Shop;
          setShop(shopData);
          document.title = `${shopData.name} | BizLink`;
          const q = query(collection(db, `shops/${shopId}/products`), orderBy('createdAt', 'desc'));
          const pSnap = await getDocs(q);
          setProducts(pSnap.docs.map(d => ({ ...d.data(), id: d.id } as Product)));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `shops/${shopId}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [shopId]);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: product.id!, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    const existing = cart.find(item => item.productId === id);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => item.productId === id ? { ...item, quantity: item.quantity - 1 } : item));
    } else {
      setCart(cart.filter(item => item.productId !== id));
    }
  };

  const total = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const categories = ['Tous', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCheckout = async () => {
    if (!shop || cart.length === 0 || !customerInfo.phone) return;

    try {
      const orderRef = doc(collection(db, `shops/${shop.id}/orders`));
      const orderData = {
        id: orderRef.id,
        shopId: shop.id,
        customerName: customerInfo.name || 'Client Anonyme',
        customerPhone: customerInfo.phone,
        deliveryAddress: customerInfo.address,
        items: cart,
        total,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: paymentMethod || 'CASH',
        createdAt: serverTimestamp()
      };
      
      try {
        await setDoc(orderRef, orderData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `shops/${shop.id}/orders`);
      }

      // Construct WhatsApp Message
      const paymentInfoLabel = paymentMethod === 'OM' ? `Orange Money (${shop.orangeMoney})` :
                          paymentMethod === 'MOMO' ? `MTN MoMo (${shop.mtnMoney})` :
                          paymentMethod === 'MOOV' ? `Moov Money (${shop.moovMoney})` :
                          'Paiement à la livraison (Cash)';

      const messageText = `📦 *NOUVELLE COMMANDE BIZLINK*\n\n` +
        `👤 *CLIENT:* ${customerInfo.name || 'Non spécifié'}\n` +
        `📞 *TÉL:* ${customerInfo.phone}\n` +
        `📍 *ADRESSE:* ${customerInfo.address || 'À définir'}\n\n` +
        `💳 *PAIEMENT:* ${paymentInfoLabel}\n` +
        (paymentMethod !== 'CASH' && paymentMethod !== null ? `✅ *STATUT:* Dépôt effectué\n` : '') +
        `\n🛍️ *ARTICLES:* \n` +
        cart.map(i => `• ${i.name} [x${i.quantity}] (${(i.price * i.quantity).toLocaleString()} F)`).join('\n') +
        `\n\n💰 *TOTAL À PAYER: ${total.toLocaleString()} CFA*`;

      // Clean WhatsApp Number (Add 225 if missing and remove spaces)
      let cleanPhone = shop.whatsappNumber.replace(/\D/g, '');
      if (cleanPhone.length === 10) cleanPhone = '225' + cleanPhone;
      if (cleanPhone.length === 8) cleanPhone = '2250' + cleanPhone; 

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
      
      setOrderProcessed(true);
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
        <X className="text-slate-400 w-10 h-10" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Boutique introuvable</h1>
      <p className="text-slate-500 font-medium">Désolé, ce lien ne semble pas correspondre à une boutique active.</p>
      <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Retour à l'accueil</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-600" style={{ '--accent': shop.accentColor || '#FF6600' } as any}>
      {/* Shop Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-40 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 overflow-hidden border border-orange-100 flex items-center justify-center">
              <img src={shop.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${shop.name}`} alt={shop.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">{shop.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 mr-4">
               {shop.instagram && (
                 <a href={`https://instagram.com/${shop.instagram.replace('@', '')}`} target="_blank" className="p-2 text-slate-400 hover:text-pink-600 transition-colors">
                   <Instagram className="w-5 h-5" />
                 </a>
               )}
               <a href={`https://wa.me/${shop.whatsappNumber.replace(/\D/g, '')}`} target="_blank" className="p-2 text-slate-400 hover:text-green-600 transition-colors">
                 <MessageCircle className="w-5 h-5" />
               </a>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/10 hover:scale-105 transition-all active:scale-95"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent)] text-white text-[10px] font-black rounded-lg flex items-center justify-center border-2 border-white">
                  {cart.reduce((acc, curr) => acc + curr.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-32 px-6 max-w-7xl mx-auto space-y-12">

        {/* Banner / Fun Slider */}
        <div className="relative h-64 md:h-[400px] rounded-[4rem] overflow-hidden group shadow-3xl shadow-slate-200">
           <motion.div 
             animate={{ x: ["0%", "-10%", "0%"] }}
             transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
             className="absolute inset-0 w-[120%] flex"
           >
             {(shop.sliderImages && shop.sliderImages.length > 0) ? (
               shop.sliderImages.map((img, i) => (
                 <img key={i} src={img} className={`${shop.sliderImages!.length === 1 ? 'w-full' : 'w-1/2'} h-full object-cover brightness-75 transition-transform duration-700 group-hover:scale-105`} alt="" />
               ))
             ) : (
               <>
                 <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop" className="w-1/2 h-full object-cover brightness-75 transition-transform duration-700 group-hover:scale-105" alt="" />
                 <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" className="w-1/2 h-full object-cover brightness-75 transition-transform duration-700 group-hover:scale-105" alt="" />
               </>
             )}
           </motion.div>
           <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent flex flex-col justify-center px-12 md:px-20 space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 w-fit"
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Boutique Officielle</span>
              </motion.div>
              <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-[0.85]">
                {shop.slogan || "Vos favoris"} <br />
                <span style={{ color: 'var(--accent)' }}>livrés chez vous.</span>
              </h2>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => {
                    const el = document.getElementById('catalog');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform active:scale-95"
                >
                  Découvrir
                </button>
              </div>
           </div>
        </div>

        {/* Info Banderole (Marquee style) */}
        <div className="bg-slate-900 overflow-hidden py-3 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-200">
           <motion.div 
             animate={{ x: ["0%", "-50%"] }}
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="flex whitespace-nowrap gap-12 items-center"
           >
             {[1, 2, 3].map((_, i) => (
               <div key={i} className="flex items-center gap-12 text-white/90 font-black uppercase text-[10px] tracking-[0.4em]">
                 <span className="flex items-center gap-3">✨ Livraison partout à {shop.city}</span>
                 <span className="flex items-center gap-3">⭐ Qualité {shop.name} Garantie</span>
                 <span className="flex items-center gap-3">💳 OM / MOMO / MOOV Acceptés</span>
                 <span className="flex items-center gap-3">🚀 Commande via WhatsApp</span>
               </div>
             ))}
           </motion.div>
        </div>

        {/* Services Section */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: <Smartphone />, title: "Commande WhatsApp", desc: "Commandez en un clic via WhatsApp" },
            { icon: <Check />, title: "Qualité Garantie", desc: "Produits vérifiés et authentiques" },
            { icon: <Smartphone />, title: "Paiement Mobile", desc: "OM, MoMo & Moov acceptés" },
          ].map((s, i) => (
            <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-900 shadow-sm">
                {s.icon}
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">{s.title}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div id="catalog" className="space-y-8 pt-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <h2 className="text-3xl font-black tracking-tight">Le Catalogue</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[var(--accent)] transition-colors" />
            <input 
              type="text"
              placeholder="Rechercher un article spécifique..."
              className="w-full pl-16 pr-8 py-6 bg-slate-50 rounded-[2.5rem] border-none focus:ring-4 focus:ring-[var(--accent)]/10 font-bold text-slate-900 placeholder:text-slate-400 text-lg shadow-inner"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(p => (
              <motion.div
                layout
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white rounded-[3rem] border border-slate-100 flex flex-col overflow-hidden hover:shadow-4xl transition-all duration-500"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
                  <img src={p.image || p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-6 right-6 px-4 py-2 bg-white/95 backdrop-blur-md rounded-2xl font-black text-sm text-slate-900 shadow-2xl border border-white">
                    {p.price.toLocaleString()} F
                  </div>
                  <div className="absolute top-6 left-6 px-3 py-1 bg-black/10 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.category}
                  </div>
                </div>

                <div className="p-8 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-[var(--accent)] transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <button 
                    onClick={() => addToCart(p)}
                    style={{ '--hover-color': shop.accentColor || '#FF6600' } as any}
                    className="w-full py-4 bg-slate-50 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[var(--hover-color)] hover:text-white transition-all flex items-center justify-center gap-3 group/btn hover:shadow-xl active:scale-95"
                  >
                    <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
                    Ajouter au panier
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
              <Search className="w-12 h-12" />
            </div>
            <div className="space-y-2">
               <p className="text-xl font-black text-slate-900">Aucun article trouvé</p>
               <p className="text-slate-400 font-bold">Essayez d'autres mots-clés ou changez de catégorie.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-20 pb-10 border-t border-slate-100 flex flex-col items-center space-y-10">
           <div className="flex flex-col items-center gap-4 text-center">
             <div className="w-20 h-20 rounded-[2.5rem] bg-orange-50 overflow-hidden border-2 border-orange-100 p-1">
               <img src={shop.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${shop.name}`} alt={shop.name} className="w-full h-full object-cover rounded-[2rem]" />
             </div>
             <h2 className="text-3xl font-black tracking-tight">{shop.name}</h2>
             <p className="text-slate-500 font-medium text-sm max-w-sm">{shop.description}</p>
           </div>

           <div className="flex gap-4">
             {shop.instagram && (
               <a href={`https://instagram.com/${shop.instagram.replace('@', '')}`} target="_blank" className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-pink-50 hover:text-pink-600 transition-all">
                 <Instagram className="w-6 h-6" />
               </a>
             )}
             {shop.tiktok && (
               <a href={`https://tiktok.com/@${shop.tiktok.replace('@', '')}`} target="_blank" className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-black hover:text-white transition-all">
                 <Smartphone className="w-6 h-6" />
               </a>
             )}
              <a href={`https://wa.me/${shop.whatsappNumber.replace(/\D/g, '')}`} target="_blank" className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-green-50 hover:text-green-600 transition-all">
                 <MessageCircle className="w-6 h-6" />
               </a>
           </div>

           <div className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">
             Powered by BizLink
           </div>
        </footer>
      </main>

      {/* Cart Button Mobile Overlay */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-8 left-6 right-6 z-40 max-w-7xl mx-auto">
          <motion.button 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="w-full h-16 bg-slate-900 text-white rounded-[2rem] shadow-2xl flex items-center justify-between px-8 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
               <div className="relative">
                 <ShoppingCart className="w-5 h-5" />
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[8px] font-black rounded-lg flex items-center justify-center">
                   {cart.reduce((a, b) => a + b.quantity, 0)}
                 </span>
               </div>
               <span className="font-black text-sm uppercase tracking-widest">Votre Panier</span>
            </div>
            <span className="font-black text-xs bg-white/10 px-4 py-2 rounded-xl">{total.toLocaleString()} F</span>
          </motion.button>
        </div>
      )}

      {/* Cart Drawer Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsCartOpen(false)}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-full lg:max-w-md bg-white z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-8 flex items-center justify-between border-b border-slate-50">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Panier</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{cart.length} Types d'articles</p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {orderProcessed ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                    <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center">
                      <Check className="w-12 h-12 text-green-500" strokeWidth={3} />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black text-slate-900 tracking-tight">Commande validée !</h3>
                       <p className="text-slate-500 font-medium px-4">Nous vous redirigeons vers WhatsApp pour finaliser avec le vendeur.</p>
                    </div>
                    <button 
                      onClick={() => { setCart([]); setOrderProcessed(false); setIsCartOpen(false); }}
                      className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200"
                    >
                      Refaire des achats
                    </button>
                  </div>
                ) : cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                      <ShoppingCart className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900">Votre panier est vide</p>
                      <p className="text-sm font-medium text-slate-400 mt-1">Ajoutez des produits pour commander</p>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Retourner en boutique</button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {cart.map(item => (
                        <div key={item.productId} className="flex gap-4 group">
                          <div className="w-20 h-24 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex-shrink-0">
                            <img src={products.find(p => p.id === item.productId)?.images[0] || products.find(p => p.id === item.productId)?.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1 flex flex-col justify-center gap-1">
                            <h4 className="text-sm font-black text-slate-900 leading-tight">{item.name}</h4>
                            <p className="text-xs font-bold text-orange-600">{item.price.toLocaleString()} F / unité</p>
                            <div className="flex items-center gap-3 mt-3">
                              <button onClick={() => removeFromCart(item.productId!)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-100 border border-slate-100 transition-colors">
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-sm font-black text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                              <button onClick={() => addToCart(products.find(p => p.id === item.productId)!)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-100 border border-slate-100 transition-colors">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right flex flex-col justify-between items-end">
                            <p className="text-sm font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} F</p>
                            <button 
                              onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 space-y-8 border-t border-slate-50">
                       {checkoutStep === 'FORM' ? (
                         <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Informations de livraison</h3>
                            <div className="space-y-3">
                              <input 
                                placeholder="Votre Nom complet"
                                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20"
                                value={customerInfo.name}
                                onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                              />
                               <input 
                                type="tel"
                                placeholder="WhatsApp (ex: 0707...)"
                                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20"
                                value={customerInfo.phone}
                                onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                              />
                              <textarea 
                                placeholder="Adresse précise pour la livraison"
                                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/20 h-24"
                                value={customerInfo.address}
                                onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                              />
                            </div>

                            <div className="space-y-3 pt-4">
                              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Moyen de paiement</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {shop.orangeMoney && (
                                  <button onClick={() => setPaymentMethod('OM')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 group/pay ${paymentMethod === 'OM' ? 'border-orange-500 bg-orange-50' : 'border-slate-50 bg-slate-50'}`}>
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 transition-transform group-active/pay:scale-90"><Smartphone className="w-5 h-5" /></div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'OM' ? 'text-orange-700' : 'text-slate-500'}`}>Orange Money</span>
                                  </button>
                                )}
                                {shop.mtnMoney && (
                                  <button onClick={() => setPaymentMethod('MOMO')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 group/pay ${paymentMethod === 'MOMO' ? 'border-yellow-500 bg-yellow-50' : 'border-slate-50 bg-slate-50'}`}>
                                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 transition-transform group-active/pay:scale-90"><Smartphone className="w-5 h-5" /></div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'MOMO' ? 'text-yellow-700' : 'text-slate-500'}`}>MTN MoMo</span>
                                  </button>
                                )}
                                {shop.moovMoney && (
                                  <button onClick={() => setPaymentMethod('MOOV')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 group/pay ${paymentMethod === 'MOOV' ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50'}`}>
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 transition-transform group-active/pay:scale-90"><Smartphone className="w-5 h-5" /></div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'MOOV' ? 'text-blue-700' : 'text-slate-500'}`}>Moov Money</span>
                                  </button>
                                )}
                                <button onClick={() => setPaymentMethod('CASH')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-3 group/pay ${paymentMethod === 'CASH' ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'border-slate-50 bg-slate-50'}`}>
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-active/pay:scale-90 ${paymentMethod === 'CASH' ? 'bg-white/10' : 'bg-slate-200'}`}><Check className="w-5 h-5" strokeWidth={3} /></div>
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'CASH' ? 'text-white' : 'text-slate-500'}`}>Cash</span>
                                </button>
                              </div>
                            </div>
                         </div>
                       ) : (
                         <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-8 relative overflow-hidden">
                            <div className="flex items-center gap-4">
                              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl ${paymentMethod === 'OM' ? 'bg-orange-500' : paymentMethod === 'MOMO' ? 'bg-yellow-500' : 'bg-blue-600'}`}>
                                <Smartphone className="w-7 h-7" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Veuillez payer</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">Dépôt Mobile Money</h3>
                              </div>
                            </div>

                            <div className="space-y-6">
                               <div className="space-y-2">
                                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Composez sur votre mobile</p>
                                 <p className="text-3xl font-black text-slate-900 tracking-tighter">{paymentMethod === 'OM' ? '#144#' : paymentMethod === 'MOMO' ? '*133#' : '*155#'}</p>
                               </div>
                               <div className="space-y-2">
                                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">2. Montant total exact</p>
                                 <p className="text-3xl font-black text-slate-900 tracking-tighter">{total.toLocaleString()} CFA</p>
                               </div>
                               <div className="space-y-2">
                                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">3. Vers le numéro BizLink</p>
                                 <p className="text-3xl font-black text-orange-600 tracking-tighter">
                                   {paymentMethod === 'OM' ? shop.orangeMoney : paymentMethod === 'MOMO' ? shop.mtnMoney : shop.moovMoney}
                                 </p>
                               </div>
                            </div>

                            <div className="p-5 bg-orange-100/30 rounded-2xl border border-orange-200/50">
                               <p className="text-xs font-bold text-orange-900 leading-tight flex gap-3 italic">
                                 <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                 Après le dépôt, validez ici pour envoyer la preuve via WhatsApp au commerçant.
                               </p>
                            </div>

                            <button onClick={() => setCheckoutStep('FORM')} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-widest flex items-center gap-2">
                              <ArrowLeft className="w-3 h-3" /> Retourner aux infos
                            </button>
                         </div>
                       )}
                    </div>
                  </>
                )}
              </div>

              {!orderProcessed && cart.length > 0 && (
                <div className="p-8 bg-slate-900 text-white space-y-6">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Total Net à payer</p>
                     <p className="text-4xl font-black tracking-tighter">{total.toLocaleString()} F</p>
                   </div>
                   
                   <button 
                     onClick={() => {
                        if (checkoutStep === 'FORM' && (paymentMethod === 'CASH' || !paymentMethod)) {
                          handleCheckout();
                        } else if (checkoutStep === 'FORM') {
                          if (!customerInfo.name || !customerInfo.phone) return alert("Veuillez remplir vos informations !");
                          setCheckoutStep('GUIDE');
                        } else {
                          handleCheckout();
                        }
                     }}
                     className={`w-full py-6 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${checkoutStep === 'GUIDE' || paymentMethod === 'CASH' || paymentMethod === null ? 'bg-[#25D366] text-white shadow-[#25D366]/20' : 'bg-white text-slate-900 shadow-white/10'}`}
                   >
                     {checkoutStep === 'FORM' && paymentMethod !== 'CASH' && paymentMethod !== null ? (
                       <>Continuer vers le paiement <ArrowRight className="w-5 h-5" /></>
                     ) : (
                       <><MessageCircle className="w-5 h-5 fill-current" /> Terminer ma commande</>
                     )}
                   </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
