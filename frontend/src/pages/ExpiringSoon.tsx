import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ClockAlert, ChefHat, ShoppingCart } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function ExpiringSoon() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/items')
      .then(res => {
        const today = new Date();
        const expiring = res.data.filter((item: any) => {
          if (!item.expiry_date || item.quantity <= 0) return false;
          const days = differenceInDays(parseISO(item.expiry_date), today);
          return days <= 7;
        }).sort((a: any, b: any) => 
          new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        );
        setItems(expiring);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Use these first</h2>
        <p className="mt-1 text-slate-500">Items that are expiring within the next 7 days.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const daysLeft = differenceInDays(parseISO(item.expiry_date), new Date());
            const isExpired = daysLeft < 0;
            
            return (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${isExpired ? 'bg-red-500' : daysLeft <= 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                
                <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{item.quantity} {item.unit}</p>
                
                <div className="mt-4 flex items-center gap-2">
                  <ClockAlert className={`w-4 h-4 ${isExpired ? 'text-red-500' : 'text-amber-500'}`} />
                  <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                    {isExpired ? 'Expired' : `Expires in ${daysLeft} days`}
                  </span>
                </div>

                <div className="mt-6 flex gap-2">
                  <Link to="/recipes" className="flex-1 flex justify-center items-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                    <ChefHat className="w-4 h-4 mr-2" /> Find Recipe
                  </Link>
                  <button className="flex-1 flex justify-center items-center px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                    <ShoppingCart className="w-4 h-4 mr-2" /> Buy More
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClockAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Your pantry is looking good!</h3>
          <p className="text-slate-500 mt-2">No items are close to expiry.</p>
        </div>
      )}
    </div>
  );
}
