import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import { addFeedback } from '../lib/db';
import type { Appointment } from '../types/database';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onClose, appointment }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Valitse arvosana');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addFeedback(appointment.id, { rating, comment });
      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Virhe palautteen lähetyksessä');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-gray-900">Anna palautetta</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kuinka tyytyväinen olit palveluun?
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`p-2 rounded-full transition-colors ${
                      rating >= value ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kommentti (valinnainen)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Kerro kokemuksestasi..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Lähetetään...' : 'Lähetä palaute'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FeedbackDialog;
