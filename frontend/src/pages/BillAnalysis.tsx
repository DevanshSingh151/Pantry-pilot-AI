import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Save, Trash2 } from 'lucide-react';

export default function BillAnalysis() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('billAnalysis');
    if (data) {
      setItems(JSON.parse(data));
    } else {
      navigate('/add');
    }
  }, [navigate]);

  const handleSaveAll = async () => {
    try {
      for (const item of items) {
        if (!item.selected) continue;
        await axios.post('/api/items', {
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit || 'pcs',
          min_stock_level: 0
        });
      }
      localStorage.removeItem('billAnalysis');
      navigate('/pantry');
    } catch (err) {
      console.error(err);
      alert("Failed to save items.");
    }
  };

  const toggleSelect = (index: number) => {
    const newItems = [...items];
    newItems[index].selected = !newItems[index].selected;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Default select all on load
  useEffect(() => {
    if (items.length > 0 && items[0].selected === undefined) {
      setItems(items.map(i => ({ ...i, selected: true })));
    }
  }, [items]);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bill Analysis Complete</h2>
          <p className="mt-1 text-slate-500">We extracted these items from your receipt. Review and save them to your pantry.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/add')} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
            Discard
          </button>
          <button onClick={handleSaveAll} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Save Selected to Pantry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 w-12 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 inline" />
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Name</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price (Est.)</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx} className={`hover:bg-slate-50 transition-colors ${!item.selected ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={item.selected || false} 
                    onChange={() => toggleSelect(idx)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    value={item.name} 
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-slate-900" 
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number" 
                    step="0.01"
                    value={item.quantity} 
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))}
                    className="w-20 bg-transparent border-none focus:ring-0 p-0 text-slate-700" 
                  />
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={item.unit || 'pcs'} 
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    className="bg-transparent border-none focus:ring-0 p-0 text-slate-700"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-slate-500 font-medium">
                  {item.price ? `$${item.price}` : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => removeItem(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {items.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No items extracted from the bill.
          </div>
        )}
      </div>
    </div>
  );
}
