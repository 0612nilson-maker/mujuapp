"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
// ✅ 修正：把 Wrench (扳手) 圖示補上去了！
import { ArrowLeft, Save, Loader2, TrendingUp, Wallet, Landmark, Home, Building2, ArrowRightLeft, Percent, Calendar, Wifi, Trash2, Droplets, Receipt, ShieldCheck, Wrench } from 'lucide-react';

export default function PropertySettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 基本資訊
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [businessModel, setBusinessModel] = useState<'OWN' | 'SUBLEASE'>('OWN');

  // 超級完整的財務狀態矩陣
  const [finance, setFinance] = useState({
    purchase_price: '0', loan_amount: '0', loan_balance: '0', loan_rate: '0', loan_years: '0', monthly_loan_payment: '0',
    setup_cost: '0', master_lease_rent: '0', deposit_paid: '0', 
    monthly_management_fee: '0', monthly_internet_fee: '0', monthly_trash_fee: '0', monthly_water_fee: '0', monthly_expenses: '0',
    yearly_taxes: '0', market_value: '0'
  });

  useEffect(() => {
    async function fetchProperty() {
      const { data } = await supabase.from('properties').select('*').eq('id', params.id).single();
      if (data) {
        setName(data.name || ''); setAddress(data.address || ''); setBusinessModel(data.business_model || 'OWN');
        setFinance({
          purchase_price: data.purchase_price?.toString() || '0',
          loan_amount: data.loan_amount?.toString() || '0',
          loan_balance: data.loan_balance?.toString() || '0',
          loan_rate: data.loan_rate?.toString() || '0',
          loan_years: data.loan_years?.toString() || '0',
          monthly_loan_payment: data.monthly_loan_payment?.toString() || '0',
          setup_cost: data.setup_cost?.toString() || '0',
          master_lease_rent: data.master_lease_rent?.toString() || '0',
          deposit_paid: data.deposit_paid?.toString() || '0',
          monthly_management_fee: data.monthly_management_fee?.toString() || '0',
          monthly_internet_fee: data.monthly_internet_fee?.toString() || '0',
          monthly_trash_fee: data.monthly_trash_fee?.toString() || '0',
          monthly_water_fee: data.monthly_water_fee?.toString() || '0',
          monthly_expenses: data.monthly_expenses?.toString() || '0',
          yearly_taxes: data.yearly_taxes?.toString() || '0',
          market_value: data.market_value?.toString() || '0'
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
      name, address, business_model: businessModel,
      purchase_price: Number(finance.purchase_price), loan_amount: Number(finance.loan_amount), loan_balance: Number(finance.loan_balance), 
      loan_rate: Number(finance.loan_rate), loan_years: Number(finance.loan_years), monthly_loan_payment: Number(finance.monthly_loan_payment),
      setup_cost: Number(finance.setup_cost), master_lease_rent: Number(finance.master_lease_rent), deposit_paid: Number(finance.deposit_paid),
      monthly_management_fee: Number(finance.monthly_management_fee), monthly_internet_fee: Number(finance.monthly_internet_fee), 
      monthly_trash_fee: Number(finance.monthly_trash_fee), monthly_water_fee: Number(finance.monthly_water_fee), monthly_expenses: Number(finance.monthly_expenses),
      yearly_taxes: Number(finance.yearly_taxes), market_value: Number(finance.market_value)
    }).eq('id', params.id);

    setSaving(false);
    if (error) alert('更新失敗，請檢查網路連線');
    else { alert('資產詳細設定已完美儲存！✅'); router.back(); }
  };

  const updateFinance = (field: string, value: string) => setFinance(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">資料載入中...</div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/80 backdrop-blur z-20">
        <button type="button" onClick={() => router.back()} className="p-2 active:scale-90 transition-all"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-black text-[#8E7F74]">資產設定</h1>
        <div className="w-10"></div>
      </div>

      <form onSubmit={handleUpdate} className="px-6 py-4 space-y-8">
        
        {/* ================= 基本資訊 ================= */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-6">
          <InputGroup label="專案名稱" value={name} onChange={setName} />
          <InputGroup label="詳細地址" value={address} onChange={setAddress} />
          <div className="space-y-2 mt-4">
            <label className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest px-1">營運模式切換</label>
            <div className="flex bg-[#F9F7F5] p-1 rounded-2xl">
              <button type="button" onClick={() => setBusinessModel('OWN')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${businessModel === 'OWN' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}><Building2 className="w-4 h-4" /> 購置出租</button>
              <button type="button" onClick={() => setBusinessModel('SUBLEASE')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${businessModel === 'SUBLEASE' ? 'bg-[#3E342E] text-white shadow-md' : 'text-[#8E7F74]'}`}><ArrowRightLeft className="w-4 h-4" /> 包租代管</button>
            </div>
          </div>
        </div>

        {/* ================= 資本與貸款 ================= */}
        <div className="space-y-4">
          <div className="bg-[#3E342E] py-4 px-6 rounded-2xl flex items-center gap-3 shadow-md"><Landmark className="text-[#B5A59B] w-5 h-5" /><h2 className="text-white font-black tracking-wider">{businessModel === 'OWN' ? '購置與貸款條件' : '包租代管合約成本'}</h2></div>
          <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-6">
            {businessModel === 'OWN' ? (
              <div className="grid grid-cols-2 gap-5 animate-in fade-in">
                <div className="col-span-2"><FinanceInput label="物業購置總價" value={finance.purchase_price} onChange={(v: string) => updateFinance('purchase_price', v)} icon={<Wallet className="w-4 h-4" />} /></div>
                <FinanceInput label="貸款總額" value={finance.loan_amount} onChange={(v: string) => updateFinance('loan_amount', v)} icon={<Landmark className="w-4 h-4" />} />
                <FinanceInput label="目前貸款餘額" value={finance.loan_balance} onChange={(v: string) => updateFinance('loan_balance', v)} icon={<Landmark className="w-4 h-4" />} />
                <PercentInput label="房貸利率 (%)" value={finance.loan_rate} onChange={(v: string) => updateFinance('loan_rate', v)} icon={<Percent className="w-4 h-4" />} />
                <YearInput label="貸款年限 (年)" value={finance.loan_years} onChange={(v: string) => updateFinance('loan_years', v)} icon={<Calendar className="w-4 h-4" />} />
                <div className="col-span-2"><FinanceInput label="每期攤還費用 (本息)" value={finance.monthly_loan_payment} onChange={(v: string) => updateFinance('monthly_loan_payment', v)} icon={<Receipt className="w-4 h-4" />} /></div>
                <div className="col-span-2 border-t border-[#F9F7F5] pt-4"><FinanceInput label="目前市場估值 (選填)" value={finance.market_value} onChange={(v: string) => updateFinance('market_value', v)} icon={<TrendingUp className="w-4 h-4" />} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 animate-in fade-in">
                <div className="col-span-2"><FinanceInput label="每月付房東租金 (大租金)" value={finance.master_lease_rent} onChange={(v: string) => updateFinance('master_lease_rent', v)} icon={<Home className="w-4 h-4" />} /></div>
                <FinanceInput label="押給房東押金" value={finance.deposit_paid} onChange={(v: string) => updateFinance('deposit_paid', v)} icon={<Wallet className="w-4 h-4" />} />
                <FinanceInput label="期初裝修建置費" value={finance.setup_cost} onChange={(v: string) => updateFinance('setup_cost', v)} icon={<Wrench className="w-4 h-4" />} />
              </div>
            )}
          </div>
        </div>

        {/* ================= 每月固定支出 ================= */}
        <div className="space-y-4">
          <div className="bg-[#B5A59B] py-3 px-6 rounded-2xl flex items-center gap-3"><Receipt className="text-white w-5 h-5" /><h2 className="text-white font-black tracking-wider text-sm">每月固定支出 (選填)</h2></div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm grid grid-cols-2 gap-5">
            <FinanceInput label="大樓管理費" value={finance.monthly_management_fee} onChange={(v: string) => updateFinance('monthly_management_fee', v)} icon={<ShieldCheck className="w-4 h-4" />} />
            <FinanceInput label="網路費" value={finance.monthly_internet_fee} onChange={(v: string) => updateFinance('monthly_internet_fee', v)} icon={<Wifi className="w-4 h-4" />} />
            <FinanceInput label="垃圾代收費" value={finance.monthly_trash_fee} onChange={(v: string) => updateFinance('monthly_trash_fee', v)} icon={<Trash2 className="w-4 h-4" />} />
            <FinanceInput label="公水費" value={finance.monthly_water_fee} onChange={(v: string) => updateFinance('monthly_water_fee', v)} icon={<Droplets className="w-4 h-4" />} />
            <div className="col-span-2"><FinanceInput label="其他月雜支總和" value={finance.monthly_expenses} onChange={(v: string) => updateFinance('monthly_expenses', v)} icon={<Receipt className="w-4 h-4" />} /></div>
          </div>
        </div>

        {/* ================= 年度稅費 ================= */}
        <div className="space-y-4">
          <div className="bg-[#EFEBE8] py-3 px-6 rounded-2xl flex items-center gap-3"><Landmark className="text-[#8E7F74] w-5 h-5" /><h2 className="text-[#8E7F74] font-black tracking-wider text-sm">年度固定支出 (選填)</h2></div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm">
            <FinanceInput label="預估年度稅費 (房屋/地價稅)" value={finance.yearly_taxes} onChange={(v: string) => updateFinance('yearly_taxes', v)} icon={<Receipt className="w-4 h-4" />} />
          </div>
        </div>

        <button disabled={saving} className="w-full h-16 bg-[#3E342E] text-white rounded-[32px] font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-8">
          {saving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />} 儲存所有資產設定
        </button>
      </form>
      <div className="h-10"></div>
    </div>
  );
}

// ==========================================
// 輔助 UI 元件庫 (✅ 完全修復 TypeScript 型別)
// ==========================================

interface CustomInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

function InputGroup({ label, value, onChange }: CustomInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest px-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-12 bg-[#F9F7F5] rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E] transition-all" />
    </div>
  );
}

function FinanceInput({ label, value, onChange, icon }: CustomInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 mb-1 px-1 text-[#B5A59B]">
        {icon} <label className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest">{label}</label>
      </div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#D1C7C0]">NT$</span>
        <input type="number" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="0" className="w-full h-12 bg-[#F9F7F5] rounded-xl pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E] transition-all" />
      </div>
    </div>
  );
}

function PercentInput({ label, value, onChange, icon }: CustomInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 mb-1 px-1 text-[#B5A59B]">
        {icon} <label className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest">{label}</label>
      </div>
      <div className="relative">
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#D1C7C0]">%</span>
        <input type="number" step="0.01" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="0.00" className="w-full h-12 bg-[#F9F7F5] rounded-xl pl-4 pr-8 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E] transition-all" />
      </div>
    </div>
  );
}

function YearInput({ label, value, onChange, icon }: CustomInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 mb-1 px-1 text-[#B5A59B]">
        {icon} <label className="text-[10px] font-black text-[#8E7F74] uppercase tracking-widest">{label}</label>
      </div>
      <div className="relative">
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#D1C7C0]">年</span>
        <input type="number" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="0" className="w-full h-12 bg-[#F9F7F5] rounded-xl pl-4 pr-8 text-sm font-bold outline-none focus:ring-2 focus:ring-[#3E342E] transition-all" />
      </div>
    </div>
  );
}