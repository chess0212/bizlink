import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  AlertCircle,
  QrCode,
  Share2,
  Copy,
  ChevronRight,
  Sparkles,
  Settings,
  X
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { Shop, Order, Product } from '../types';
import { Link } from 'react-router-dom';
import { getBusinessAdvice } from '../services/ai.service';
import { AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!auth.currentUser) return;
      
      try {
        // Fetch Shop
        const shopQuery = query(collection(db, 'shops'), where('ownerId', '==', auth.currentUser.uid), limit(1));
        const shopSnap = await getDocs(shopQuery);
        
        if (!shopSnap.empty) {
          const shopData = { ...shopSnap.docs[0].data(), id: shopSnap.docs[0].id } as Shop;
          setShop(shopData);

          // Fetch Recent Orders
          const ordersQuery = query(
            collection(db, `shops/${shopData.id}/orders`), 
            orderBy('createdAt', 'desc'), 
            limit(5)
          );
          const ordersSnap = await getDocs(ordersQuery);
          setOrders(ordersSnap.docs.map(d => ({ ...d.data(), id: d.id } as Order)));

          // Fetch Products count
          const productsQuery = query(collection(db, `shops/${shopData.id}/products`));
          const productsSnap = await getDocs(productsQuery);
          setProducts(productsSnap.docs.map(d => d.data() as Product));
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleGetAdvice = async () => {
    if (!shop) return;
    setLoadingAdvice(true);
    const stats = {
      orderCount: orders.length,
      productCount: products.length,
      revenue: orders.reduce((acc, curr) => acc + curr.total, 0)
    };
    const res = await getBusinessAdvice(stats);
    setAdvice(res);
    setLoadingAdvice(false);
  };

  const handleWithdraw = () => {
    alert("La fonctionnalité de retrait automatique sera disponible prochainement. Pour l'instant, vos paiements arrivent directement sur vos comptes Mobile Money configurés.");
  };

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-32 bg-gray-200 rounded-3xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-24 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    </div>;
  }

  if (!shop) {
    return (
      <div className="text-center py-20 space-y-6">
        <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-orange-600">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold">Aucune boutique trouvée</h2>
        <Link to="/onboarding" className="inline-block bg-orange-600 text-white px-8 py-3 rounded-xl font-bold">
          Créer ma boutique
        </Link>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/s/${shop.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

  return (
    <div className="space-y-8 pb-20 pt-4">
      {/* QR Code Modal */}
      <AnimatePresence>
        {showQr && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQr(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="bg-white overflow-hidden rounded-[3rem] shadow-2xl max-w-sm w-full text-center relative"
              >
                {/* Modal Header Aesthetic */}
                <div className="bg-[#FF6600] p-8 text-white relative overflow-hidden">
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">{shop.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">Votre Boutique BizLink</p>
                    </div>
                  </div>
                  {/* Decorative shapes */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 blur-xl rounded-full -translate-x-1/3 translate-y-1/3"></div>
                  
                  <button 
                    onClick={() => setShowQr(false)} 
                    className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="aspect-square bg-slate-50 rounded-[2.5rem] p-6 border-2 border-slate-100 relative group">
                    <img src={qrUrl} className="w-full h-full object-contain relative z-10" alt="QR Code" />
                    <div className="absolute inset-0 bg-white/40 blur-xl scale-90 group-hover:scale-100 transition-transform"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 font-medium px-4">
                      Scannez ce QR Code pour accéder directement à votre catalogue ou partagez-le sur vos réseaux.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                       <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = qrUrl;
                          link.download = `QR_${shop.name}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="py-4 bg-slate-50 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                      >
                        Télécharger
                      </button>
                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: shop.name,
                              text: `Découvrez ma boutique sur BizLink !`,
                              url: publicUrl
                            });
                          } else {
                            navigator.clipboard.writeText(publicUrl);
                            alert("Lien copié !");
                          }
                        }}
                        className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                      >
                        Partager
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bonjour, {auth.currentUser?.displayName?.split(' ')[0] || 'Marchand'}</h1>
          <p className="text-slate-500 font-medium">Voici l'état actuel de votre boutique <span className="text-slate-900 font-bold">{shop.name}</span></p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
            <span className="text-xs text-slate-400 font-mono translate-y-[1px]">{publicUrl.replace('https://', '')}</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                alert("Lien copié !");
              }}
              className="text-[#FF6600] hover:bg-orange-50 p-1.5 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <Link to={`/s/${shop.id}`} target="_blank" className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-colors">
            <Share2 className="w-4 h-4" />
            Aperçu
          </Link>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
          <p className="text-slate-500 text-sm font-medium tracking-tight">Ventes totales</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{orders.reduce((acc, curr) => acc + curr.total, 0).toLocaleString()} CFA</h3>
            <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
          <p className="text-slate-500 text-sm font-medium tracking-tight">Commandes</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{orders.length}</h3>
            <span className="text-blue-500 text-[10px] font-bold uppercase tracking-wider">Actives</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
          <p className="text-slate-500 text-sm font-medium tracking-tight">Articles actifs</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{products.length}</h3>
            <Link to="/products" className="text-slate-400 hover:text-[#FF6600]"><ChevronRight className="w-5 h-5" /></Link>
          </div>
        </div>

        <div className="p-5 rounded-2xl shadow-sm border border-[#FF6600]/20 bg-[#FF6600]/5 flex flex-col justify-between h-32">
          <p className="text-[#FF6600] text-sm font-bold tracking-tight">Solde Mobile Money</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-slate-900">{(orders.reduce((acc, curr) => acc + curr.total, 0) * 0.98).toLocaleString()} CFA</h3>
            <button 
              onClick={handleWithdraw}
              className="px-3 py-1 bg-[#FF6600] text-white text-[10px] font-bold rounded-full hover:bg-orange-700 transition-colors"
            >
              RETIRER
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Recent Orders Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-slate-400" />
              Commandes Récentes
            </h2>
            <Link to="/orders" className="text-[#FF6600] text-sm font-bold hover:underline">Voir tout</Link>
          </div>
          
          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-medium">Aucune commande pour le moment</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Paiement</th>
                    <th className="px-6 py-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {order.customerName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{order.customerName}</p>
                            <p className="text-[10px] text-slate-400">{order.createdAt ? (typeof order.createdAt === 'object' ? (order.createdAt as any).toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()) : '...'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{order.total.toLocaleString()} F</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-slate-600">
                          <div className={`w-2 h-2 rounded-full ${order.paymentStatus === 'paid' ? 'bg-orange-400' : 'bg-slate-300'}`}></div>
                          {order.paymentMethod === 'OM' ? 'Orange Money' : order.paymentMethod === 'MOMO' ? 'MTN MoMo' : order.paymentMethod === 'MOOV' ? 'Moov Money' : 'Cash'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          order.status === 'pending' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status === 'pending' ? 'En Attente' : order.status === 'completed' ? 'Terminé' : order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* AI Helper Card */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 relative overflow-hidden shadow-xl shadow-slate-200">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assistant IA BizLink</span>
              </div>
              <h3 className="text-xl font-bold leading-tight">Optimisez vos ventes dès maintenant.</h3>
              
              {advice ? (
                <div className="text-xs text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10 italic">
                  {advice}
                </div>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">Cliquez ci-dessous pour obtenir 3 conseils personnalisés basés sur vos données actuelles.</p>
              )}

              <button 
                onClick={handleGetAdvice}
                disabled={loadingAdvice}
                className="w-full py-3 bg-[#FF6600] hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                {loadingAdvice ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Générer des conseils
                  </>
                )}
              </button>
            </div>
            {/* Design patterns */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liens rapides</p>
            <div className="space-y-2">
              <Link to="/products" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><ShoppingBag className="w-4 h-4" /></div>
                Ajouter des produits
              </Link>
              <button 
                onClick={() => setShowQr(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><QrCode className="w-4 h-4" /></div>
                Partager QR Code
              </button>
              <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><Settings className="w-4 h-4" /></div>
                Paramètres Boutique
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

