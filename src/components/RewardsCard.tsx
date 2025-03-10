import React, { useState } from 'react';
import { Coins, ArrowUpRight, ArrowDownRight, Gift, Users, Sparkles } from 'lucide-react';
import type { Transaction, Promotion } from '../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { applyReferralCode } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';

interface RewardsCardProps {
  coins: number;
  transactions: Transaction[];
  referralCode?: string;
  referralCount?: number;
  activePromotions?: Promotion[];
}

const RewardsCard: React.FC<RewardsCardProps> = ({ 
  coins, 
  transactions, 
  referralCode,
  referralCount = 0,
  activePromotions = []
}) => {
  const { currentUser } = useAuth();
  const [referralInput, setReferralInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      await applyReferralCode(currentUser.uid, referralInput.trim());
      setSuccess('Suosituskoodi käytetty onnistuneesti!');
      setReferralInput('');
    } catch (err: any) {
      setError(err.message || 'Virhe suosituskoodin käytössä');
    } finally {
      setLoading(false);
    }
  };

  const formatTransactionDate = (timestamp: any) => {
    // Handle Firestore Timestamp
    if (timestamp && typeof timestamp.toDate === 'function') {
      return format(timestamp.toDate(), "d.M.yyyy 'klo' HH:mm", { locale: fi });
    }
    // Handle regular Date object
    if (timestamp instanceof Date) {
      return format(timestamp, "d.M.yyyy 'klo' HH:mm", { locale: fi });
    }
    // Handle timestamp as seconds
    if (timestamp && timestamp.seconds) {
      return format(new Date(timestamp.seconds * 1000), "d.M.yyyy 'klo' HH:mm", { locale: fi });
    }
    // Fallback
    return 'Invalid date';
  };

  return (
    <div className="space-y-6">
      {/* Coins Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Coins className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Kolikot</h2>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {coins} <span className="text-sm">kolikkoa</span>
          </div>
        </div>

        {/* Welcome Message for New Users */}
        {transactions.length === 1 && transactions[0].description.includes('Tervetuliaislahja') && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-start space-x-3">
              <Gift className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-medium text-blue-900">Tervetuloa bilo.fi -palveluun!</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Olet saanut 10 kolikkoa tervetuliaislahjana. Käytä kolikot alennuksiin tulevissa varauksissa.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Promotions */}
        {activePromotions.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
              Erikoistarjoukset
            </h3>
            <div className="space-y-3">
              {activePromotions.map(promotion => (
                <div key={promotion.id} className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">{promotion.title}</h4>
                  <p className="text-sm text-blue-700 mt-1">{promotion.description}</p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-purple-600">+{promotion.bonusCoins} kolikkoa</span>
                    {promotion.minimumPurchase && (
                      <span className="text-gray-600"> (min. {promotion.minimumPurchase}€)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Viimeisimmät tapahtumat</h3>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Ei tapahtumia</p>
            ) : (
              transactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {transaction.type === 'credit' ? (
                      <div className="p-2 bg-green-100 rounded-full">
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 rounded-full">
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatTransactionDate(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                  <span className={`font-medium ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsCard;
