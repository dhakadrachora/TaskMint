export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone?: string | null;
  avatar_url: string | null;
  coins: number;
  commission_coins?: number;
  referral_code: string;
  referred_by: string | null;
  last_checkin: string | null;
  is_admin: boolean;
  is_banned?: boolean;
  ban_reason?: string | null;
  created_at: string;
}

export type TransactionType = 'survey' | 'checkin' | 'referral' | 'signup_bonus' | 'withdrawal' | 'refund' | 'smm_order';
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
export type WalletType = 'earning' | 'commission';

export interface Withdrawal {
  id: string;
  user_id: string;
  upi_id: string;
  coins: number;
  amount_inr: number;
  status: WithdrawalStatus;
  wallet_type?: WalletType;
  created_at: string;
  profile?: Profile;
}

export type SmmOrderStatus = 'Pending' | 'In progress' | 'Completed' | 'Partial' | 'Canceled' | 'Processing';

export interface SmmOrder {
  id: string;
  user_id: string;
  provider_order_id: string;
  service_id: number;
  link: string;
  quantity: number;
  charge_coins: number;
  charge_inr: number;
  status: SmmOrderStatus | string;
  start_count: string | null;
  remains: string | null;
  estimated_time: string;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalCoinsDistributed: number;
  pendingPayoutsInr: number;
  totalWithdrawalsCount: number;
  totalBannedUsers?: number;
  totalSmmOrdersCount?: number;
  totalSmmCoinsCharged?: number;
  openSupportTicketsCount?: number;
}

export type SupportTicketCategory = 'withdrawal' | 'survey' | 'views' | 'account' | 'other';
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  admin_reply?: string | null;
  admin_replied_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    phone?: string | null;
    coins: number;
    commission_coins?: number;
  };
}
