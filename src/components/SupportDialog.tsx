import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupportDialog } from '../contexts/SupportContext';
import { createSupportTicket } from '../lib/db';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';

interface SupportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'customer' | 'vendor';
}

const SupportDialog: React.FC<SupportDialogProps> = ({ isOpen, onClose, userRole }) => {
  const { currentUser } = useAuth();
  const { defaultSubject } = useSupportDialog();
  const [subject, setSubject] = useState(defaultSubject || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update subject when defaultSubject changes
  useEffect(() => {
    setSubject(defaultSubject || '');
  }, [defaultSubject]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      await createSupportTicket({
        userId: currentUser.uid,
        userRole,
        subject,
        message,
        responses: []
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSubject('');
        setMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error creating support ticket:', err);
      setError('Virhe tukipyynnön lähetyksessä');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl w-full max-w-lg transform transition-all animate-[iosScale_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] shadow-2xl border border-white/20">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Ota yhteyttä tukeen
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white/80 rounded-full transition-all active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-[bounce_1s_ease-in-out_infinite] text-white">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Tukipyyntö lähetetty!</h3>
              <p className="text-gray-600 mt-2">Vastaamme sinulle mahdollisimman pian.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Aihe</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition-all ${defaultSubject ? 'bg-gray-100' : ''} placeholder-gray-400`}
                  readOnly={!!defaultSubject}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Viesti</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50 focus:bg-white transition-all resize-none placeholder-gray-400"
                  required
                  placeholder="Kerro, miten voimme auttaa..."
                />
              </div>

              {error && (
                <div className="bg-red-50 rounded-xl border border-red-100 p-4 animate-[fadeIn_0.2s_ease-out]">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                >
                  Peruuta
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center transform transition-all active:scale-95 shadow-lg font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Lähetetään...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Lähetä
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportDialog;
