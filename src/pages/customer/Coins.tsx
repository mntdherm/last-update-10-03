import React from 'react';
import CustomerLayout from './Layout';
import RewardsCard from '../../components/RewardsCard';
import { useAuth } from '../../contexts/AuthContext';
import { getUser } from '../../lib/db';

const CustomerCoins = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = React.useState<any>(null);

  React.useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const user = await getUser(currentUser.uid);
        setUserData(user);
      }
    };
    loadUserData();
  }, [currentUser]);

  return (
    <CustomerLayout>
      {userData?.wallet && (
        <RewardsCard
          coins={userData.wallet.coins}
          transactions={userData.wallet.transactions}
          referralCode={userData.referralCode}
          referralCount={userData.referralCount}
        />
      )}
    </CustomerLayout>
  );
};

export default CustomerCoins;
