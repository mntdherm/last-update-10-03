import React, { useState } from 'react';
import { X, Coins, Plus, Minus, AlertCircle, Loader2 } from 'lucide-react';
import type { User } from '../types/database';
import { addCoinsToUser } from '../lib/db';

interface CoinManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onCoinsUpdated: () => void;
}

const CoinManagementDialog: React.FC<CoinManagementDialogProps> = ({
  isOpen,
  onClose,
  user,
  onCoinsUpdated
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !description) {
      setError('Täytä kaikki kentät');
      return;
    }

    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Virheellinen määrä');
      return;
    }

    if (operation === 'remove' && numAmount > user.wallet.coins) {
      setError('Käyttäjällä ei ole tarpeeksi kolikoita');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await addCoinsToUser(
        user.id,
        operation === 'add' ? numAmount : -numAmount,
        `${operation === 'add' ? 'Lisätty' : 'Vähennetty'} ylläpidon toimesta: ${description}`
      );

      onCoinsUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating coins:', err);
      setError('Virhe kolikoiden päivityksessä');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Coins className="w-6 h-6 text-yellow-500 mr-2" />
              <h2 className="text-xl font-bold">Hallitse kolikoita</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Nykyinen saldo</span>
              <span className="font-medium text-gray-900">{user.wallet.coins} kolikkoa</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Toiminto</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setOperation('add')}
                  className={`p-3 rounded-lg flex items-center justify-center transition-all
                    ${operation === 'add'
                      ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Lisää
                </button>
                <button
                  type="button"
                  onClick={() => setOperation('remove')}
                  className={`p-3 rounded-lg flex items-center justify-center transition-all
                    ${operation === 'remove'
                      ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Minus className="w-5 h-5 mr-2" />
                  Vähennä
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Määrä</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500"
                placeholder="Syötä määrä"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kuvaus</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500"
                placeholder="Syötä kuvaus"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Peruuta
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white font-medium flex items-center
                  ${operation === 'add' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Käsitellään...
                  </>
                ) : (
                  <>
                    {operation === 'add' ? (
                      <Plus className="w-5 h-5 mr-2" />
                    ) : (
                      <Minus className="w-5 h-5 mr-2" />
                    )}
                    {operation === 'add' ? 'Lisää kolikot' : 'Vähennä kolikot'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoinManagementDialog;
