export interface Profile {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  avatar_url?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number; // Positive is income, negative is expense
  type: "income" | "expense";
  category: string;
  date: string; // YYYY-MM-DD
  observation?: string;
  created_at?: string;
  attachment?: {
    file_name: string;
    file_url: string;
    file_type: string;
  };
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  limit_date: string; // YYYY-MM-DD
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  current_spent: number;
  month_year: string; // YYYY-MM
}

export interface Attachment {
  id: string;
  user_id: string;
  transaction_id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  size_bytes?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: "alert" | "goal" | "spending" | "login";
  is_read: boolean;
  created_at: string;
}

export interface Installment {
  id: string;
  user_id: string;
  product_name: string;
  total_value: number;
  total_installments: number;
  remaining_installments: number;
  value_per_installment: number;
  start_date: string; // YYYY-MM-DD
  category: string;
}

export interface Report {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  generated_at: string;
}
