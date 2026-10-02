import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, CheckCircle2, Trash2 } from 'lucide-react';

export default function ShoppingList() {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  
  const fetchItems = () => {
    axios.get('/api/shopping')
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    axios.post('/api/shopping', { name: newItem, required_quantity: 1 })
      .then(() => {
        setNewItem('');
        fetchItems();
      })
      .catch(err => console.error(err));
  };

  const deleteItem = (id: number) => {
    axios.delete(`/api/shopping/${id}`)
      .then(() => fetchItems())
      .catch(err => console.error(err));
  };
  
  const toggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'purchased' ? 'pending' : 'purchased';
    axios.put(`/api/shopping/${id}`, { status: newStatus })
      .then(() => fetchItems())
      .catch(err => console.error(err));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Shopping List</h2>
          <p className="mt-1 text-slate-500">Keep track of what you need to buy.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleAdd} className="flex gap-3">
            <input 
              type="text" 
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder="Add an item to your list..."
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 flex items-center">
              <Plus className="w-5 h-5 mr-1" /> Add
            </button>
          </form>
        </div>
        
        {items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>Your shopping list is empty.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map(item => (
              <li key={item.id} className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${item.status === 'purchased' ? 'opacity-50 bg-slate-50' : ''}`}>
                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleStatus(item.id, item.status)}>
                  <button className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${item.status === 'purchased' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-500'}`}>
                    {item.status === 'purchased' && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                  <span className={`font-medium text-slate-700 ${item.status === 'purchased' ? 'line-through' : ''}`}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">{item.required_quantity} qty</span>
                  <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
