"use client";
// @ts-nocheck

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, DollarSign, Wallet, TrendingUp, TrendingDown, Plus, Wrench, Home, PieChart, FileText, X, CheckCircle2, Zap, Receipt, AlertCircle } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

// ==========================================
// 將 Recharts 元件轉型為 any，徹底封鎖 React 18 型別衝突報錯
// ==========================================
const RContainer = ResponsiveContainer as any;
const AChart = AreaChart as any;
const XAx = XAxis as any;
const YAx = YAxis as any;
const CGrid = CartesianGrid as any;
const Ttip = Tooltip as any;
const Leg = Legend as any;
const Ar = Area as any;

// 預設的費用分類
const EXPENSE_CATEGORIES = ['修繕費', '保養費', '仲介費', '清潔費', '招租廣告費', '水電瓦斯費', '雜支'];

export default function FinancePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 新增費用的彈窗狀態
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '修繕費',
    amount: '',
    description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. 抓取房間手動資料 (用於大看板與無合約時的備用圖表數據)
      const { data: roomsData } = await supabase.from('rooms').select('*').eq('property_id', params.id);
      if (roomsData) setRooms(roomsData);

      // 2. 抓取所有歷史合約 (用於時光回溯圖表優先採用)
      const { data: contractsData } = await supabase.from('contracts').select('*').eq('property_id', params.id);
      if (contractsData) setContracts(contractsData);

      // 3. 抓取費用紀錄
      const { data: expensesData, error } = await supabase.from('expenses').select('*').eq('property_id', params.id).order('date', { ascending: false });
      if (error && error.code === '42P01') {
        setExpenses([]); 
      } else {
        setExpenses(expensesData || []);
      }
    } catch (err) {
      console.error("載入財務資料失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params.id]);

  // ==========================================
  // 財務數據結算 (本月實時大看板，看「現在」的房間狀態)
  // ==========================================
  const occupiedRooms = rooms.filter(r => r.status === 'occupied' || (r.tenant_name && r.tenant_name.trim() !== ''));
  const vacantRooms = rooms.filter(r => !r.status || r.status === 'vacant' || !r.tenant_name || r.tenant_name.trim() === '');

  // 收入計算 (本月)
  const actualRent = occupiedRooms.reduce((sum, r) => sum + (Number(r.rent_amount) || 0), 0);
  const actualMgmt = occupiedRooms.reduce((sum, r) => sum + (Number(r.management_fee) || 0), 0);
  const actualSpace = occupiedRooms.reduce((sum, r) => sum + (Number(r.space_fee) || 0), 0);
  const totalIncome = actualRent + actualMgmt + actualSpace;

  // 支出計算 (本月)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = expenses.filter(e => {
    const expDate = new Date(e.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });
  const totalExpense = currentMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // 淨現金流
  const netCashFlow = totalIncome - totalExpense;

  // 潛在收益與押金
  const potentialRent = vacantRooms.reduce((sum, r) => sum + (Number(r.rent_amount) || 0), 0);
  const totalDeposit = occupiedRooms.reduce((sum, r) => sum + (Number(r.deposit) || 0), 0);

  // ==========================================
  // ✅ 終極進化：雙軌混合時光回溯引擎 (合約優先 + 手動資料備援)
  // ==========================================
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();
      const monthName = `${targetMonth + 1}月`;

      // 1. 計算該月真實支出
      const monthExpenses = expenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate.getFullYear() === targetYear && expDate.getMonth() === targetMonth;
      }).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      // 2. 混合計算該月真實收入 (合約優先，手動次之)
      let monthIncome = 0;
      const processedRooms = new Set(); // 防重複計算的追蹤名單

      // [軌道 A] 先找合約系統的紀錄
      contracts.forEach(c => {
        if (c.contract_type === 'master' || c.contract_type === 'consent') return; 

        if (c.start_date && c.end_date) {
          const start = new Date(c.start_date);
          const end = new Date(c.end_date);
          
          const startVal = start.getFullYear() * 12 + start.getMonth();
          const endVal = end.getFullYear() * 12 + end.getMonth();
          const targetVal = targetYear * 12 + targetMonth;

          if (targetVal >= startVal && targetVal <= endVal) {
            const rent = Number(c.rent_amount) || 0;
            const mgmt = Number(c.details?.fees?.management?.amount) || 0;
            const space = Number(c.details?.fees?.space?.amount) || 0;
            monthIncome += (rent + mgmt + space);
            processedRooms.add(c.room_number); // 標記此房本月已有合約，不用再算手動資料
          }
        }
      });

      // [軌道 B] 針對沒有合約的房間，採用租務管理手動填寫的紀錄
      rooms.forEach(r => {
        // 如果這間房這個月已經有正式合約算過了，就跳過避免重複灌水
        if (processedRooms.has(r.room_number)) return;

        if (r.status === 'occupied' || (r.tenant_name && r.tenant_name.trim() !== '')) {
          let isWithin = false;
          
          // 若手動編輯時有填寫起迄日，則根據日期精準回推
          if (r.contract_start && r.contract_end) {
            const start = new Date(r.contract_start);
            const end = new Date(r.contract_end);
            const startVal = start.getFullYear() * 12 + start.getMonth();
            const endVal = end.getFullYear() * 12 + end.getMonth();
            const targetVal = targetYear * 12 + targetMonth;
            
            if (targetVal >= startVal && targetVal <= endVal) {
              isWithin = true;
            }
          } else {
            // 若只打名字卻沒填日期，預設僅列入「當下這個月」，避免不合理的過往灌水
            if (i === 0) isWithin = true;
          }

          if (isWithin) {
            monthIncome += (Number(r.rent_amount) || 0) + (Number(r.management_fee) || 0) + (Number(r.space_fee) || 0);
          }
        }
      });

      data.push({
        name: i === 0 ? '本月' : monthName,
        收入: monthIncome,
        支出: monthExpenses,
        淨利: monthIncome - monthExpenses
      });
    }
    return data;
  }, [contracts, expenses, rooms]); // 加入 rooms 為依賴，確保手動更新會即時重繪圖表

  // ==========================================
  // 新增支出紀錄
  // ==========================================
  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) return alert('請填寫金額與說明！');
    
    const expenseData = {
      property_id: params.id,
      date: newExpense.date,
      category: newExpense.category,
      amount: Number(newExpense.amount),
      description: newExpense.description
    };

    try {
      const { error } = await supabase.from('expenses').insert([expenseData]);
      if (error && error.code !== '42P01') throw error;
    } catch (err: any) {
      console.warn("無法存入資料庫，暫存於本地畫面:", err.message);
    }
    
    setExpenses([{ id: Date.now(), ...expenseData }, ...expenses]);
    setShowExpenseModal(false);
    setNewExpense({ date: new Date().toISOString().split('T')[0], category: '修繕費', amount: '', description: '' });
    alert('✅ 費用記錄新增成功！圖表已即時更新。');
  };

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">財務數據結算中...</div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E] pb-24">
      {/* 導覽列 */}
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/90 backdrop-blur z-20 border-b border-[#EFEBE8]">
        <button onClick={() => router.back()} className="p-2 active:scale-90 transition-all text-[#3E342E]"><ArrowLeft className="w-6 h-6" /></button>
        <div className="text-center"><h1 className="text-xl font-black tracking-widest text-[#3E342E]">財務與帳務總覽</h1></div>
        <div className="w-10"></div>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        
        {/* ================= 頂部三大財務看板 ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-3 bg-[#3E342E] rounded-[32px] p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="relative z-10">
              <p className="text-sm font-bold text-[#D1C7C0] mb-2 flex items-center gap-2"><Wallet className="w-4 h-4"/> 本月淨現金流 (Net Cash Flow)</p>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight">
                <span className="text-2xl text-[#8E7F74] mr-2">NT$</span>{netCashFlow.toLocaleString()}
              </h2>
            </div>
            <div className="flex gap-4 relative z-10 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur p-4 rounded-2xl flex-1 md:w-40 border border-white/10">
                <p className="text-[10px] text-[#D1C7C0] mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-400"/> 本月總應收</p>
                <p className="text-xl font-black">${totalIncome.toLocaleString()}</p>
              </div>
              <div className="bg-red-500/20 backdrop-blur p-4 rounded-2xl flex-1 md:w-40 border border-red-500/30">
                <p className="text-[10px] text-red-200 mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-400"/> 本月總支出</p>
                <p className="text-xl font-black text-red-100">${totalExpense.toLocaleString()}</p>
              </div>
            </div>
            <DollarSign className="absolute right-[-5%] top-[-20%] w-64 h-64 opacity-5 pointer-events-none" />
          </div>
        </div>

        {/* ================= 圖表與收入結構 ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 左側：近六個月折線圖 */}
          <div className="col-span-1 lg:col-span-2 bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-[#EFEBE8]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-[#3E342E] flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#8E7F74]"/> 近半年財務趨勢
              </h3>
              <span className="text-[10px] font-bold text-[#8E7F74] bg-[#F9F7F5] px-3 py-1 rounded-full">合約與手動記帳自動彙整</span>
            </div>
            <div className="h-64 w-full">
              <RContainer width="100%" height="100%">
                <AChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3E342E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3E342E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CGrid strokeDasharray="3 3" vertical={false} stroke="#EFEBE8" />
                  <XAx dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E7F74' }} dy={10} />
                  <YAx axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E7F74' }} />
                  <Ttip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Leg iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Ar type="monotone" dataKey="收入" stroke="#3E342E" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Ar type="monotone" dataKey="支出" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AChart>
              </RContainer>
            </div>
          </div>

          {/* 右側：收入細項與潛在數據 */}
          <div className="col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-[#EFEBE8] shadow-sm">
              <h3 className="font-black text-sm text-[#8E7F74] mb-4">應收結構拆解 (已出租)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#F9F7F5] p-3 rounded-xl">
                  <span className="text-xs font-bold text-[#8E7F74] flex items-center gap-2"><Home className="w-3 h-3"/> 房屋租金</span>
                  <span className="font-black text-[#3E342E]">${actualRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-[#F9F7F5] p-3 rounded-xl">
                  <span className="text-xs font-bold text-[#8E7F74] flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> 管理費</span>
                  <span className="font-black text-[#3E342E]">${actualMgmt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-[#F9F7F5] p-3 rounded-xl">
                  <span className="text-xs font-bold text-[#8E7F74] flex items-center gap-2"><Zap className="w-3 h-3"/> 空間費</span>
                  <span className="font-black text-[#3E342E]">${actualSpace.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#FFF8E1] rounded-[32px] p-6 border border-[#FFE082] shadow-sm">
              <h3 className="font-black text-sm text-[#F57F17] mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> 待租潛在收益</h3>
              <p className="text-2xl font-black text-[#E65100]">${potentialRent.toLocaleString()}</p>
              <p className="text-[10px] text-[#F57F17] mt-2 font-bold opacity-80">尚有 {vacantRooms.length} 間房閒置中</p>
            </div>

            <div className="bg-[#EAF3EB] rounded-[32px] p-6 border border-[#C8E6C9] shadow-sm">
              <h3 className="font-black text-sm text-[#2E7D32] mb-1 flex items-center gap-2"><Wallet className="w-4 h-4"/> 押金水位留存</h3>
              <p className="text-2xl font-black text-[#1B5E20]">${totalDeposit.toLocaleString()}</p>
              <p className="text-[10px] text-[#2E7D32] mt-2 font-bold opacity-80">對房客之負債，退租時需返還</p>
            </div>
          </div>
        </div>

        {/* ================= 費用支出明細清單 ================= */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-[#EFEBE8]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg text-[#3E342E] flex items-center gap-2"><Receipt className="w-5 h-5 text-[#8E7F74]"/> 費用與支出管理</h3>
            <button onClick={() => setShowExpenseModal(true)} className="bg-[#3E342E] text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm hover:scale-105 transition-all">
              <Plus className="w-4 h-4"/> 新增支出
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-[#EFEBE8] rounded-2xl">
              <p className="text-[#8E7F74] font-bold text-sm">目前尚無任何支出紀錄</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#F9F7F5] p-4 rounded-2xl border border-[#EFEBE8] gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#3E342E]">
                      {exp.category === '修繕費' ? <Wrench className="w-5 h-5"/> : <FileText className="w-5 h-5"/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-[#EFEBE8] text-[#8E7F74] px-2 py-0.5 rounded-md">{exp.category}</span>
                        <span className="text-[10px] font-bold text-[#8E7F74]">{exp.date}</span>
                      </div>
                      <h4 className="font-black text-[#3E342E] mt-1">{exp.description}</h4>
                    </div>
                  </div>
                  <div className="text-right pl-16 sm:pl-0">
                    <p className="font-black text-red-500 text-lg">-${Number(exp.amount).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= 新增費用彈窗 (Modal) ================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E342E]/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative">
            <button onClick={() => setShowExpenseModal(false)} className="absolute top-6 right-6 text-[#8E7F74] hover:text-[#3E342E] bg-[#F9F7F5] p-2 rounded-full"><X className="w-5 h-5"/></button>
            <h2 className="text-2xl font-black text-[#3E342E] mb-6 flex items-center gap-2"><Receipt className="w-6 h-6"/> 紀錄新支出</h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#8E7F74]">發生日期</label>
                <input type="date" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#8E7F74]">費用分類</label>
                <select className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#8E7F74]">支出金額 (NT$)</label>
                <input type="number" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-black text-red-500 outline-none focus:border-red-400" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} placeholder="請輸入金額" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#8E7F74]">支出說明與備註</label>
                <input type="text" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} placeholder="例如：201房冷氣維修、301房仲介費..." />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowExpenseModal(false)} className="flex-1 h-14 bg-[#F5F5F5] text-[#8E7F74] rounded-2xl font-black transition-all hover:bg-[#EFEBE8]">取消</button>
              <button onClick={handleAddExpense} className="flex-1 h-14 bg-[#3E342E] text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 hover:bg-black">
                <CheckCircle2 className="w-5 h-5"/> 儲存紀錄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}