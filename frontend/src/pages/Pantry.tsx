import { useState, useEffect } from 'react';
import axios from 'axios';
import { differenceInDays, parseISO } from 'date-fns';
import { Package, Trash2, Edit2, Search } from 'lucide-react';

export default function Pantry() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchItems = () => {
    axios.get('/api/items')
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const deleteItem = (id: number) => {
    if(confirm('Are you sure you want to delete this item?')) {
      axios.delete(`/api/items/${id}`)
        .then(() => fetchItems())
        .catch(err => console.error(err));
    }
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Pantry</h2>
          <p className="mt-1 text-slate-500">Manage everything you currently have.</p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search pantry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64 shadow-sm"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No items yet</h3>
          <p className="text-slate-500 mt-1 mb-6">Start by adding your first item to the pantry.</p>
          <a href="/add" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium shadow-sm">
            + Add Item
          </a>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                let statusBadge = <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200">Fresh</span>;
                
                if (item.quantity <= item.min_stock_level) {
                   statusBadge = <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium border border-orange-200">Low Stock</span>;
                }
                
                if (item.expiry_date) {
                  const days = differenceInDays(parseISO(item.expiry_date), new Date());
                  if (days < 0) {
                    statusBadge = <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium border border-red-200">Expired</span>;
                  } else if (days <= 7) {
                    statusBadge = <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium border border-amber-200">Expiring Soon</span>;
                  }
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-slate-500">{item.category?.name || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4">{statusBadge}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
