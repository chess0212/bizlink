import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Product, Shop } from '../types';
import { Plus, Trash2, Camera, Sparkles, Tag, Package } from 'lucide-react';
import { generateProductDescription } from '../services/ai.service';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductManagement() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Vêtements',
    price: 0,
    description: '',
    stock: 1,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400'
  });

  useEffect(() => {
    async function fetchData() {
      if (!auth.currentUser) return;
      try {
        const shopQuery = query(collection(db, 'shops'), where('ownerId', '==', auth.currentUser.uid));
        const shopSnap = await getDocs(shopQuery);
        if (!shopSnap.empty) {
          const s = shopSnap.docs[0].data() as Shop;
          setShop(s);
          const pQuery = query(collection(db, `shops/${s.id}/products`));
          const pSnap = await getDocs(pQuery);
          setProducts(pSnap.docs.map(d => ({ ...d.data(), id: d.id } as Product)));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'products');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    try {
      const pRef = doc(collection(db, `shops/${shop.id}/products`));
      const payload = {
        ...newProduct,
        id: pRef.id,
        shopId: shop.id,
        isActive: true,
        images: [newProduct.image],
        createdAt: serverTimestamp()
      };
      
      try {
        await setDoc(pRef, payload);
        setProducts([...products, payload as Product]);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `shops/${shop.id}/products`);
      }
      
      setIsAdding(false);
      setNewProduct({ name: '', category: 'Vêtements', price: 0, description: '', stock: 1, image: '' });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleGenerateDescription = async () => {
    if (!newProduct.name || !newProduct.category) return;
    setGenerating(true);
    const desc = await generateProductDescription(newProduct.name, newProduct.category);
    if (desc) setNewProduct({ ...newProduct, description: desc });
    setGenerating(false);
  };

  const handleDelete = async (id: string) => {
    if (!shop) return;
    try {
      await deleteDoc(doc(db, `shops/${shop.id}/products`, id));
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shops/${shop.id}/products/${id}`);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-8 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestion des Produits</h1>
          <p className="text-slate-500 font-medium mt-1">Gérez votre inventaire et vos articles</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-[#FF6600] text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-orange-100 hover:scale-105 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouveau Produit
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddProduct} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Nom de l'article</label>
                  <input 
                    required
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-medium"
                    placeholder="Ex: Robe en soie rouge"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Prix (CFA)</label>
                    <input 
                      type="number"
                      required
                      className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-bold"
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Catégorie</label>
                    <select 
                      className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] font-medium appearance-none"
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      <option>Vêtements</option>
                      <option>Chaussures</option>
                      <option>Cosmétiques</option>
                      <option>Électronique</option>
                      <option>Épicerie</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1 flex items-center justify-between">
                    Description
                    <button 
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={generating || !newProduct.name}
                      className="text-[#FF6600] flex items-center gap-1.5 hover:underline disabled:opacity-50 text-[10px]"
                    >
                      <Sparkles className="w-3 h-3" />
                      {generating ? 'Initialisation...' : 'Générer avec IA'}
                    </button>
                  </label>
                  <textarea 
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#FF6600] h-40 font-medium leading-relaxed"
                    placeholder="Décrivez les atouts de votre produit..."
                    value={newProduct.description}
                    onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="flex-1 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                  {newProduct.image ? (
                    <>
                      <img src={newProduct.image} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                         <Camera className="text-white w-10 h-10" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <Camera className="w-8 h-8 text-slate-300" />
                      </div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block">Photo du produit</span>
                    </div>
                  )}
                  <input 
                    type="text" 
                    placeholder="URL de l'image"
                    className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 text-xs rounded-xl border border-white/20 shadow-xl focus:ring-2 focus:ring-[#FF6600] outline-none"
                    value={newProduct.image}
                    onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                     type="button"
                     onClick={() => setIsAdding(false)}
                     className="px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-black transition-colors"
                  >
                    Publier l'article
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map(product => (
          <motion.div 
            layout
            key={product.id}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-100 transition-all duration-300"
          >
            <div className="h-56 bg-slate-100 overflow-hidden relative">
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6600] bg-white px-3 py-1.5 rounded-full shadow-sm">
                  {product.category}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight line-clamp-1">{product.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 font-medium leading-relaxed">{product.description}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prix</p>
                  <p className="text-xl font-black text-slate-900">{product.price.toLocaleString()} F</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
