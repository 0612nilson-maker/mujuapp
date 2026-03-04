"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Save, Loader2, TrendingUp, Wallet, Landmark, Home, Building2, ArrowRightLeft } from 'lucide-react';

export default function PropertySettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 狀態管理
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [businessModel, setBusinessModel] = useState<'OWN' | 'SUBLEASE'>('OWN');

  const [finance, setFinance] = useState({
    purchase_price: '0', market_value: '0', loan_balance: '0', monthly_loan_interest: '0',
    setup_cost: '0', master_lease_rent: '0', prepaid_deposits: '0', monthly_expenses: '0'
  });

  useEffect(() => {
    async function fetchProperty() {
      const { data } = await supabase.from('properties').select('*').eq('id', params.id).single();
      if (data) {
        setName(data.name || '');
        setAddress(data.address || '');
        setBusinessModel(data.business_model || 'OWN');
        setFinance({
          purchase_price: data.purchase_price?.toString() || '0',
          market_value: data.market_value?.toString() || '0',
          loan_balance: data.loan_balance?.toString() || '0',
          monthly_loan_interest: data.monthly_loan_interest?.toString() || '0',
          setup_cost: data.setup_cost?.toString() || '0',
          master_lease_rent: data.master_lease_rent?.toString() || '0',
          prepaid_deposits: data.prepaid_deposits?.toString() || '0',
          monthly_expenses: data.monthly_expenses?.toString() || '0'
        });
      }
      setLoading(false);
    }
    fetchProperty();
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('properties').update({
      name,
      address,
      business_model: businessModel,
      purchase_price: Number(finance.purchase_price),
      market_value: Number(finance.market_value),
      loan_balance: Number(finance.loan_balance),
      monthly_loan_interest: Number(finance.monthly_loan_interest),
      setup_cost: Number(finance.setup_cost),
      master_lease_rent: Number(finance.master_lease_rent),
      prepaid_deposits: Number(finance.prepaid_deposits),
      monthly_expenses: Number(finance.monthly_expenses)
    }).eq('id', params.id);

    setSaving(false);
    if (error) {
      alert('更新失敗，請檢查網路連線');
    } else {
      alert('資產設定已更新！✅');
      router.back();
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">資料載入中...</div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/80 backdrop-blur z-10">
        <button type="button" onClick={() => router.back()} className="p-2 active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-[#8E7F74]">資產設定</h1>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleUpdate} className="px-6 py-4 space-y-8">
        
        {/* 1. 基本資訊與模式切換 */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-6">
          <InputGroup label="專案名稱" value={name} onChange={setName} />
          <InputGroup label="詳細地址" value={address} onChange={setAddress} />

          <div className="space-y-2 mt-4">
            <label className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest px-1">營運模式切換</label>
            <div className="flex bg-[#F9F7F5] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setBusinessModel('OWN')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${businessModel === 'OWN' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}
              >
                <Building2 className="w-4 h-4" /> 購置出租
              </button>
              <button
                type="button"
                onClick={() => setBusinessModel('SUBLEASE')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${businessModel === 'SUBLEASE' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}
              >
                <ArrowRightLeft className="w-4 h-4" /> 包租代管
              </button>
            </div>
          </div>
        </div>

        {/* 2. 財務細節 */}
        <div className="space-y-4">
          <div className="bg-[#3E342E] py-4 px-6 rounded-2xl flex items-center gap-3 shadow-md">
            <TrendingUp className="text-[#B5A59B] w-5 h-5" />
            <h2 className="text-white font-black tracking-wider">詳細財務資料</h2>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-6">
            {businessModel === 'OWN' ? (
              <div className="grid grid-cols-1 gap-5 animate-in fade-in">
                <FinanceInput label="購置總價" value={finance.purchase_price} onChange={(v: string) => setFinance({...finance, purchase_price: v})} icon={<Wallet className="w-4 h-4" />} />
                <FinanceInput label="貸款餘額" value={finance.loan_balance} onChange={(v: string) => setFinance({...finance, loan_balance: v})} icon={<Landmark className="w-4 h-4" />} />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 animate-in fade-in">
                <FinanceInput label="裝修成本" value={finance.setup_cost} onChange={(v: string) => setFinance({...finance, setup_cost: v})} icon={<Wallet className="w-4 h-4" />} />
                <FinanceInput label="大租金支出" value={finance.master_lease_rent} onChange={(v: string) => setFinance({...finance, master_lease_rent: v})} icon={<Home className="w-4 h-4" />} />
              </div>
            )}
          </div>
        </div>

        <button disabled={saving} className="w-full h-16 bg-[#3E342E] text-white rounded-[32px] font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
          {saving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />} 儲存變更
        </button>
      </form>
      <div className="h-10"></div>
    </div>
  );
}

// 輔助組件：基本輸入框
function InputGroup({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest px-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-12 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E] transition-all" />
    </div>
  );
}

// 輔助組件：財務專用輸入框 (帶 NT$ 與小圖示)
function FinanceInput({ label, value, onChange, icon }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 mb-1 px-1">
        <span className="text-[#B5A59B]">{icon}</span>
        <label className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest">{label}</label>
      </div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#D1C7C0]">NT$</span>
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-12 bg-[#F9F7F5] rounded-xl pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E] transition-all" />
      </div>
    </div>
  );
}