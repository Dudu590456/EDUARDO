export interface Transaction {
  id: string;
  client?: string;
  type: "receita" | "despesa";
  description: string;
  amount: number;
  date: string;
  category?: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  active: boolean;
}

export interface Installment {
  id: string;
  description: string;
  total_amount: number;
  installments_count: number;
  current_installment: number;
  active: boolean;
  date_started: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  permission: "read" | "write" | "admin";
}

export interface BusinessTransaction {
  id: string;
  client: string;
  type: "receita" | "despesa";
  description: string;
  amount: number;
  date: string;
}

export interface Subscription {
  id: string;
  name: string;
  price: number;
  nextBill: string;
  logo?: string;
  active: boolean;
}
