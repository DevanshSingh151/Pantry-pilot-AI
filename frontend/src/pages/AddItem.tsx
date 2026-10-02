import { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Save, Loader2 } from 'lucide-react';

const CATEGORIES = [
  "Dairy & Eggs", "Produce", "Meat & Seafood", "Bakery", 
  "Pantry Staples", "Frozen", "Beverages", "Snacks", "Other"
];

export default function AddItem() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_id: null,
    category_name: 'Produce',
    quantity: 1,
    unit: 'pcs',
    expiry_date: '',
    min_stock_level: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...formData };
    if (!payload.expiry_date) delete payload.expiry_date;
    
    axios.post('/api/items', payload)
      .then(() => navigate('/pantry'))
      .catch(err => console.error(err));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    
    axios.post('/api/items/upload-bill', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(res => {
      // Store in localStorage and navigate to analysis page
      localStorage.setItem('billAnalysis', JSON.stringify(res.data.items));
      navigate('/bill-analysis');
    })
    .catch(err => {
      console.error(err);
      alert("Failed to analyze bill.");
      setLoading(false);
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Add Item</h2>
        <p className="mt-1 text-slate-500">Add a new ingredient or product to your pantry.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Item Name</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                  placeholder="e.g. Organic Whole Milk"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select 
                  value={formData.category_name}
                  onChange={e => setFormData({...formData, category_name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                <input 
                  type="number" step="0.01" required
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
                <select 
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="L">Liters (L)</option>
                  <option value="ml">Milliliters (ml)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Date</label>
                <input 
                  type="date"
                  value={formData.expiry_date}
                  onChange={e => setFormData({...formData, expiry_date: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Low Stock Alert Level</label>
                <input 
                  type="number" step="0.01"
                  value={formData.min_stock_level}
                  onChange={e => setFormData({...formData, min_stock_level: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => navigate('/pantry')} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save Item
              </button>
            </div>
          </form>
        </div>

        <div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <div 
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-8 text-center h-[300px] flex flex-col justify-center items-center hover:bg-slate-100 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'}`}
          >
            {loading ? (
              <div className="flex flex-col items-center text-emerald-600">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <h3 className="text-sm font-medium">Analyzing Bill...</h3>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900">Upload Grocery Bill</h3>
                <p className="text-xs text-slate-500 mt-2 px-4">Click to automatically extract items using Groq AI Vision.</p>
              </>
            )}
          </div>
          
          <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-indigo-900 mb-1">Smart Extraction</h4>
            <p className="text-xs text-indigo-700/80 leading-relaxed">
              Upload a picture of your receipt, and our AI will instantly extract all items, quantities, and units for you to review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
