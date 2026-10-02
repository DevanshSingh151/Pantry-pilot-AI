import { useState } from 'react';
import axios from 'axios';
import { Sparkles, Clock, Utensils, AlertCircle } from 'lucide-react';

export default function Recipes() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const generateRecipes = () => {
    setLoading(true);
    setError(false);
    axios.get('/api/recipes/recommend')
      .then(res => {
        setRecipes(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-bold text-indigo-950">Recipes for your pantry</h2>
          <p className="mt-2 text-indigo-800/80">Get smart recommendations prioritizing your expiring ingredients.</p>
          <button 
            onClick={generateRecipes}
            disabled={loading}
            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm shadow-indigo-200 flex items-center disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse flex items-center"><Sparkles className="w-5 h-5 mr-2" /> Generating magic...</span>
            ) : (
              <><Sparkles className="w-5 h-5 mr-2" /> Generate Recommendations</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3" />
          AI recommendations are temporarily unavailable. Please try again later.
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{recipe.name}</h3>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
                    {recipe.difficulty}
                  </span>
                </div>
                
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">{recipe.description}</p>
                
                <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {recipe.prep_time}</span>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center">
                      <Utensils className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                      Uses from pantry
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients_used.map((ing: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">
                          ✓ {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {recipe.missing_ingredients && recipe.missing_ingredients.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Missing Ingredients</h4>
                      <div className="flex flex-wrap gap-2">
                        {recipe.missing_ingredients.map((ing: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
                            • {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm text-slate-600">
                <span className="font-semibold text-indigo-700">Why this?</span> {recipe.reason}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && recipes.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Click the button above to get personalized recipe suggestions based on your pantry.
        </div>
      )}
    </div>
  );
}
