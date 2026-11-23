export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  coins: number;
  referral_code: string;
  referred_by: string | null;
  last_checkin: string | null;
  is_admin: boolean;
  created_at: string;
}

export type TransactionType = 'survey' | 'checkin' | 'referral' | 'signup_bonus' | 'withdrawal' | 'refund';
export type TransactionStatus = 'completed' | 'reversed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  user_id: string;
  trans_id: string;
  type: TransactionType;
  amount_coins: number;
  status: TransactionStatus;
  created_at: string;
}

export type WithdrawalStatus = 'pending' | 'paid' | 'rejected';

export interface Withdrawal {
  id: string;
  user_id: string;
  upi_id: string;
  coins: number;
  amount_inr: number;
  status: WithdrawalStatus;
  created_at: string;
  profile?: Profile;
}

export interface AdminStats {
  totalUsers: number;
  totalCoinsDistributed: number;
  pendingPayoutsInr: number;
  totalWithdrawalsCount: number;
}
