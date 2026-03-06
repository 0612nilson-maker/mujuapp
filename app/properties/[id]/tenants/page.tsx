"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { ArrowLeft, Plus, Phone, Calendar, Info, LogOut, Home, CheckCircle2, Zap, Search, User, X, Calculator, AlertTriangle, FileText, FileSignature, History } from 'lucide-react';

export default function TenantsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomContracts, setRoomContracts] = useState<string[]>([]);
  const [pastTenants, setPastTenants] = useState<any[]>([]); // ✅ 新增：歷史房客名單
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [checkoutRoom, setCheckoutRoom] = useState<any | null>(null);
  const [checkoutContract, setCheckoutContract] = useState<any | null>(null);
  const [checkoutDate, setCheckoutDate] = useState('');
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [deductionReason, setDeductionReason] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const [showArchive, setShowArchive] = useState(false); // ✅ 新增：控制歷史房客彈窗

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, contractsRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('property_id', params.id).order('room_number', { ascending: true }),
        supabase.from('contracts').select('*').eq('property_id', params.id).order('created_at', { ascending: false })
      ]);

      if (roomsRes.error) throw roomsRes.error;
      
      const fetchedRooms = roomsRes.data || [];
      setRooms(fetchedRooms);
      
      // 判斷哪些房間已經有合約
      setRoomContracts(contractsRes.data?.map(c => c.room_number) || []);

      // ✅ 智慧比對引擎：找出「曾經簽約過，但現在不在房間裡」的歷史房客
      if (contractsRes.data) {
        const activeSignatures = fetchedRooms.map(r => `${r.room_number}-${r.tenant_name}`);
        const archived = contractsRes.data.filter(c => 
          c.contract_type !== 'master' && 
          c.contract_type !== 'consent' && 
          !activeSignatures.includes(`${c.room_number}-${c.tenant_name}`)
        );
        setPastTenants(archived);
      }

    } catch (error) { 
      console.error('Error fetching data:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const handleOpenCheckout = async (room: any) => {
    setCheckoutRoom(room);
    setCheckoutDate(new Date().toISOString().split('T')[0]); 
    setDeductionAmount(0);
    setDeductionReason('');
    setCheckoutContract(null);

    try {
      const { data } = await supabase
        .from('contracts')
        .select('*')
        .eq('property_id', params.id)
        .eq('room_number', room.room_number)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setCheckoutContract(data[0]);
      }
    } catch (err) {
      console.error("無法載入合約資訊", err);
    }
  };

  const submitCheckout = async () => {
    if (!checkoutRoom) return;
    setIsCheckingOut(true);
    
    try {
      const { error } = await supabase.from('rooms').update({
        tenant_name: null, 
        phone: null, 
        contract_start: null, 
        contract_end: null
      }).eq('id', checkoutRoom.id);

      if (error) throw error;
      
      const baseDeposit = checkoutContract?.deposit_amount || checkoutRoom.deposit || 0;
      const finalRefund = baseDeposit - deductionAmount;
      
      alert(`✅ ${checkoutRoom.room_number} 房已成功退租！\n\n結算資訊：\n退租日期：${checkoutDate}\n扣款金額：$${deductionAmount.toLocaleString()} (${deductionReason || '無'})\n應退還押金：$${finalRefund.toLocaleString()}`);
      
      setCheckoutRoom(null);
      fetchData(); 
    } catch (error: any) { 
      alert(`退租處理失敗：${error.message}`); 
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSaveRoomEdit = async () => {
    if (!editingRoom) return;
    try {
      const { error } = await supabase.from('rooms').update({
        tenant_name: editingRoom.tenant_name, 
        phone: editingRoom.phone,
        rent_amount: editingRoom.rent_amount, 
        deposit: editingRoom.deposit,
        management_fee: editingRoom.management_fee || 0,
        space_fee: editingRoom.space_fee || 0,
        contract_start: editingRoom.contract_start, 
        contract_end: editingRoom.contract_end
      }).eq('id', editingRoom.id);

      if (error) throw error;
      alert('房間資料已更新！');
      setEditingRoom(null); 
      fetchData(); 
    } catch (err: any) { alert(`更新失敗: ${err.message}`); }
  };

  const filteredRooms = rooms.filter(room => 
    room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.tenant_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">資料載入中...</div>;

  const currentDeposit = checkoutContract?.deposit_amount || checkoutRoom?.deposit || 0;
  const refundAmount = currentDeposit - deductionAmount;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E] pb-20">
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/90 backdrop-blur z-20 border-b border-[#EFEBE8]">
        <button onClick={() => router.back()} className="p-2 active:scale-90 transition-all text-[#3E342E]"><ArrowLeft className="w-6 h-6" /></button>
        <div className="text-center"><h1 className="text-xl font-black tracking-widest text-[#3E342E]">租務管理</h1></div>
        <button onClick={() => router.push(`/properties/${params.id}/contracts`)} className="bg-[#3E342E] p-3 rounded-full text-white shadow-lg active:scale-95 transition-all"><Plus className="w-6 h-6" /></button>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        
        {/* ✅ 搜尋列與歷史房客按鈕 */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative group w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D1C7C0] group-focus-within:text-[#3E342E] transition-colors" />
            <input 
              type="text" placeholder="搜尋房號、現任租客姓名..." 
              className="w-full h-14 bg-white border border-[#EFEBE8] rounded-[20px] pl-12 pr-6 text-sm font-bold shadow-sm outline-none focus:border-[#3E342E] transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowArchive(true)} 
            className="w-full md:w-auto h-14 bg-[#EFEBE8] text-[#3E342E] px-6 rounded-[20px] text-sm font-black flex items-center justify-center gap-2 hover:bg-[#D1C7C0] transition-colors shadow-sm"
          >
            <History className="w-5 h-5"/> 歷史房客檔案庫
            {pastTenants.length > 0 && <span className="bg-[#3E342E] text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{pastTenants.length}</span>}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => {
            const isOccupied = room.tenant_name && room.tenant_name.trim() !== '';
            const hasContract = roomContracts.includes(room.room_number);

            return (
              <div key={room.id} className={`bg-white rounded-[48px] p-8 shadow-sm border transition-all hover:shadow-md ${!isOccupied ? 'border-[#EFEBE8]' : 'border-l-[12px] border-[#EFEBE8] border-l-[#3E342E]'}`}>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center font-black text-xl shadow-inner ${isOccupied ? 'bg-[#3E342E] text-white' : 'bg-[#F5F5F5] text-[#8E7F74]'}`}>
                      {room.room_number}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-black ${isOccupied ? 'text-[#3E342E]' : 'text-[#8E7F74]'}`}>{room.tenant_name || '待租中'}</h2>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter mt-1 inline-block ${isOccupied ? 'bg-[#EAF3EB] text-[#2E7D32]' : 'bg-[#F5F5F5] text-[#D1C7C0]'}`}>
                        {isOccupied ? '已出租 OCCUPIED' : '待租中 VACANT'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 mb-6">
                  {isOccupied && (
                    <button onClick={() => handleOpenCheckout(room)} className="bg-red-50 text-red-500 px-4 py-2 rounded-2xl text-xs font-black hover:bg-red-100 transition-colors flex items-center gap-1">
                      <LogOut className="w-3 h-3"/> 退租
                    </button>
                  )}
                  {hasContract ? (
                    <button onClick={() => router.push(`/properties/${params.id}/contracts`)} className="bg-[#EFEBE8] text-[#3E342E] px-4 py-2 rounded-2xl text-xs font-black hover:bg-[#D1C7C0] transition-colors flex items-center gap-1">
                      <FileText className="w-3 h-3"/> 檢視合約
                    </button>
                  ) : (
                    <button onClick={() => router.push(`/properties/${params.id}/contracts`)} className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1 transition-colors ${isOccupied ? 'bg-[#3E342E] text-white hover:bg-[#3E342E]/80 shadow-sm' : 'bg-[#F5F5F5] text-[#8E7F74] hover:bg-[#EFEBE8]'}`}>
                      <FileSignature className="w-3 h-3"/> 建立合約
                    </button>
                  )}
                  <button onClick={() => setEditingRoom(room)} className="bg-[#F5F5F5] text-[#8E7F74] px-4 py-2 rounded-2xl text-xs font-black hover:bg-[#EFEBE8] transition-colors">編輯資訊</button>
                </div>

                {isOccupied ? (
                  <div className="flex items-center gap-2 text-[#8E7F74] text-xs font-bold pl-2 mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>{room.contract_start || '----/--/--'} 至 {room.contract_end || '----/--/--'}</span>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-[#D1C7C0] pl-2 mb-6 flex items-center gap-2">
                    <Home className="w-4 h-4"/> 目前無人承租，下方為預設招租條件
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className={`p-4 rounded-[24px] text-center ${isOccupied ? 'bg-[#F9F7F5]' : 'bg-[#F5F5F5] border border-dashed border-[#D1C7C0]'}`}>
                    <div className={`flex items-center justify-center gap-1 text-[10px] mb-1 ${isOccupied ? 'text-[#8E7F74]' : 'text-[#D1C7C0]'}`}>
                      <Home className="w-3 h-3"/> {isOccupied ? '租金' : '預設租金'}
                    </div>
                    <div className={`font-black ${isOccupied ? 'text-[#3E342E]' : 'text-[#8E7F74]'}`}>${room.rent_amount?.toLocaleString() || 0}</div>
                  </div>
                  <div className={`p-4 rounded-[24px] text-center ${isOccupied ? 'bg-[#F9F7F5]' : 'bg-[#F5F5F5] border border-dashed border-[#D1C7C0]'}`}>
                    <div className={`flex items-center justify-center gap-1 text-[10px] mb-1 ${isOccupied ? 'text-[#8E7F74]' : 'text-[#D1C7C0]'}`}>
                      <CheckCircle2 className="w-3 h-3"/> {isOccupied ? '管理費' : '預設管費'}
                    </div>
                    <div className={`font-black ${isOccupied ? 'text-[#3E342E]' : 'text-[#8E7F74]'}`}>${room.management_fee?.toLocaleString() || 0}</div>
                  </div>
                  <div className={`p-4 rounded-[24px] text-center ${isOccupied ? 'bg-[#F9F7F5]' : 'bg-[#F5F5F5] border border-dashed border-[#D1C7C0]'}`}>
                    <div className={`flex items-center justify-center gap-1 text-[10px] mb-1 ${isOccupied ? 'text-[#8E7F74]' : 'text-[#D1C7C0]'}`}>
                      <Zap className="w-3 h-3"/> {isOccupied ? '空間費' : '預設空間費'}
                    </div>
                    <div className={`font-black ${isOccupied ? 'text-[#3E342E]' : 'text-[#8E7F74]'}`}>${room.space_fee?.toLocaleString() || 0}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className={`px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 ${isOccupied ? 'bg-[#EAF3EB] text-[#2E7D32]' : 'bg-[#F5F5F5] text-[#D1C7C0] border border-dashed border-[#D1C7C0]'}`}>
                     <Zap className="w-3 h-3"/> {isOccupied ? '實收押金' : '預設押金'} ${room.deposit?.toLocaleString() || 0}
                  </div>
                  {isOccupied && room.phone && (
                    <div className="bg-[#F5F5F5] text-[#3E342E] px-4 py-2 rounded-full text-xs font-black flex items-center gap-2">
                       <Phone className="w-3 h-3"/> {room.phone}
                    </div>
                  )}
                  <div className="bg-[#F5F5F5] text-[#3E342E] px-4 py-2 rounded-full text-xs font-black flex items-center gap-2">
                     <Info className="w-3 h-3"/> 含水費、網路
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* 歷史房客檔案庫彈窗 (Archive Modal) */}
      {/* ========================================== */}
      {showArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E342E]/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setShowArchive(false)} className="absolute top-6 right-6 text-[#8E7F74] hover:text-[#3E342E] bg-[#F9F7F5] p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="flex items-center gap-3 mb-6 border-b border-[#EFEBE8] pb-6 shrink-0">
              <div className="w-12 h-12 bg-[#EFEBE8] rounded-2xl flex items-center justify-center text-[#3E342E]"><History className="w-6 h-6"/></div>
              <div>
                <h2 className="text-2xl font-black text-[#3E342E]">歷史房客檔案庫</h2>
                <p className="text-xs font-bold text-[#8E7F74] mt-1">此處封存所有已退租的房客與合約紀錄</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {pastTenants.length === 0 ? (
                <div className="text-center py-20 text-[#8E7F74] font-bold">目前尚無任何歷史退租紀錄。</div>
              ) : (
                pastTenants.map((tenant, idx) => (
                  <div key={idx} className="bg-[#F9F7F5] border border-[#EFEBE8] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-lg text-[#3E342E] shadow-sm border border-[#EFEBE8] shrink-0">
                        {tenant.room_number}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-[#3E342E] flex items-center gap-2">
                          {tenant.tenant_name} 
                          <span className="text-[10px] bg-[#EFEBE8] text-[#8E7F74] px-2 py-0.5 rounded-md uppercase tracking-widest">已退租</span>
                        </h3>
                        <div className="text-xs font-bold text-[#8E7F74] mt-1 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {tenant.start_date} ~ {tenant.end_date}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {tenant.tenant_phone || '無資料'}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setShowArchive(false); router.push(`/properties/${params.id}/contracts`); }} 
                      className="w-full md:w-auto bg-white border-2 border-[#D1C7C0] text-[#8E7F74] px-4 py-2.5 rounded-xl text-xs font-black hover:border-[#3E342E] hover:text-[#3E342E] transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4"/> 調閱封存合約
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 編輯房間彈窗 (Modal) */}
      {/* ========================================== */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E342E]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setEditingRoom(null)} className="absolute top-6 right-6 text-[#8E7F74] hover:text-[#3E342E] bg-[#F9F7F5] p-2 rounded-full"><X className="w-5 h-5"/></button>
            
            <h2 className="text-2xl font-black text-[#3E342E] mb-6 flex items-center gap-3">
              <span className="bg-[#3E342E] text-white w-10 h-10 rounded-xl flex items-center justify-center">{editingRoom.room_number}</span> 
              編輯房間資訊
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#8E7F74]">房客姓名 (若清空則自動轉為待租)</label>
                <input type="text" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={editingRoom.tenant_name || ''} onChange={(e) => setEditingRoom({...editingRoom, tenant_name: e.target.value})} placeholder="輸入房客姓名" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#8E7F74]">聯絡電話</label>
                <input type="text" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={editingRoom.phone || ''} onChange={(e) => setEditingRoom({...editingRoom, phone: e.target.value})} placeholder="輸入聯絡電話" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#8E7F74]">合約起日</label>
                  <input type="date" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={editingRoom.contract_start || ''} onChange={(e) => setEditingRoom({...editingRoom, contract_start: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#8E7F74]">合約迄日</label>
                  <input type="date" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={editingRoom.contract_end || ''} onChange={(e) => setEditingRoom({...editingRoom, contract_end: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#8E7F74]">月租金</label>
                  <input type="number" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={editingRoom.rent_amount || ''} onChange={(e) => setEditingRoom({...editingRoom, rent_amount: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#8E7F74]">押金</label>
                  <input type="number" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={editingRoom.deposit || ''} onChange={(e) => setEditingRoom({...editingRoom, deposit: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#8E7F74]">管理費</label>
                  <input type="number" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={editingRoom.management_fee || ''} onChange={(e) => setEditingRoom({...editingRoom, management_fee: e.target.value})} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#8E7F74]">空間費</label>
                  <input type="number" className="w-full h-12 bg-[#F9F7F5] border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none focus:border-[#3E342E]" value={editingRoom.space_fee || ''} onChange={(e) => setEditingRoom({...editingRoom, space_fee: e.target.value})} placeholder="0" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setEditingRoom(null)} className="flex-1 h-14 bg-[#F5F5F5] text-[#8E7F74] rounded-2xl font-black transition-all hover:bg-[#EFEBE8]">取消</button>
              <button onClick={handleSaveRoomEdit} className="flex-1 h-14 bg-[#3E342E] text-white rounded-2xl font-black shadow-lg transition-all active:scale-95">儲存變更</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 退租結算與押金扣款彈窗 (Modal) */}
      {/* ========================================== */}
      {checkoutRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E342E]/70 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative overflow-y-auto max-h-[95vh]">
            <button onClick={() => setCheckoutRoom(null)} className="absolute top-6 right-6 text-[#8E7F74] hover:text-[#3E342E] bg-[#F9F7F5] p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="flex items-center gap-3 mb-6 border-b border-[#EFEBE8] pb-6">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500"><LogOut className="w-6 h-6"/></div>
              <div>
                <h2 className="text-2xl font-black text-[#3E342E]">辦理退租結算</h2>
                <p className="text-xs font-bold text-[#8E7F74] mt-1">{checkoutRoom.room_number} 房 • 承租人：{checkoutRoom.tenant_name}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#F9F7F5] p-5 rounded-2xl border border-[#EFEBE8]">
                <label className="text-xs font-black text-[#3E342E] flex items-center gap-2 mb-3"><Calendar className="w-4 h-4"/> 1. 確認退租日期</label>
                <input type="date" className="w-full h-12 bg-white border border-[#D1C7C0] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none" value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} />
              </div>

              {checkoutContract?.allow_pets && (
                <div className="bg-orange-50 border-2 border-orange-200 p-5 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2 text-orange-600 font-black"><AlertTriangle className="w-5 h-5"/> 寵物條款注意</div>
                  <p className="text-sm font-bold text-orange-800">此合約有開放飼養寵物 ({checkoutContract.pet_details})。<br/>依合約規定，退租時須確認是否已完成「除蚤/除臭深層清潔」，若無，請於下方扣除相關清潔費用。</p>
                </div>
              )}

              <div className="bg-white border-2 border-[#3E342E] p-5 rounded-2xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#3E342E] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl">結算區</div>
                <label className="text-xs font-black text-[#3E342E] flex items-center gap-2"><Calculator className="w-4 h-4"/> 2. 押金扣款結算</label>
                
                <div className="flex justify-between items-center bg-[#F9F7F5] p-3 rounded-xl">
                  <span className="text-sm font-bold text-[#8E7F74]">原收押金總額</span>
                  <span className="text-lg font-black text-[#3E342E]">${currentDeposit.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="col-span-1 text-sm font-bold text-red-500 text-right">➖ 扣減金額</div>
                  <div className="col-span-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8E7F74]">$</span>
                    <input type="number" className="w-full h-11 bg-white border border-red-200 rounded-xl pl-8 pr-4 text-sm font-black text-red-500 outline-none focus:border-red-400" value={deductionAmount || ''} onChange={(e) => setDeductionAmount(Number(e.target.value))} placeholder="0" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 items-start">
                  <div className="col-span-1 text-sm font-bold text-[#8E7F74] text-right mt-3">扣款事由</div>
                  <div className="col-span-2">
                    <textarea className="w-full bg-[#F9F7F5] border border-[#D1C7C0] rounded-xl p-3 text-sm font-bold text-[#3E342E] outline-none h-20" value={deductionReason} onChange={(e) => setDeductionReason(e.target.value)} placeholder="例如：水電結算、寵物清潔費、設備損壞賠償..." />
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-[#D1C7C0] pt-4 mt-2 flex justify-between items-center">
                  <span className="text-sm font-black text-[#3E342E]">實際應退還押金</span>
                  <span className={`text-3xl font-black ${refundAmount < 0 ? 'text-red-500' : 'text-[#2E7D32]'}`}>
                    ${refundAmount.toLocaleString()}
                  </span>
                </div>
                {refundAmount < 0 && <p className="text-xs font-bold text-red-500 text-right">※ 扣減超過押金，需另向租客索取差額</p>}
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setCheckoutRoom(null)} className="flex-1 h-14 bg-[#F5F5F5] text-[#8E7F74] rounded-2xl font-black transition-all hover:bg-[#EFEBE8]">取消返回</button>
              <button onClick={submitCheckout} disabled={isCheckingOut} className="flex-1 h-14 bg-red-500 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 hover:bg-red-600 flex justify-center items-center gap-2">
                {isCheckingOut ? '處理中...' : <><CheckCircle2 className="w-5 h-5"/> 確認退租結算</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}