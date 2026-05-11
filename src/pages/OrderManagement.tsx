import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { Order, Shop, OrderStatus } from '../types';
import { Package, CheckCircle2, Truck, Clock, XCircle, Search, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function OrderManagement() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    async function fetchData() {
      if (!auth.currentUser) return;
      try {
        const shopQuery = query(collection(db, 'shops'), where('ownerId', '==', auth.currentUser.uid));
        const shopSnap = await getDocs(shopQuery);
        if (!shopSnap.empty) {
          const s = shopSnap.docs[0].data() as Shop;
          setShop(s);
          const oQuery = query(
            collection(db, `shops/${s.id}/orders`), 
            orderBy('createdAt', 'desc')
          );
          const oSnap = await getDocs(oQuery);
          setOrders(oSnap.docs.map(d => ({ ...d.data(), id: d.id } as Order)));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'orders');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!shop) return;
    try {
      await updateDoc(doc(db, `shops/${shop.id}/orders`, orderId), { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shop.id}/orders/${orderId}`);
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'confirmed': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'delivering': return <Truck className="w-4 h-4 text-purple-500" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div>Chargement des commandes...</div>;

  return (
    <div className="space-y-8 pt-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Commandes
          </h1>
          <p className="text-slate-500 font-medium mt-1">Suivez et gérez les demandes de vos clients</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {['all', 'pending', 'confirmed', 'delivering', 'completed'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${
                filter === f ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-600'
              }`}
            >
              {f === 'all' ? 'Toutes' : f === 'pending' ? 'Attente' : f === 'confirmed' ? 'Confirmé' : f === 'delivering' ? 'Livraison' : 'Terminé'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-24 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Package className="w-10 h-10 text-slate-200" />
             </div>
             <p className="text-slate-400 font-bold uppercase text-xs tracking-widest leading-loose">Zéro commande dans cette catégorie</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <motion.div 
              layout
              key={order.id}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8 group hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center font-black text-slate-400 text-xl border border-slate-100">
                    {order.customerName?.[0] || 'C'}
                  </div>
                  <div className="space-y-1">
                    <div className="font-black text-xl text-slate-900 tracking-tight">{order.customerName}</div>
                    <div className="flex items-center gap-2 overflow-hidden text-xs font-bold text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-[#FF6600]" strokeWidth={3} />
                      {order.customerPhone}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-[200px]">
                    <div className="shrink-0">{getStatusIcon(order.status)}</div>
                    <select 
                      className="bg-transparent text-xs font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer w-full text-slate-600 p-0"
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="delivering">En livraison</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Résumé Articles</p>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-600"><span className="font-black text-slate-900">x{item.quantity}</span> {item.name}</span>
                        <span className="font-bold text-slate-900">{(item.price * item.quantity).toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#FF6600]">Total Commande</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{order.total.toLocaleString()} F</p>
                  </div>
                  <div className="pt-2 flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paiement</p>
                    <p className="text-xs font-bold text-slate-600">{order.paymentMethod === 'OM' ? 'Orange Money' : order.paymentMethod === 'MOMO' ? 'MTN MoMo' : order.paymentMethod === 'MOOV' ? 'Moov Money' : 'Cash'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {order.deliveryAddress && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</p>
                      <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Truck className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-sm font-bold text-slate-600 leading-relaxed">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => window.open(`tel:${order.customerPhone}`)}
                      className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                    >
                      Appeler le client
                    </button>
                    <button 
                       onClick={() => window.open(`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`)}
                       className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-100 hover:scale-105 transition-all"
                    >
                      <MessageCircle className="w-6 h-6 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
