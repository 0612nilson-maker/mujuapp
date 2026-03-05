"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase'; 
import { ArrowLeft, FileText, User, Calendar, Plus, X, CheckCircle2, Home, FileSignature, FileEdit, Printer, UploadCloud, PawPrint, Camera, CreditCard, Trash2, Users, Edit3, Copy, Zap } from 'lucide-react';

// ==========================================
// 資料結構定義與預設值
// ==========================================
const defaultEquipment = [
  { area: '客廳', name: '液晶電視', brand: '', quantity: 1, status: '正常', remark: '', compensation: '' },
  { area: '客廳', name: '冷氣機', brand: '', quantity: 1, status: '正常', remark: '', compensation: '' },
  { area: '客廳', name: '沙發', brand: '', quantity: 1, status: '正常', remark: '', compensation: '' },
  { area: '臥室', name: '雙人床墊', brand: '', quantity: 1, status: '正常', remark: '', compensation: '' },
  { area: '臥室', name: '衣櫃', brand: '', quantity: 1, status: '正常', remark: '', compensation: '' },
  { area: '廚房', name: '冰箱', brand: '', quantity: 1, status: '正常', remark: '', compensation: '' },
  { area: '陽台', name: '洗衣機', brand: '', quantity: 1, status: '正常', remark: '', compensation: '' },
  { area: '備註', name: '鑰匙/磁扣', brand: '', quantity: 2, status: '正常', remark: '', compensation: '' }
];

const defaultFees = {
  management: { payer: '承租人', amount: 0 },
  space: { payer: '承租人', amount: 0 },
  water: { payer: '承租人', type: '台水帳單', amount: 0 },
  electricity: { payer: '承租人', billing_method: '依當期每度平均電價', rate: 5 },
  gas: { payer: '承租人', amount: 0 },
  internet: { payer: '承租人', type: '含於空間管理費內' }
};

const newPerson = () => ({ name: '', id_number: '', phone: '', address: '', id_front: '', id_back: '' });
const newEquipment = () => ({ area: '', name: '', brand: '', quantity: 1, status: '正常', remark: '', compensation: '' });

export default function ContractsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [viewMode, setViewMode] = useState<'hub' | 'drafting' | 'preview'>('hub');
  const [viewingContract, setViewingContract] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    contract_type: 'general',
    room_number: '',
    property_address: '', // ✅ 新增：包租專用標的地址
    landlord_name: '', landlord_id: '', landlord_company: '', landlord_address: '', landlord_license: '', 
    original_owner: '', 
    tenants: [newPerson()],
    guarantors: [] as any[],
    start_date: '', end_date: '', rent_amount: 0, deposit_amount: 0,
    payment_method: '轉帳', bank_name: '', bank_account_name: '', bank_account: '',
    fees: JSON.parse(JSON.stringify(defaultFees)),
    equipment: JSON.parse(JSON.stringify(defaultEquipment)),
    special_terms: '1. 室內全面禁菸。\n2. 禁止擅自變更房屋結構。',
    allow_pets: false, pet_type: '', pet_count: 1, pet_name: '',
    early_termination_allowed: true,
    free_rent_days: 30,
    property_photos: Array(15).fill('')
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: contractData } = await supabase.from('contracts').select('*').eq('property_id', params.id).order('created_at', { ascending: false });
      if (contractData) setContracts(contractData);
      const { data: roomData } = await supabase.from('rooms').select('room_number, rent_amount, deposit').eq('property_id', params.id).order('room_number', { ascending: true });
      if (roomData) setAvailableRooms(roomData);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const handleRoomSelect = (room_number: string) => {
    const room = availableRooms.find(r => r.room_number === room_number);
    setDraft({ ...draft, room_number, rent_amount: room?.rent_amount || 0, deposit_amount: room?.deposit || 0 });
  };

  const handleFillDummyData = () => {
    const defaultRoom = availableRooms.length > 0 ? availableRooms[0].room_number : '101';
    setDraft({
      ...draft,
      room_number: defaultRoom,
      property_address: '台中市北屯區台灣大道三段99號(整層)', // 包租專用測試地址
      landlord_name: '王金主',
      landlord_id: 'L123456789',
      landlord_company: '90123456', 
      landlord_address: '台中市北屯區台灣大道三段99號',
      landlord_license: '中市租登字第11200001號',
      original_owner: '張原屋',
      tenants: [
        { name: '陳小美', id_number: 'B222333444', phone: '0912-345-678', address: '台北市大安區忠孝東路四段1號', id_front: '', id_back: '' },
      ],
      guarantors: [
        { name: '陳大山', id_number: 'D333444555', phone: '0955-111-222', address: '新北市板橋區復興路12號', id_front: '', id_back: '' }
      ],
      start_date: '2024-06-01',
      end_date: '2029-05-31', 
      rent_amount: 18500,
      deposit_amount: 37000,
      payment_method: '轉帳',
      bank_name: '國泰世華銀行 (013)',
      bank_account_name: '王金主',
      bank_account: '013-1234567890',
      allow_pets: true,
      pet_type: '橘貓',
      pet_count: 1,
      pet_name: '胖橘',
      early_termination_allowed: true,
      free_rent_days: 30,
      special_terms: '1. 室內全面禁菸。\n2. 禁止擅自變更房屋結構。\n3. 每月按時繳租可折抵100元。'
    });
    alert('✅ 測試資料已秒速帶入！');
  };

  const handlePersonChange = (type: 'tenants' | 'guarantors', index: number, field: string, value: string) => {
    const newList = [...draft[type]];
    newList[index] = { ...newList[index], [field]: value };
    setDraft({ ...draft, [type]: newList });
  };
  const addPerson = (type: 'tenants' | 'guarantors') => setDraft({ ...draft, [type]: [...draft[type], newPerson()] });
  const removePerson = (type: 'tenants' | 'guarantors', index: number) => {
    const newList = draft[type].filter((_: any, i: number) => i !== index);
    setDraft({ ...draft, [type]: newList });
  };

  const handleEquipmentChange = (index: number, field: string, value: string) => {
    const newEq = [...draft.equipment];
    newEq[index] = { ...newEq[index], [field]: value };
    setDraft({ ...draft, equipment: newEq });
  };
  const addEquipment = () => setDraft({ ...draft, equipment: [...draft.equipment, newEquipment()] });
  const removeEquipment = (index: number) => {
    const newEq = draft.equipment.filter((_: any, i: number) => i !== index);
    setDraft({ ...draft, equipment: newEq });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'property' | 'person', index: number, field?: 'id_front' | 'id_back', personType?: 'tenants' | 'guarantors') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const MAX_HEIGHT = 800; 
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

          if (type === 'property') {
            const newPhotos = [...draft.property_photos];
            newPhotos[index] = compressedBase64;
            setDraft({ ...draft, property_photos: newPhotos });
          } else if (type === 'person' && field && personType) {
            const newList = [...draft[personType]];
            newList[index] = { ...newList[index], [field]: compressedBase64 };
            setDraft({ ...draft, [personType]: newList });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteContract = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('確定要刪除這份合約紀錄嗎？此動作無法復原！')) return;
    try {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
      alert('合約已成功刪除 🗑️');
      fetchData();
    } catch (err: any) { alert(`刪除失敗: ${err.message}`); }
  };

  const handleEditContract = (contract: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const d = contract.details || {};
    setEditingId(contract.id); 
    
    let loadedTenants = d.tenants && d.tenants.length > 0 ? d.tenants : [{ name: contract.tenant_name || '', id_number: contract.tenant_id_number || '', phone: contract.tenant_phone || '', address: d.tenant?.address || '', id_front: '', id_back: '' }];
    let p_type = '', p_count = 1, p_name = '';
    if (contract.pet_details) {
      const parts = contract.pet_details.split(' / ');
      if (parts.length >= 3) {
        p_type = parts[0].replace('種類:', ''); p_count = Number(parts[1].replace('數量:', '')) || 1; p_name = parts[2].replace('名字:', '');
      } else { p_type = contract.pet_details; }
    }

    setDraft({
      contract_type: contract.contract_type || 'general',
      room_number: contract.room_number || '',
      property_address: d.property_address || '',
      landlord_name: d.landlord?.name || '', landlord_id: d.landlord?.id || '', landlord_company: d.landlord?.company || '', landlord_address: d.landlord?.address || '', landlord_license: d.landlord?.license || '',
      tenants: loadedTenants, guarantors: d.guarantors || [],
      start_date: contract.start_date || '', end_date: contract.end_date || '', rent_amount: contract.rent_amount || 0, deposit_amount: contract.deposit_amount || 0,
      payment_method: d.payment?.method || '轉帳', bank_name: d.payment?.bank || '', bank_account_name: d.payment?.account_name || '', bank_account: d.payment?.account || '',
      fees: d.fees || JSON.parse(JSON.stringify(defaultFees)), equipment: d.equipment || JSON.parse(JSON.stringify(defaultEquipment)),
      special_terms: contract.special_terms || '', allow_pets: contract.allow_pets || false, 
      pet_type: p_type, pet_count: p_count, pet_name: p_name,
      early_termination_allowed: d.early_termination_allowed ?? true,
      free_rent_days: d.free_rent_days || 30,
      property_photos: d.images?.property_photos || Array(15).fill(''), original_owner: contract.original_owner || ''
    });
    setViewMode('drafting');
  };

  const handleCopyContract = (contract: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const d = contract.details || {};
    setEditingId(null); 
    setDraft({
      contract_type: contract.contract_type || 'general', room_number: '', property_address: '',
      landlord_name: d.landlord?.name || '', landlord_id: d.landlord?.id || '', landlord_company: d.landlord?.company || '', landlord_address: d.landlord?.address || '', landlord_license: d.landlord?.license || '',
      tenants: [newPerson()], guarantors: [], start_date: '', end_date: '', rent_amount: contract.rent_amount || 0, deposit_amount: contract.deposit_amount || 0,
      payment_method: d.payment?.method || '轉帳', bank_name: d.payment?.bank || '', bank_account_name: d.payment?.account_name || '', bank_account: d.payment?.account || '',
      fees: d.fees || JSON.parse(JSON.stringify(defaultFees)), equipment: d.equipment || JSON.parse(JSON.stringify(defaultEquipment)), 
      special_terms: contract.special_terms || '', allow_pets: contract.allow_pets || false, 
      pet_type: '', pet_count: 1, pet_name: '', 
      early_termination_allowed: d.early_termination_allowed ?? true,
      free_rent_days: d.free_rent_days || 30,
      property_photos: Array(15).fill(''), original_owner: contract.original_owner || ''
    });
    setViewMode('drafting');
    alert('已為您複製合約模板！請選擇新房號或填寫新標的地址。');
  };

  const handleGenerateContract = async () => {
    if (draft.contract_type === 'master' && !draft.property_address) return alert('請填寫包租標的地址！');
    if (draft.contract_type !== 'master' && !draft.room_number) return alert('請選擇房號！');
    if (!draft.tenants[0]?.name || !draft.start_date || !draft.end_date) return alert('請填寫必填欄位 (姓名、起訖日)！');
    
    setSaving(true);
    try {
      const payload = {
        property_id: params.id,
        contract_type: draft.contract_type,
        room_number: draft.contract_type === 'master' ? '包租全戶' : draft.room_number, // 包租強制設為包租全戶
        tenant_name: draft.tenants[0].name,
        tenant_id_number: draft.tenants[0].id_number,
        tenant_phone: draft.tenants[0].phone,
        start_date: draft.start_date,
        end_date: draft.end_date,
        rent_amount: draft.rent_amount,
        deposit_amount: draft.deposit_amount,
        electricity_rate: draft.fees.electricity.rate, 
        special_terms: draft.special_terms,
        allow_pets: draft.allow_pets,
        pet_details: draft.allow_pets ? `種類:${draft.pet_type} / 數量:${draft.pet_count} / 名字:${draft.pet_name}` : '',
        original_owner: draft.original_owner,
        details: {
          property_address: draft.property_address,
          landlord: { name: draft.landlord_name, id: draft.landlord_id, company: draft.landlord_company, address: draft.landlord_address, license: draft.landlord_license },
          tenants: draft.tenants, guarantors: draft.guarantors,
          payment: { method: draft.payment_method, bank: draft.bank_name, account_name: draft.bank_account_name, account: draft.bank_account },
          fees: draft.fees, equipment: draft.equipment, images: { property_photos: draft.property_photos },
          early_termination_allowed: draft.early_termination_allowed,
          free_rent_days: draft.free_rent_days
        }
      };

      if (editingId) {
        const { error } = await supabase.from('contracts').update(payload).eq('id', editingId);
        if (error) throw error;
        alert('合約已成功修改更新！✏️');
      } else {
        const { error } = await supabase.from('contracts').insert([payload]);
        if (error) throw error;
        alert('正式合約建立成功！🎉');
      }
      
      if (draft.contract_type !== 'master') {
        await supabase.from('rooms').update({
          tenant_name: draft.tenants[0].name, phone: draft.tenants[0].phone, rent_amount: draft.rent_amount, deposit: draft.deposit_amount, contract_start: draft.start_date, contract_end: draft.end_date
        }).eq('property_id', params.id).eq('room_number', draft.room_number);
      }

      setEditingId(null);
      setViewMode('hub');
      fetchData();
    } catch (err: any) { alert(`儲存失敗: ${err.message}`); } finally { setSaving(false); }
  };

  const handleResetDraft = () => {
    setEditingId(null);
    setDraft({
      contract_type: 'general', room_number: '', property_address: '', landlord_name: '', landlord_id: '', landlord_company: '', landlord_address: '', landlord_license: '',
      tenants: [newPerson()], guarantors: [], start_date: '', end_date: '', rent_amount: 0, deposit_amount: 0,
      payment_method: '轉帳', bank_name: '', bank_account_name: '', bank_account: '',
      fees: JSON.parse(JSON.stringify(defaultFees)), equipment: JSON.parse(JSON.stringify(defaultEquipment)),
      special_terms: '1. 室內全面禁菸。\n2. 禁止擅自變更房屋結構。', allow_pets: false, pet_type: '', pet_count: 1, pet_name: '',
      early_termination_allowed: true, free_rent_days: 30, property_photos: Array(15).fill(''), original_owner: ''
    });
  }

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); 
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-[#8E7F74]">資料載入中...</div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] font-sans text-[#3E342E]">
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#F9F7F5]/90 backdrop-blur z-20 border-b border-[#EFEBE8]">
        <button onClick={() => { if (viewMode !== 'hub') { setViewMode('hub'); handleResetDraft(); } else router.back(); }} className="p-2 active:scale-90 transition-all"><ArrowLeft className="w-6 h-6 text-[#3E342E]" /></button>
        <div className="text-center"><h1 className="text-xl font-black text-[#3E342E] tracking-widest">契約管理中心</h1></div>
        <div className="w-10"></div>
      </div>

      <div className="px-4 md:px-8 space-y-8 pb-20 mt-6">

        {/* ================= HUB 首頁 ================= */}
        {viewMode === 'hub' && (
          <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ContractTypeCard icon={<Home className="w-6 h-6 text-orange-500" />} title="包租契約書" onClick={() => { handleResetDraft(); setDraft(prev => ({...prev, contract_type: 'master'})); setViewMode('drafting'); }} />
              <ContractTypeCard icon={<FileText className="w-6 h-6 text-purple-500" />} title="轉租同意書" onClick={() => { handleResetDraft(); setDraft(prev => ({...prev, contract_type: 'consent'})); setViewMode('drafting'); }} />
              <ContractTypeCard icon={<FileEdit className="w-6 h-6 text-red-400" />} title="轉租契約書" onClick={() => { handleResetDraft(); setDraft(prev => ({...prev, contract_type: 'sublease'})); setViewMode('drafting'); }} />
              <ContractTypeCard icon={<User className="w-6 h-6 text-[#3E342E]" />} title="一般出租契約" onClick={() => { handleResetDraft(); setDraft(prev => ({...prev, contract_type: 'general'})); setViewMode('drafting'); }} />
            </div>

            <div>
              <h3 className="text-sm font-black text-[#8E7F74] uppercase tracking-widest mb-4 pl-2 border-l-4 border-[#3E342E]">歷史合約紀錄</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contracts.length === 0 && <p className="text-[#8E7F74] font-bold p-4">目前尚無合約紀錄...</p>}
                {contracts.map(contract => (
                  <div key={contract.id} className="bg-white p-5 rounded-[24px] shadow-sm flex flex-col gap-4 cursor-pointer hover:shadow-md transition-all border border-[#EFEBE8]" onClick={() => { setViewingContract(contract); setViewMode('preview'); }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#3E342E] rounded-xl flex items-center justify-center font-black text-lg text-white">
                           {contract.contract_type === 'master' ? '包' : contract.room_number}
                        </div>
                        <div>
                          <h4 className="font-black text-base text-[#3E342E]">{contract.tenant_name} <span className="text-xs font-normal text-[#8E7F74]">{contract.details?.tenants?.length > 1 ? `等 ${contract.details.tenants.length} 人` : ''}</span></h4>
                          <p className="text-[10px] font-bold text-[#8E7F74]">{contract.start_date} 起租</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-[#EAF3EB] text-[#2E7D32] px-3 py-1.5 rounded-lg">
                        {contract.contract_type === 'general' && '一般出租'}
                        {contract.contract_type === 'sublease' && '轉租契約'}
                        {contract.contract_type === 'master' && '包租契約'}
                        {contract.contract_type === 'consent' && '轉租同意'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 border-t border-[#F9F7F5] pt-3 mt-1">
                      <button onClick={(e) => handleCopyContract(contract, e)} className="flex items-center gap-1 text-[11px] font-bold text-[#8E7F74] bg-[#F9F7F5] px-3 py-1.5 rounded-lg hover:bg-[#EFEBE8] transition-colors">
                        <Copy className="w-3 h-3" /> 複製新建
                      </button>
                      <button onClick={(e) => handleEditContract(contract, e)} className="flex items-center gap-1 text-[11px] font-bold text-[#8E7F74] bg-[#F9F7F5] px-3 py-1.5 rounded-lg hover:bg-[#EFEBE8] transition-colors">
                        <Edit3 className="w-3 h-3" /> 編輯修改
                      </button>
                      <button onClick={(e) => handleDeleteContract(contract.id, e)} className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3 h-3" /> 刪除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= 表單擬定/編輯模式 ================= */}
        {viewMode === 'drafting' && (
          <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-xl border border-[#EFEBE8] animate-in slide-in-from-right-8 max-w-5xl mx-auto space-y-10 relative">
            
            <div className="absolute top-6 right-6 md:top-10 md:right-10">
               <button type="button" onClick={handleFillDummyData} className="flex items-center gap-2 bg-[#EFEBE8] text-[#3E342E] hover:bg-[#D1C7C0] px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm">
                 <Zap className="w-4 h-4" /> 一鍵帶入測試資料
               </button>
            </div>

            <h2 className="font-black text-2xl border-b-2 border-[#3E342E] pb-4 flex items-center justify-start gap-3 mt-4 md:mt-0 text-[#3E342E]">
              <FileSignature className="w-6 h-6 text-[#3E342E]" /> 
              {editingId ? '編輯' : '建立'} 
              {draft.contract_type === 'general' && ' 一般出租契約'}
              {draft.contract_type === 'sublease' && ' 轉租契約書'}
              {draft.contract_type === 'master' && ' 包租契約書'}
              {draft.contract_type === 'consent' && ' 轉租同意書'}
              {editingId && <span className="bg-[#EFEBE8] text-[#3E342E] text-xs px-3 py-1 rounded-full font-bold ml-2">編輯模式</span>}
            </h2>

            {/* 1. 當事人與房屋基本資料 */}
            <section className="space-y-4">
              <SectionTitle title="一、基本資料與對象" />
              
              <div className="bg-[#F9F7F5] p-5 rounded-2xl space-y-4 border border-[#EFEBE8]">
                {/* ✅ 包租契約改用文字輸入標的地址，不選房號 */}
                {draft.contract_type === 'master' ? (
                  <div className="space-y-1 max-w-xl">
                    <label className="text-[10px] font-black text-[#8E7F74]">租賃標的地址 (包租標的) *</label>
                    <input type="text" className="w-full h-12 bg-white border border-[#D1C7C0] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none" value={draft.property_address} onChange={(e) => setDraft({...draft, property_address: e.target.value})} placeholder="例如：台中市西屯區文心路三段99號(全棟)" />
                  </div>
                ) : (
                  <div className="space-y-1 max-w-md">
                    <label className="text-[10px] font-black text-[#8E7F74]">選擇合約綁定房號 *</label>
                    <select className="w-full h-12 bg-white border border-[#D1C7C0] rounded-xl px-4 text-sm font-bold text-[#3E342E] outline-none" value={draft.room_number} onChange={(e) => handleRoomSelect(e.target.value)}>
                      <option value="" disabled>請選擇房號</option>{availableRooms.map(r => <option key={r.room_number} value={r.room_number}>{r.room_number}</option>)}
                    </select>
                  </div>
                )}
                
                {(draft.contract_type === 'sublease' || draft.contract_type === 'consent' || draft.contract_type === 'master') && (
                  <div className="max-w-md">
                    <InputText label="原所有權人(原屋主)姓名" value={draft.original_owner} onChange={(v) => setDraft({...draft, original_owner: v})} />
                  </div>
                )}
              </div>

              <div className="bg-[#F9F7F5] p-5 rounded-2xl space-y-4 border border-[#EFEBE8]">
                <h4 className="font-bold text-sm text-[#3E342E] border-b border-[#D1C7C0] pb-2">出租方資訊 (甲方)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputText label="出租方名稱/姓名" value={draft.landlord_name} onChange={(v) => setDraft({...draft, landlord_name: v})} />
                  <InputText label="身分證/負責人" value={draft.landlord_id} onChange={(v) => setDraft({...draft, landlord_id: v})} />
                  {draft.contract_type !== 'general' && (
                    <>
                      <InputText label="統一編號" value={draft.landlord_company} onChange={(v) => setDraft({...draft, landlord_company: v})} />
                      <InputText label="租賃住宅服務業登記證字號" value={draft.landlord_license} onChange={(v) => setDraft({...draft, landlord_license: v})} />
                    </>
                  )}
                  <div className="md:col-span-2">
                    <InputText label="聯絡地址" value={draft.landlord_address} onChange={(v) => setDraft({...draft, landlord_address: v})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {draft.tenants.map((t, idx) => (
                  <div key={`tenant-${idx}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border-2 border-[#EFEBE8] p-5 rounded-2xl relative">
                    <div className="col-span-1 md:col-span-2 flex justify-between items-center">
                      <h4 className="font-bold text-sm text-[#3E342E] flex items-center gap-2"><User className="w-4 h-4"/> 承租人 {idx + 1}</h4>
                      {draft.tenants.length > 1 && (
                        <button onClick={() => removePerson('tenants', idx)} className="text-xs text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"><Trash2 className="w-3 h-3"/> 移除</button>
                      )}
                    </div>
                    <InputText label={idx === 0 ? "姓名 *" : "姓名"} value={t.name} onChange={(v) => handlePersonChange('tenants', idx, 'name', v)} />
                    <InputText label="身分證字號" value={t.id_number} onChange={(v) => handlePersonChange('tenants', idx, 'id_number', v)} />
                    <InputText label="聯絡電話" value={t.phone} onChange={(v) => handlePersonChange('tenants', idx, 'phone', v)} />
                    <InputText label="戶籍地址" value={t.address} onChange={(v) => handlePersonChange('tenants', idx, 'address', v)} />
                  </div>
                ))}
                <button onClick={() => addPerson('tenants')} className="w-full py-3 border-2 border-dashed border-[#D1C7C0] text-[#8E7F74] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#F9F7F5] transition-all">
                  <Plus className="w-4 h-4" /> 新增共同承租人
                </button>
              </div>

              <div className="space-y-4 mt-6">
                {draft.guarantors.map((g, idx) => (
                  <div key={`guarantor-${idx}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border-2 border-[#EFEBE8] p-5 rounded-2xl relative">
                    <div className="col-span-1 md:col-span-2 flex justify-between items-center">
                      <h4 className="font-bold text-sm text-[#8E7F74] flex items-center gap-2"><Users className="w-4 h-4"/> 保證人 {idx + 1}</h4>
                      <button onClick={() => removePerson('guarantors', idx)} className="text-xs text-red-500 font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"><Trash2 className="w-3 h-3"/> 移除</button>
                    </div>
                    <InputText label="姓名" value={g.name} onChange={(v) => handlePersonChange('guarantors', idx, 'name', v)} />
                    <InputText label="身分證字號" value={g.id_number} onChange={(v) => handlePersonChange('guarantors', idx, 'id_number', v)} />
                    <InputText label="聯絡電話" value={g.phone} onChange={(v) => handlePersonChange('guarantors', idx, 'phone', v)} />
                    <InputText label="戶籍地址" value={g.address} onChange={(v) => handlePersonChange('guarantors', idx, 'address', v)} />
                  </div>
                ))}
                <button onClick={() => addPerson('guarantors')} className="w-full py-3 border-2 border-dashed border-[#D1C7C0] text-[#8E7F74] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#F9F7F5] transition-all">
                  <Plus className="w-4 h-4" /> 新增保證人
                </button>
              </div>
            </section>

            {/* 如果是轉租同意書，不需要下面這些填寫 */}
            {draft.contract_type !== 'consent' && (
              <>
              {/* 2. 租期與財務 */}
              <section className="space-y-4">
                <SectionTitle title="二、租期、租金與帳戶" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                    <InputDate label="起租日 *" value={draft.start_date} onChange={(v) => setDraft({...draft, start_date: v})} />
                    <InputDate label="退租日 *" value={draft.end_date} onChange={(v) => setDraft({...draft, end_date: v})} />
                  </div>
                  <InputRow label="每月租金 *" value={draft.rent_amount} onChange={(v) => setDraft({...draft, rent_amount: v})} />
                  <InputRow label="押金總額 (通常為2個月) *" value={draft.deposit_amount} onChange={(v) => setDraft({...draft, deposit_amount: v})} />
                  
                  {draft.contract_type === 'master' && (
                    <div className="col-span-1 md:col-span-2 bg-[#EFEBE8]/30 p-4 rounded-xl border border-[#D1C7C0] flex flex-col md:flex-row items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#3E342E]">裝修免租期 (天數)</span>
                        <input type="number" className="w-24 h-10 rounded-lg px-3 text-center border border-[#D1C7C0] outline-none font-black text-[#3E342E]" value={draft.free_rent_days} onChange={(e) => setDraft({...draft, free_rent_days: Number(e.target.value)})} />
                      </div>
                      <span className="text-xs text-[#8E7F74]">自起租日起算，期間免付租金</span>
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2 bg-[#F9F7F5] p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 border border-[#EFEBE8]">
                    <div className="md:col-span-3"><h4 className="font-bold text-sm text-[#3E342E] mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4"/> 租金支付帳戶</h4></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">支付方式</label>
                      <select className="w-full h-12 bg-white rounded-xl px-4 text-sm font-bold text-[#3E342E] border border-[#EFEBE8] outline-none" value={draft.payment_method} onChange={(e) => setDraft({...draft, payment_method: e.target.value})}>
                        <option value="轉帳">匯款/轉帳</option><option value="現金">現金</option>
                      </select>
                    </div>
                    <InputText label="金融機構名稱 (含分行)" value={draft.bank_name} onChange={(v) => setDraft({...draft, bank_name: v})} />
                    <InputText label="戶名" value={draft.bank_account_name} onChange={(v) => setDraft({...draft, bank_account_name: v})} />
                    <div className="md:col-span-3"><InputText label="帳號" value={draft.bank_account} onChange={(v) => setDraft({...draft, bank_account: v})} /></div>
                  </div>
                </div>
              </section>

              {/* 3. 費用與設備 (包租契約不需要填寫設備清單) */}
              {draft.contract_type !== 'master' && (
                <section className="space-y-4">
                  <SectionTitle title="三、費用設定與設備點交" />
                  
                  <div className="bg-[#F9F7F5] p-5 rounded-2xl space-y-4 border border-[#EFEBE8]">
                    <h4 className="font-bold text-sm text-[#3E342E]">電費約定設定</h4>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <select className="h-11 rounded-lg px-3 text-sm border border-[#D1C7C0] font-bold text-[#3E342E] outline-none"
                        value={draft.fees.electricity.billing_method}
                        onChange={(e) => setDraft({...draft, fees: {...draft.fees, electricity: {...draft.fees.electricity, billing_method: e.target.value}}})}
                      >
                        <option value="依當期每度平均電價">依當期每度平均電價 (台電帳單)</option>
                        <option value="按度計費">按度計費 (約定每度單價)</option>
                        <option value="台電帳單自行繳納">依台電帳單自行繳納</option>
                      </select>

                      {draft.fees.electricity.billing_method === '按度計費' && (
                        <div className="flex items-center gap-2 text-sm font-bold text-[#3E342E] animate-in fade-in">
                          每度約定收費 <input type="number" step="0.5" className="w-20 h-11 text-center rounded-lg border border-[#D1C7C0] outline-none" value={draft.fees.electricity.rate} onChange={(e) => setDraft({...draft, fees: {...draft.fees, electricity: {...draft.fees.electricity, rate: Number(e.target.value)}}})} /> 元
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#F9F7F5] p-5 rounded-2xl space-y-4 border border-[#EFEBE8]">
                    <h4 className="font-bold text-sm text-[#3E342E]">設備點交清單</h4>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {draft.equipment.map((eq: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-[#EFEBE8] space-y-2">
                          <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                            <input className="w-16 md:w-20 h-10 bg-[#F9F7F5] rounded-lg px-2 text-xs font-bold text-center outline-none text-[#3E342E]" value={eq.area} onChange={(e) => handleEquipmentChange(idx, 'area', e.target.value)} placeholder="區域" />
                            <input className="flex-1 min-w-[100px] h-10 bg-[#F9F7F5] rounded-lg px-3 text-sm font-bold outline-none text-[#3E342E]" value={eq.name} onChange={(e) => handleEquipmentChange(idx, 'name', e.target.value)} placeholder="設備名稱" />
                            <input className="flex-1 min-w-[100px] h-10 bg-[#F9F7F5] rounded-lg px-3 text-xs outline-none text-[#3E342E]" value={eq.brand || ''} onChange={(e) => handleEquipmentChange(idx, 'brand', e.target.value)} placeholder="品牌/規格" />
                            <div className="flex items-center gap-1">
                              <input type="number" className="w-14 h-10 bg-[#F9F7F5] rounded-lg px-2 text-xs text-center outline-none text-[#3E342E]" value={eq.quantity || 1} onChange={(e) => handleEquipmentChange(idx, 'quantity', e.target.value)} placeholder="數量" />
                              <span className="text-xs text-[#8E7F74]">件</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                            <select className="h-10 bg-[#F9F7F5] rounded-lg px-2 text-xs font-bold outline-none text-[#3E342E]" value={eq.status} onChange={(e) => handleEquipmentChange(idx, 'status', e.target.value)}>
                              <option value="正常">正常</option><option value="瑕疵">瑕疵</option>
                            </select>
                            <input className="flex-1 min-w-[120px] h-10 bg-[#F9F7F5] rounded-lg px-3 text-xs outline-none text-[#3E342E]" value={eq.remark} onChange={(e) => handleEquipmentChange(idx, 'remark', e.target.value)} placeholder="備註/瑕疵說明" />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-[#8E7F74]">約定賠償 $</span>
                              <input type="number" className="w-24 h-10 bg-[#F9F7F5] rounded-lg px-2 text-xs text-right outline-none text-[#3E342E]" value={eq.compensation || ''} onChange={(e) => handleEquipmentChange(idx, 'compensation', e.target.value)} placeholder="金額" />
                            </div>
                            <button onClick={() => removeEquipment(idx)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={addEquipment} className="w-full py-3 border-2 border-dashed border-[#D1C7C0] text-[#8E7F74] rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#EFEBE8] transition-all mt-2">
                      <Plus className="w-4 h-4" /> 新增附屬設備項目
                    </button>
                  </div>
                </section>
              )}

              {/* 4. 特約與約定 */}
              <section className="space-y-4">
                <SectionTitle title="四、客製條款與終止約定" />
                
                <div className="bg-[#F9F7F5] p-5 rounded-2xl space-y-4 border border-[#EFEBE8]">
                  <h4 className="font-bold text-sm text-[#3E342E]">提前終止租約設定</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="text-sm font-bold text-[#8E7F74]">租賃雙方是否得任意終止租約？</span>
                    <select className="h-11 rounded-lg px-4 text-sm border border-[#D1C7C0] font-bold text-[#3E342E] outline-none"
                      value={draft.early_termination_allowed ? '得' : '不得'}
                      onChange={(e) => setDraft({...draft, early_termination_allowed: e.target.value === '得'})}
                    >
                      <option value="得">得 (允許提前終止)</option>
                      <option value="不得">不得 (不可提前終止)</option>
                    </select>
                  </div>
                </div>

                {draft.contract_type !== 'master' && (
                  <div className="p-5 bg-white border-2 border-[#EFEBE8] rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#EFEBE8] pb-3">
                      <div className="flex items-center gap-2"><PawPrint className="w-5 h-5 text-[#3E342E]"/><h3 className="font-black text-sm text-[#3E342E]">開放寵物飼養 (將產生特約附件)</h3></div>
                      <input type="checkbox" className="w-6 h-6" checked={draft.allow_pets} onChange={(e) => setDraft({...draft, allow_pets: e.target.checked})} />
                    </div>
                    {draft.allow_pets && (
                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <InputText label="種類(如:貓)" value={draft.pet_type} onChange={(v) => setDraft({...draft, pet_type: v})} />
                        <InputRow label="數量" value={draft.pet_count} onChange={(v) => setDraft({...draft, pet_count: v})} />
                        <InputText label="特徵/名字" value={draft.pet_name} onChange={(v) => setDraft({...draft, pet_name: v})} />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8E7F74]">特別約定與懲罰條款</label>
                  <textarea rows={4} className="w-full bg-[#F9F7F5] rounded-2xl p-4 text-sm font-bold outline-none border border-[#EFEBE8] text-[#3E342E]" value={draft.special_terms} onChange={(e) => setDraft({...draft, special_terms: e.target.value})} />
                </div>
              </section>

              {/* 5. 附件上傳區 */}
              <section className="space-y-4">
                <SectionTitle title="五、數位身分證與照片上傳" />
                
                <div className="space-y-6">
                  {draft.tenants.map((t, idx) => (
                    <div key={`id-tenant-${idx}`} className="bg-white border-2 border-[#EFEBE8] p-4 rounded-xl">
                      <h4 className="font-bold text-sm mb-3 text-[#3E342E]">承租人 {idx + 1}：{t.name || '(未填寫姓名)'} - 身分證上傳</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ImageUploader label="正面" image={t.id_front} onUpload={(e) => handleImageUpload(e, 'person', idx, 'id_front', 'tenants')} onRemove={() => handlePersonChange('tenants', idx, 'id_front', '')} />
                        <ImageUploader label="反面" image={t.id_back} onUpload={(e) => handleImageUpload(e, 'person', idx, 'id_back', 'tenants')} onRemove={() => handlePersonChange('tenants', idx, 'id_back', '')} />
                      </div>
                    </div>
                  ))}
                </div>

                {draft.guarantors.length > 0 && (
                  <div className="space-y-6 mt-6">
                    {draft.guarantors.map((g, idx) => (
                      <div key={`id-guar-${idx}`} className="bg-white border-2 border-[#EFEBE8] p-4 rounded-xl">
                        <h4 className="font-bold text-sm mb-3 text-[#8E7F74]">保證人 {idx + 1}：{g.name || '(未填寫姓名)'} - 身分證上傳</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ImageUploader label="正面" image={g.id_front} onUpload={(e) => handleImageUpload(e, 'person', idx, 'id_front', 'guarantors')} onRemove={() => handlePersonChange('guarantors', idx, 'id_front', '')} />
                          <ImageUploader label="反面" image={g.id_back} onUpload={(e) => handleImageUpload(e, 'person', idx, 'id_back', 'guarantors')} onRemove={() => handlePersonChange('guarantors', idx, 'id_back', '')} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 包租契約不需要傳現況照片 */}
                {draft.contract_type !== 'master' && (
                  <div className="mt-8 bg-[#F9F7F5] p-5 rounded-2xl border border-[#EFEBE8]">
                    <label className="text-sm font-black text-[#3E342E] mb-4 block">房屋現況與設備存證照片 (最多 15 張)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {draft.property_photos.map((photo, idx) => (
                        <ImageUploader key={`prop-photo-${idx}`} label={`照片 ${idx + 1}`} image={photo} isSmall onUpload={(e) => handleImageUpload(e, 'property', idx)} onRemove={() => { const newPhotos = [...draft.property_photos]; newPhotos[idx] = ''; setDraft({...draft, property_photos: newPhotos}); }} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
              </>
            )}

            <div className="pt-6">
              <button onClick={handleGenerateContract} disabled={saving} className="w-full h-16 bg-[#3E342E] text-white rounded-[24px] font-black text-lg flex justify-center items-center gap-2 shadow-xl active:scale-95 transition-all">
                {saving ? '資料處理中...' : <><CheckCircle2 className="w-6 h-6" /> {editingId ? '儲存並覆蓋舊合約' : '儲存並產生正式合約 PDF'}</>}
              </button>
            </div>
          </div>
        )}

        {/* ================= 預覽與列印模式 ================= */}
        {viewMode === 'preview' && viewingContract && (
          <div className="animate-in slide-in-from-bottom-8 max-w-[210mm] mx-auto">
            <div className="flex justify-between items-center mb-6 px-4">
              <h2 className="font-black text-xl text-[#3E342E]">合約文件預覽</h2>
              <button onClick={handlePrint} className="bg-[#3E342E] text-white px-5 py-3 rounded-full text-sm font-black flex items-center gap-2 shadow-lg hover:scale-105 transition-all print:hidden">
                <Printer className="w-5 h-5" /> 匯出 / 列印 PDF
              </button>
            </div>

            <div className="bg-gray-200 p-2 md:p-8 rounded-[12px] shadow-2xl overflow-x-auto print:p-0 print:shadow-none print:bg-transparent">
              <div ref={printRef} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} className="w-[210mm] bg-white text-[#3E342E] mx-auto print:m-0 print:p-0 print:w-full shadow-md print:shadow-none">
                <FullLeaseDocument contract={viewingContract} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ==========================================
// 核心：智慧路由 PDF 渲染引擎
// ==========================================
function FullLeaseDocument({ contract }: { contract: any }) {
  if (contract.contract_type === 'consent') return <ConsentDocument contract={contract} />;
  if (contract.contract_type === 'master') return <MasterLeaseDocument contract={contract} />;
  return <StandardLeaseDocument contract={contract} />;
}

// --- 模板 1：轉租同意書 ---
function ConsentDocument({ contract }: { contract: any }) {
  const details = contract.details || {};
  const tenants = details.tenants && details.tenants.length > 0 ? details.tenants : [{ name: contract.tenant_name }];
  const tenantNames = tenants.map((t:any) => t.name).filter(Boolean).join('、 ');

  return (
    <div className="text-justify text-[12pt] leading-[2] font-serif text-[#3E342E] p-[20mm] min-h-[297mm]">
      <h1 className="text-3xl font-black text-center mb-16 tracking-[0.8em]">轉租同意書</h1>
      <div className="space-y-8">
        <p>立同意書人(即房屋所有權人)： <span className="font-bold border-b border-black px-4">{contract.original_owner || '_________________'}</span> (以下簡稱甲方)</p>
        <p>茲同意承租人： <span className="font-bold border-b border-black px-4">{tenantNames || '_________________'}</span> (以下簡稱乙方)</p>
        <p>就其向甲方承租之房屋(租賃標的： <span className="font-bold border-b border-black px-4">{contract.room_number || '___________'}</span> )，有權於租賃期間內，將該房屋之全部或一部轉租予第三人使用收益。</p>
        <p>甲方承諾於原租賃契約有效期間內，承認乙方與第三人簽訂之轉租契約效力，並不得藉故對第三人主張無權占有。</p>
        
        <div className="mt-20 space-y-12">
          <p>此致</p>
          <p className="font-bold">乙方(轉租人)： {tenantNames || '_________________'}</p>
          
          <div className="mt-24">
            <p className="font-bold mb-12">立同意書人(屋主)簽章：</p>
            <div className="w-64 border-b-2 border-[#3E342E]"></div>
            <p className="mt-6 text-[#8E7F74]">日期：中華民國&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;年&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;日</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 模板 2：包租契約書 (極簡版，加入核實認定之裝潢買回防護機制) ---
function MasterLeaseDocument({ contract }: { contract: any }) {
  const details = contract.details || {};
  const tenants = details.tenants && details.tenants.length > 0 ? details.tenants : [{ name: contract.tenant_name, id_front: '', id_back: '' }];
  const landlordName = details.landlord?.name || contract.landlord_name || '________________';
  const tenantNames = tenants.map((t:any) => t.name).filter(Boolean).join('、 ') || '________________';
  const propertyAddress = details.property_address || contract.room_number || '________________';

  return (
    <div className="text-justify text-[11pt] leading-[1.8] font-serif text-[#3E342E] p-[15mm]">
      {/* 封面 */}
      <div className="break-after-page flex flex-col pt-24 pb-12 min-h-[260mm] px-10 relative">
        <div className="absolute top-10 left-10 w-12 h-[3px] bg-[#3E342E]"></div>
        <div className="absolute bottom-10 right-10 w-[3px] h-12 bg-[#8E7F74]"></div>

        <div className="flex-1 flex flex-col">
          <div className="mt-20 text-left">
            <p className="text-sm uppercase tracking-[0.4em] text-[#8E7F74] mb-6 font-bold">Master Lease Agreement</p>
            <h1 className="text-[2.5rem] md:text-[3rem] font-black tracking-[0.2em] text-[#3E342E] leading-tight">房屋租賃契約書<br/><span className="text-2xl tracking-[0.5em] text-[#8E7F74] mt-2 block">(包租專用)</span></h1>
          </div>

          <div className="mt-auto mb-24 space-y-8 text-lg text-[#3E342E] pl-6 border-l border-[#D1C7C0]">
            <div className="flex items-center">
              <span className="font-bold w-32 tracking-widest text-[#8E7F74] text-sm">出租人(屋主)</span>
              <span className="flex-1 tracking-widest">{landlordName}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-32 tracking-widest text-[#8E7F74] text-sm">承租人(包租)</span>
              <span className="flex-1 tracking-widest">{tenantNames}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-32 tracking-widest text-[#8E7F74] text-sm">租賃標的</span>
              <span className="flex-1 font-bold tracking-widest">{propertyAddress}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-32 tracking-widest text-[#8E7F74] text-sm">租賃期間</span>
              <span className="flex-1 text-base tracking-widest">{contract.start_date ? `${contract.start_date} 起至 ${contract.end_date} 止` : '________________'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 內文 */}
      <div className="break-after-page min-h-[297mm]">
        <h1 className="text-2xl font-black text-center mb-8 tracking-[0.5em] text-[#3E342E]">包租契約書</h1>
        <p className="mb-6">立契約書人：出租人(屋主) <strong>{landlordName}</strong> (以下簡稱甲方)、承租人(包租業) <strong>{tenantNames}</strong> (以下簡稱乙方)，茲為房屋租賃事宜，雙方同意本契約條款如下：</p>

        <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2 mt-6">第一條 租賃標的與轉租權限</h3>
        <div className="pl-4 space-y-2 mb-6">
          <p>1. 房屋座落地址： <strong>{propertyAddress}</strong></p>
          <div className="bg-[#EFEBE8] p-3 rounded mt-2">
            <strong>【關鍵條款：轉租授權】</strong> 甲方同意乙方於租賃期間內，得將本租賃標的物之全部或一部轉租予第三人。甲方不得藉故拒絕或要求額外費用。
          </div>
        </div>

        <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2 mt-6">第二條 租賃期間與裝修免租期</h3>
        <div className="pl-4 space-y-2 mb-6">
          <p>2. 租賃期間：自民國 <strong>{contract.start_date?.split('-')[0] || '___'}</strong> 年 <strong>{contract.start_date?.split('-')[1] || '__'}</strong> 月 <strong>{contract.start_date?.split('-')[2] || '__'}</strong> 日起，至民國 <strong>{contract.end_date?.split('-')[0] || '___'}</strong> 年 <strong>{contract.end_date?.split('-')[1] || '__'}</strong> 月 <strong>{contract.end_date?.split('-')[2] || '__'}</strong> 日止。</p>
          <p><strong>【優惠：裝修免租期】</strong> 甲方同意給予乙方 <strong>{details.free_rent_days || 30}</strong> 天之免租金裝修期(自起租日起算)，期間乙方僅需負擔水電管理費，無須支付租金。</p>
        </div>

        <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2 mt-6">第三條 室內裝修權限與現況返還</h3>
        <div className="pl-4 space-y-2 mb-6">
          <p>3. 乙方得依經營需求進行室內裝修(含格局更動、軟裝佈置等)，惟不得損害原有建築結構安全。</p>
          <p>4. 租期屆滿或終止時，乙方返還房屋之狀態約定為： ☐ 回復原狀 ☑ <strong>現況返還 (乙方同意保留裝潢現有價值無償移轉予甲方，不另要求回復原狀)</strong></p>
        </div>

        {/* ✅ 強大的裝潢殘值買回機制 (改為單據核實認列) */}
        <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2 mt-6">第四條 提前解約與裝潢補償機制</h3>
        <div className="pl-4 space-y-3 mb-6 text-justify">
          <p>5. 租賃期間內，乙方若因經營考量需提前終止本約，應於 <strong>2</strong> 個月前通知甲方，並支付 <strong>1</strong> 個月租金作為違約金後，得終止本約。屋內既有裝潢無償歸甲方所有。</p>
          <div className="border border-[#3E342E] p-4 rounded-xl bg-[#F9F7F5]">
            <p className="font-bold text-[#b91c1c] mb-2">【甲方違約與裝潢殘值買回條款】</p>
            <p>6. 租賃期間內，甲方若因私人因素需提前收回房屋（除乙方重大違約外），應於 <strong>2</strong> 個月前通知乙方，並須無條件退還全額押金。此外，甲方應向乙方支付以下兩項賠償：</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-[#3E342E]">
              <li><strong>一般違約金：</strong> 相當於 1 個月之租金。</li>
              <li><strong>裝潢殘值買回補償金：</strong> 乙方期初投入之裝潢總成本，<strong className="text-[#b91c1c]">以乙方完工後出具之實際裝修憑證（含發票、收據、報價單或匯款證明）總額為準</strong>。若甲方提前終止租約，導致乙方無法攤提裝潢成本，甲方須按「剩餘租期比例」買回裝潢殘值。計算公式為：<br/>
              <span className="bg-white px-2 py-1 inline-block mt-1 font-bold border border-[#D1C7C0]">實際核認裝潢總成本 × (剩餘未滿租期之月數 ÷ 總約定租期月數)</span></li>
            </ul>
            <p className="mt-2 text-sm">甲方須全額支付上述金額後，本契約始得終止，乙方方有返還房屋之義務。</p>
          </div>
        </div>

        <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2 mt-6">第五條 押金與租金</h3>
        <div className="pl-4 space-y-2 mb-10">
          <p>7. 租金每月新台幣 <strong>{contract.rent_amount?.toLocaleString() || 0}</strong> 元整。</p>
          <p>8. 押金為新台幣 <strong>{contract.deposit_amount?.toLocaleString() || 0}</strong> 元整。</p>
        </div>

        <div className="break-inside-avoid mt-16 mb-8 bg-[#F9F7F5] p-6 rounded-xl border border-[#D1C7C0]">
          <h3 className="text-lg font-black border-b-2 border-[#3E342E] pb-2 mb-8 tracking-widest text-center">立契約書人簽章</h3>
          <div className="flex flex-wrap gap-x-12 gap-y-16 justify-center">
            <div className="w-[40%]"><p className="font-bold mb-12 text-[#8E7F74]">出租人 (甲方/屋主) ：</p><div className="border-b border-[#3E342E] w-full"></div></div>
            <div className="w-[40%]"><p className="font-bold mb-12 text-[#8E7F74]">承租人 (乙方/包租業) ：</p><div className="border-b border-[#3E342E] w-full"></div></div>
          </div>
        </div>
      </div>

      {/* 附件：身分證 */}
      <div className="pt-4">
        <h2 className="text-xl font-black text-center border-b-2 border-[#3E342E] pb-2 mb-6 tracking-widest">契約附件 - 身分證影本留存</h2>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-12">
          {/* 出租人身分證 */}
          <div className="break-inside-avoid border-2 border-dashed border-[#D1C7C0] p-6 rounded-2xl bg-white w-full max-w-[450px]">
            <h3 className="text-lg font-black text-center mb-6 text-[#8E7F74] border-b border-[#D1C7C0] pb-2">出租人 (甲方)：{landlordName}</h3>
            <div className="flex flex-row justify-center gap-6">
              <IDCard1to1 src={''} label="正面" />
              <IDCard1to1 src={''} label="反面" />
            </div>
          </div>
          
          {/* 承租人身分證 */}
          {tenants.map((t: any, idx: number) => (
            <div key={`idcard-t-${idx}`} className="break-inside-avoid border-2 border-dashed border-[#D1C7C0] p-6 rounded-2xl bg-[#F9F7F5] w-full max-w-[450px]">
              <h3 className="text-lg font-black text-center mb-6 text-[#3E342E] border-b border-[#D1C7C0] pb-2">承租人 (乙方)：{t.name}</h3>
              <div className="flex flex-row justify-center gap-6">
                <IDCard1to1 src={t.id_front} label="正面" />
                <IDCard1to1 src={t.id_back} label="反面" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// --- 模板 3 & 4：一般出租 & 轉租契約書 (標準版) ---
function StandardLeaseDocument({ contract }: { contract: any }) {
  const details = contract.details || {};
  
  const tenants = details.tenants && details.tenants.length > 0 ? details.tenants : [{ name: contract.tenant_name, id_number: contract.tenant_id_number, phone: contract.tenant_phone, address: details.tenant?.address }];
  const guarantors = details.guarantors || (details.guarantor?.name ? [details.guarantor] : []);
  
  const payment = details.payment || {};
  const fees = details.fees || defaultFees;
  const equipment = details.equipment || defaultEquipment;
  const images = details.images || {};
  const earlyTermAllowed = details.early_termination_allowed ?? true;

  let p_type = '', p_count = 1, p_name = '';
  if (contract.pet_details) {
    const parts = contract.pet_details.split(' / ');
    if (parts.length >= 3) {
      p_type = parts[0].replace('種類:', ''); p_count = Number(parts[1].replace('數量:', '')) || 1; p_name = parts[2].replace('名字:', '');
    } else { p_type = contract.pet_details; }
  }

  const landlordName = details.landlord?.name || contract.landlord_name || '________________';
  const tenantNames = tenants.map((t:any) => t.name).filter(Boolean).join('、 ') || '________________';

  return (
    <div className="text-justify text-[11pt] leading-[1.6] font-serif text-[#3E342E] p-[15mm]">
      
      {/* ---------------- PAGE 0: 專屬無印風封面 ---------------- */}
      <div className="break-after-page flex flex-col pt-24 pb-12 min-h-[260mm] px-10 relative">
        <div className="absolute top-10 left-10 w-12 h-[3px] bg-[#3E342E]"></div>
        <div className="absolute bottom-10 right-10 w-[3px] h-12 bg-[#8E7F74]"></div>

        <div className="flex-1 flex flex-col">
          <div className="mt-20 text-left">
            <p className="text-sm uppercase tracking-[0.4em] text-[#8E7F74] mb-6 font-bold">Residence Lease Agreement</p>
            <h1 className="text-[2.5rem] md:text-[3rem] font-black tracking-[0.8em] text-[#3E342E] leading-tight">租賃契約書</h1>
          </div>

          <div className="mt-auto mb-24 space-y-8 text-lg text-[#3E342E] pl-6 border-l border-[#D1C7C0]">
            <div className="flex items-center">
              <span className="font-bold w-32 tracking-widest text-[#8E7F74] text-sm">出租人</span>
              <span className="flex-1 tracking-widest">{landlordName}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-32 tracking-widest text-[#8E7F74] text-sm">承租人</span>
              <span className="flex-1 tracking-widest">{tenantNames}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-32 tracking-widest text-[#8E7F74] text-sm">承租房號</span>
              <span className="flex-1 font-bold tracking-widest">{contract.room_number || '________________'}</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold w-32 tracking-widest text-[#8E7F74] text-sm">租賃期間</span>
              <span className="flex-1 text-base tracking-widest">{contract.start_date ? `${contract.start_date} 起至 ${contract.end_date} 止` : '________________'}</span>
            </div>
          </div>

          <div className="text-left text-xs tracking-[0.2em] font-bold text-[#B5A59B] mt-10">
            本契約由雙方誠信簽署，各執一份為憑。
          </div>
        </div>
      </div>

      {/* ---------------- 第一段：主約與條款流動區 ---------------- */}
      <div className="break-after-page">
        <h1 className="text-2xl font-black text-center mb-8 tracking-widest text-[#3E342E]">租賃契約書</h1>

        <div className="space-y-4 mb-8 text-sm break-inside-avoid">
          {/* ✅ 動態顯示出租方資訊 (如果是轉租會有公司跟字號) */}
          <div className="flex flex-col gap-1">
             <div className="flex gap-2"><strong className="min-w-[120px] text-[#8E7F74]">出租人 (甲方) :</strong> <span className="font-bold">{landlordName}</span></div>
             {contract.contract_type === 'sublease' && details.landlord?.company && <div className="flex gap-2"><strong className="min-w-[120px] text-[#8E7F74]">統一編號 :</strong> <span>{details.landlord.company}</span></div>}
             {contract.contract_type === 'sublease' && details.landlord?.license && <div className="flex gap-2"><strong className="min-w-[120px] text-[#8E7F74]">登記證字號 :</strong> <span>{details.landlord.license}</span></div>}
          </div>
          
          <div className="border border-[#D1C7C0] p-4 rounded-lg bg-[#F9F7F5] space-y-2">
            <strong className="block mb-2 border-b border-[#D1C7C0] pb-1 text-[#8E7F74]">承租人 (乙方)</strong>
            {tenants.map((t: any, i: number) => (
              <div key={`p1-tenant-${i}`} className="grid grid-cols-2 gap-y-2 gap-x-4">
                <p><strong>姓名 :</strong> <span className="underline decoration-dotted underline-offset-4">{t.name}</span></p>
                <p><strong>身分證字號 :</strong> <span className="underline decoration-dotted underline-offset-4">{t.id_number}</span></p>
                <p><strong>聯絡電話 :</strong> <span className="underline decoration-dotted underline-offset-4">{t.phone}</span></p>
                <p className="col-span-2"><strong>戶籍地址 :</strong> <span className="underline decoration-dotted underline-offset-4">{t.address}</span></p>
                {i !== tenants.length - 1 && <div className="col-span-2 border-b border-dashed border-[#D1C7C0] my-2"></div>}
              </div>
            ))}
          </div>

          {guarantors.length > 0 && (
            <div className="border border-[#D1C7C0] p-4 rounded-lg space-y-2">
              <strong className="block mb-2 border-b border-[#D1C7C0] pb-1 text-[#8E7F74]">保證人</strong>
              {guarantors.map((g: any, i: number) => (
                <div key={`p1-guar-${i}`} className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <p><strong>姓名 :</strong> <span className="underline decoration-dotted underline-offset-4">{g.name}</span></p>
                  <p><strong>身分證字號 :</strong> <span className="underline decoration-dotted underline-offset-4">{g.id_number}</span></p>
                  <p><strong>聯絡電話 :</strong> <span className="underline decoration-dotted underline-offset-4">{g.phone}</span></p>
                  <p className="col-span-2"><strong>戶籍地址 :</strong> <span className="underline decoration-dotted underline-offset-4">{g.address}</span></p>
                  {i !== guarantors.length - 1 && <div className="col-span-2 border-b border-dashed border-[#D1C7C0] my-2"></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-3">一、租金、租期與費用約定</h3>
          <div className="pl-4 space-y-2 text-sm">
            {contract.contract_type === 'sublease' && (
              <div className="p-3 border border-[#3E342E] bg-[#F9F7F5] mb-3 text-justify rounded"><strong>【轉租權利聲明】</strong>本租賃標的物之所有權人為 <span className="font-bold underline decoration-dotted px-2">{contract.original_owner || '__________'}</span>，出租人（甲方）已取得所有權人之書面轉租同意書，具有合法轉租之權利。租賃期間內，甲方保證擁有完整之出租權限。</div>
            )}
            <p><strong>1. 租賃標的：</strong> 承租範圍為 <strong>{contract.room_number}</strong> 房。 (附屬設備詳如後附清單)</p>
            <p><strong>2. 租賃期間：</strong> 自民國 <strong>{contract.start_date?.split('-')[0] || '___'}</strong> 年 <strong>{contract.start_date?.split('-')[1] || '__'}</strong> 月 <strong>{contract.start_date?.split('-')[2] || '__'}</strong> 日起，至民國 <strong>{contract.end_date?.split('-')[0] || '___'}</strong> 年 <strong>{contract.end_date?.split('-')[1] || '__'}</strong> 月 <strong>{contract.end_date?.split('-')[2] || '__'}</strong> 日止。</p>
            <p><strong>3. 租金約定及支付：</strong> 承租人每月房屋租金為新臺幣 <strong>{contract.rent_amount?.toLocaleString() || 0}</strong> 元整，每月為一期，應於每月 1 日前支付，不得藉任何理由拖延或拒絕。</p>
            <p><strong>4. 押金約定及返還：</strong> 押金為新臺幣 <strong>{contract.deposit_amount?.toLocaleString() || 0}</strong> 元整。於租期屆滿或租約終止，承租人返還房屋並抵充債務後無息返還。</p>
            <p><strong>5. 租金支付方式：</strong> {payment.method} {payment.method === '轉帳' ? `(金融機構: ${payment.bank} / 戶名: ${payment.account_name} / 帳號: ${payment.account})` : ''}</p>
            
            <div className="mt-4 break-inside-avoid">
              <p className="font-bold mb-2">6. 租賃期間相關費用之約定：</p>
              <table className="w-full border-collapse border border-[#3E342E] text-xs text-center">
                <tbody>
                  <tr>
                    <td className="border border-[#3E342E] p-2 w-[20%] bg-[#F9F7F5] font-bold text-[#8E7F74]">大樓管理費<br/><span className="text-[9px] font-normal">(大樓維護用)</span></td>
                    <td className="border border-[#3E342E] p-2 w-[30%] text-left pl-3">{fees.management?.payer === '無' ? '☑ 無' : `☑ ${fees.management?.payer}負擔`} {fees.management?.amount > 0 ? `(每月 ${fees.management?.amount} 元)` : ''}</td>
                    <td className="border border-[#3E342E] p-2 w-[20%] bg-[#F9F7F5] font-bold text-[#8E7F74]">水費</td>
                    <td className="border border-[#3E342E] p-2 w-[30%] text-left pl-3">☑ {fees.water?.payer}負擔 ({fees.water?.type})</td>
                  </tr>
                  <tr>
                    <td className="border border-[#3E342E] p-2 bg-[#F9F7F5] font-bold text-[#8E7F74]">空間管理費<br/><span className="text-[9px] font-normal">(代收/網路/清潔)</span></td>
                    <td className="border border-[#3E342E] p-2 text-left pl-3">{fees.space?.payer === '無' ? '☑ 無' : `☑ ${fees.space?.payer}負擔`} {fees.space?.amount > 0 ? `(每月 ${fees.space?.amount} 元)` : ''}</td>
                    <td className="border border-[#3E342E] p-2 bg-[#F9F7F5] font-bold text-[#8E7F74]">電費</td>
                    <td className="border border-[#3E342E] p-2 text-left pl-3 leading-tight">
                      ☑ {fees.electricity?.payer}負擔<br/>
                      {fees.electricity?.billing_method === '依當期每度平均電價' && '以用電度數計費：每期依電費單之「當期每度平均電價」計收。'}
                      {fees.electricity?.billing_method === '台電帳單自行繳納' && '依台電帳單自行繳納。'}
                      {fees.electricity?.billing_method === '按度計費' && `以用電度數計費：每度約定 ${fees.electricity?.rate} 元計收。`}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#3E342E] p-2 bg-[#F9F7F5] font-bold text-[#8E7F74]">網路費</td>
                    <td className="border border-[#3E342E] p-2 text-left pl-3">☑ {fees.internet?.payer}負擔 ({fees.internet?.type})</td>
                    <td className="border border-[#3E342E] p-2 bg-[#F9F7F5] font-bold text-[#8E7F74]">稅費約定</td>
                    <td className="border border-[#3E342E] p-2 text-left pl-3">房屋地價稅由出租人負擔。<br/>辦理公證： ☐ 是 ☑ 否</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">二、使用限制與規範</h3>
          <div className="pl-4 space-y-1 text-sm">
            <p><strong>僅供居住使用：</strong> 承租人不得將其變更用途、設立登記。</p>
            <p><strong>遵守社區規範：</strong> 承租人同意遵守規約，不得違法使用、惡意行為、存放危險物品。</p>
            <p><strong>禁止轉租：</strong> 未經同意不得轉租、出借或轉讓租賃權。</p>
          </div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">三、修繕責任</h3>
          <div className="pl-4 space-y-1 text-sm">
            <p>租賃住宅或附屬設備損壞時，應由出租人負責修繕。但可歸責於承租人之事由者，不在此限。</p>
            <p>出租人為修繕所為之必要行為，應先期通知，承租人無正當理由不得拒絕。</p>
          </div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">四、室內裝修</h3>
          <div className="pl-4 space-y-1 text-sm">
            <p>承租人裝修應經出租人同意並依法辦理，且不得損害結構安全。增設部分損壞由承租人修繕。</p>
            <p>前項情形承租人返還租賃住宅時應： ☐ 回復原狀 ☑ 現況返還 ☐ 其他</p>
          </div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">五、承租人之義務及責任</h3>
          <div className="pl-4 space-y-1 text-sm">
            <p>承租人應出示身分證明供核對，並以善良管理人之注意保管使用住宅。</p>
            <p>違反義務致損壞者，應負損害賠償責任。賠償金額得由押金中抵充。</p>
            {contract.contract_type === 'sublease' && (
              <div className="bg-[#EFEBE8] p-3 mt-3 text-justify rounded"><strong>【權利連鎖終止條款】</strong> 如因不可歸責於甲方之事由（如原所有權人提前收回房屋等），致本契約無法繼續履行時，甲方應協助乙方遷讓並退還已付未用之租金及全額押金，但不負擔額外之賠償責任。</div>
            )}
          </div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">六、任意終止租約</h3>
          <div className="pl-4 space-y-1 text-sm">
            <p>租賃雙方 {earlyTermAllowed ? '☑ 得 ☐ 不得' : '☐ 得 ☑ 不得'} 任意終止租約。</p>
            <p>得終止者，應於一個月前通知，未先期通知者應賠償最高一個月租金之違約金。</p>
          </div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">七、寵物飼養與違約責任</h3>
          <div className="pl-4 space-y-2 text-sm text-justify">
            <p>本租賃標的原則上禁止飼養寵物（包含但不限於狗、貓、爬蟲類等），除經出租人書面同意並簽署寵物條款者不在此限。針對寵物飼養行為，雙方同意依下列規範辦理：</p>
            <p><strong>1. 未經同意擅自飼養（偷養）之罰則：</strong> 若乙方未經書面同意，擅自攜帶寵物進入租賃標的飼養（包含暫放），視為重大違約：</p>
            <ul className="list-disc pl-8 space-y-0.5">
              <li><strong>懲罰性違約金：</strong> 乙方應支付相當於一個月租金之懲罰性違約金。</li>
              <li><strong>限期遷離：</strong> 乙方應於甲方發現並通知後 3 日內 將寵物遷離。</li>
              <li><strong>強制清潔費：</strong> 乙方需負擔全室專業除蟲、消毒及細部清潔費用。</li>
              <li><strong>終止契約：</strong> 若乙方拒絕將寵物遷離，甲方得終止租約。</li>
            </ul>
            <p><strong>2. 經同意飼養但造成滋擾（吵鬧/異味）之罰則：</strong> 若該寵物之行為干擾鄰居安寧或公共衛生，遭投訴達 2 次（含）以上者：</p>
            <ul className="list-disc pl-8 space-y-0.5">
              <li><strong>撤銷飼養許可：</strong> 甲方有權撤銷飼養許可，乙方應於 7 日內 將寵物遷離。</li>
              <li><strong>損害賠償：</strong> 若導致甲方遭管委會裁罰，乙方應負擔全額罰款及賠償。</li>
              <li><strong>終止契約：</strong> 若未將寵物遷離或再度私自带回，甲方得終止租賃契約。</li>
            </ul>
          </div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">八、租賃住宅之返還</h3>
          <div className="pl-4 space-y-1 text-sm">
            <p>1. 租約終止時，應結算費用並會同點交，將住宅返還。未依約返還者，應支付相當月租金額及違約金。</p>
            <p>2. <strong>不定期租約之排除：</strong>本契約租期屆滿，租賃關係即行消滅，雙方不同意本租賃契約於期限屆滿後自動轉為不定期租賃。如有意續租，應另行簽訂新約。</p>
          </div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">九、其他條款</h3>
          <div className="pl-4 space-y-1 text-sm"><p>出租人轉讓所有權，本契約對受讓人仍繼續存在(買賣不破租賃)。</p></div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">十、出租人提前終止</h3>
          <div className="pl-4 space-y-1 text-sm"><p>有下列情形之一，出租人得提前終止租約：1.重新建築 2.遲付租金/費用達二個月 3.違法使用/危險物品 4.擅自轉租/裝修/損壞不修繕等。</p></div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">十一、遺留物處理</h3>
          <div className="pl-4 space-y-1 text-sm"><p>點交後仍有遺留物，經催告不取回者，視為拋棄所有權。處理費用得由押金抵充。</p></div>
        </div>

        <div className="break-inside-avoid mb-6">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">十二、通知方式</h3>
          <div className="pl-4 space-y-1 text-sm"><p>雙方通知以契約地址郵寄，或以通訊軟體(Email/LINE/簡訊)為之。</p></div>
        </div>

        <div className="break-inside-avoid mb-10">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mb-2">十三、契約效力</h3>
          <div className="pl-4 space-y-1 text-sm"><p>本契約自簽約日起生效，雙方各執一份。廣告及附件為本契約之一部分。</p></div>
        </div>

        {/* 簽名區塊保護不被切斷 */}
        <div className="break-inside-avoid mt-12 mb-8 bg-[#F9F7F5] p-6 rounded-xl border border-[#D1C7C0]">
          <h3 className="text-lg font-black border-b-2 border-[#3E342E] pb-2 mb-8 tracking-widest text-center">立契約書人簽章</h3>
          <div className="flex flex-wrap gap-x-12 gap-y-16 justify-center">
            <div className="w-[40%]"><p className="font-bold mb-12 text-[#8E7F74]">出租人 (甲方) ：</p><div className="border-b border-[#3E342E] w-full"></div></div>
            
            {tenants.map((t: any, i: number) => (
              <div key={`sig-t-${i}`} className="w-[40%]"><p className="font-bold mb-12 text-[#8E7F74]">承租人 (乙方) {tenants.length > 1 ? i+1 : ''}：</p><div className="border-b border-[#3E342E] w-full"></div></div>
            ))}

            {guarantors.map((g: any, i: number) => (
              <div key={`sig-g-${i}`} className="w-[40%]"><p className="font-bold mb-12 text-[#8E7F74]">保證人 {guarantors.length > 1 ? i+1 : ''}：</p><div className="border-b border-[#3E342E] w-full"></div></div>
            ))}
          </div>
        </div>

      </div>

      {/* ---------------- 附件：設備點交 ---------------- */}
      <div className="break-after-page pt-4">
        <div className="break-inside-avoid">
          <h2 className="text-xl font-black text-center border-b-2 border-[#3E342E] pb-2 mb-6 tracking-widest">附件：附屬設備與點交清單</h2>
          <p className="text-xs mb-3 text-[#8E7F74]">(以下項目請於簽約點交時確認數量，現狀交屋建議拍照存證)</p>

          <table className="w-full border-collapse border border-[#3E342E] text-sm text-center mb-6">
            <thead>
              <tr className="bg-[#F9F7F5] text-[#3E342E]">
                <th className="border border-[#3E342E] p-2 w-[12%]">區域</th>
                <th className="border border-[#3E342E] p-2 w-[20%]">設備名稱</th>
                <th className="border border-[#3E342E] p-2 w-[18%]">品牌 / 規格</th>
                <th className="border border-[#3E342E] p-2 w-[8%]">數量</th>
                <th className="border border-[#3E342E] p-2 w-[27%]">點交現況</th>
                <th className="border border-[#3E342E] p-2 w-[15%]">約定賠償金額</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((eq: any, i: number) => (
                <tr key={i}>
                  <td className="border border-[#3E342E] p-2">{eq.area}</td>
                  <td className="border border-[#3E342E] p-2 font-bold">{eq.name}</td>
                  <td className="border border-[#3E342E] p-2 text-xs text-[#8E7F74]">{eq.brand || ''}</td>
                  <td className="border border-[#3E342E] p-2">{eq.quantity || 1}</td>
                  <td className="border border-[#3E342E] p-2 text-left px-3 text-xs leading-tight">
                    {eq.status === '正常' ? '☑正常 ☐瑕疵' : '☐正常 ☑瑕疵'}
                    {eq.remark ? <span className="block text-[10px] mt-1 text-[#8E7F74]">備註: {eq.remark}</span> : ''}
                  </td>
                  <td className="border border-[#3E342E] p-2 font-black text-lg">
                    {eq.compensation ? `$${Number(eq.compensation).toLocaleString()}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="break-inside-avoid pl-4 space-y-2 text-xs text-justify mb-10 text-[#3E342E]">
          <p className="font-black text-sm text-[#8E7F74] bg-[#F9F7F5] inline-block px-2 py-1 mb-1">【損壞賠償計算標準（補充條款）】</p>
          <p>若發生設備損壞或遺失，且該項目未列於上表，或上表金額欄位空白時，雙方同意依下列標準計算賠償金額：</p>
          <p>1. <strong>修繕優先原則：</strong> 若設備損壞可經由維修恢復功能及美觀，承租人應負擔全額維修費用。若無法修繕、或修繕費用超過重置成本之 60% 時，視為不堪使用，需進行金錢賠償。</p>
          <p>2. <strong>折舊賠償公式：</strong> 賠償金額以損壞當時之「同級新品市價」（重置成本）為基準，依設備使用年限按下列比例折舊計算殘值：使用 1 年內賠償 90%；1~3 年內 70%；3~5 年內 50%；5 年以上 20%（作為基本殘值）。</p>
          <p>3. <strong>衍生費用負擔：</strong> 上述賠償金額僅為物品本身之價值，不包含購買新品所產生之運送費、樓層搬運費及安裝工資，上述衍生費用概由承租人全額負擔。</p>
          <p>4. <strong>消耗性軟裝特別約定：</strong> 針對床墊、沙發布套、地毯、窗簾等軟裝，若發生嚴重髒汙（如嘔吐物、尿漬、飲料潑灑等）致無法完全清潔或殘留異味，視同不堪使用，承租人須依上述折舊標準負擔換新費用，不得要求僅支付清潔費。</p>
        </div>

        <div className="break-inside-avoid">
          <h3 className="text-md font-bold border-l-4 border-[#3E342E] pl-2 bg-[#F9F7F5] py-1 mt-4 mb-3">附件：其他約定事項協議</h3>
          <div className="pl-4 space-y-3 text-sm text-justify">
            <p><strong>1. 消耗性物品：</strong> 本房屋內所需更換之消耗性物品由使用者自行負責（例：燈管、燈泡、電池、遙控器電池、濾心...等）。</p>
            <p><strong>2. 退租清潔：</strong> 承租人於合約期滿後退租時，應自行於房屋使用範圍內清潔乾淨（包含廢棄物清運），經由出租人確認無誤後方可完成退租點交。若承租人於退租時無自行清潔，則由出租人代為尋找合法立案之清潔公司進行清潔/消毒，其清潔費用將由承租人負擔（可由押金扣除）。</p>
            <p><strong>3. 手動補充約定：</strong></p>
            <p className="whitespace-pre-line font-bold bg-[#F9F7F5] p-5 border border-[#D1C7C0] rounded-lg text-base leading-relaxed">{contract.special_terms}</p>
          </div>
        </div>
      </div>

      {/* ---------------- 附件：寵物特約 ---------------- */}
      {contract.allow_pets && (
        <div className="break-after-page pt-4">
          <div className="break-inside-avoid">
            <h2 className="text-xl font-black text-center border-b-2 border-[#3E342E] pb-2 mb-6 tracking-widest">房屋租賃契約：寵物飼養特約切結書 (附件)</h2>
            <p className="text-sm mb-8 text-justify bg-[#F9F7F5] p-4 rounded-lg">本附件為「房屋租賃契約書」之組成部分，與主契約具同等法律效力。承租人向出租人承租位於 <strong className="text-lg">{contract.room_number}</strong> 之房屋，經同意得飼養寵物，承租人承諾遵守以下條款：</p>
            
            <div className="space-y-6 text-sm text-justify px-4">
              <div className="break-inside-avoid">
                <h4 className="font-bold border-l-4 border-[#3E342E] pl-2 bg-[#EFEBE8] py-1 mb-2">一、 寵物基本資料</h4>
                <p><strong>種類/品種：</strong> {p_type}</p>
                <p><strong>數量：</strong> {p_count} 隻（未經同意，不得擅自增加數量或更換品種）</p>
                <p><strong>寵物姓名/特徵：</strong> {p_name}</p>
              </div>
              <div className="break-inside-avoid">
                <h4 className="font-bold border-l-4 border-[#3E342E] pl-2 bg-[#EFEBE8] py-1 mb-2">二、 衛生與環境維護</h4>
                <p><strong>清潔義務：</strong> 定期為寵物除蟲、施打疫苗，並隨時保持室內外環境整潔。屋內不得有明顯異味、毛髮殘留或跳蚤滋生。</p>
                <p><strong>公共區域規範：</strong> 寵物於公共空間移動時，應確實使用牽繩、提籠或推車。嚴禁寵物於公共區域隨地便溺，若不慎發生應立即清理並消毒。</p>
              </div>
              <div className="break-inside-avoid">
                <h4 className="font-bold border-l-4 border-[#3E342E] pl-2 bg-[#EFEBE8] py-1 mb-2">三、 安寧維護與擾鄰處理</h4>
                <p><strong>噪音管制：</strong> 應妥善管教寵物，確保其不於任何時段（特別是夜間 22:00 至清晨 08:00）吠叫或發出噪音干擾鄰里安寧。</p>
                <p><strong>違約界定：</strong> 若經管委會投訴或鄰居反映達兩次（含）以上，視同違約，出租人有權提前終止租約，承租人應配合搬遷且不得要求補償。</p>
              </div>
              <div className="break-inside-avoid">
                <h4 className="font-bold border-l-4 border-[#3E342E] pl-2 bg-[#EFEBE8] py-1 mb-2">四、 損害賠償責任</h4>
                <p><strong>毀損賠償：</strong> 若因寵物行為導致房屋結構、固定設備或提供之家具損壞（含抓痕、啃咬、尿漬、異味滲透），應負擔全額維修或「恢復原狀」之費用。</p>
                <p><strong>新品更換：</strong> 若損壞部分無法修復或修復後仍留有明顯痕跡，應依該物品之新品市價照價賠償，不得異議。</p>
              </div>
              <div className="break-inside-avoid">
                <h4 className="font-bold border-l-4 border-[#3E342E] pl-2 bg-[#EFEBE8] py-1 mb-2">五、 退租還屋規定</h4>
                <p><strong>強制清潔：</strong> 租約期滿或終止時，須自費聘請專業清潔公司進行全屋「除蚤、殺菌及除臭」深層清潔，並於交屋時出具證明。</p>
                <p><strong>代為處理：</strong> 若未執行或清潔成果未達要求，出租人得自行雇工處理，所需費用由押金中全額扣除，若不足扣抵應另行補足。</p>
              </div>
              
              <div className="break-inside-avoid border border-[#EFEBE8] p-5 rounded-xl bg-white shadow-sm mt-4">
                <h4 className="font-bold border-l-4 border-[#3E342E] pl-2 bg-[#EFEBE8] py-1 mb-2">六、 緊急處置條款</h4>
                <p>若承租人失聯或發生意外，導致寵物於屋內無人照料影響動物福祉或環境衛生，出租人得在第三方陪同下進入房屋處置，承租人願負擔相關衍生費用。</p>
                
                <div className="mt-10 text-right pr-4">
                  <p className="font-bold text-lg mb-4 text-[#8E7F74]">承租人同意簽章確認</p>
                  <div className="inline-block border-b-2 border-[#3E342E] w-64 pt-6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 附件：身分證影本留存 ---------------- */}
      <div className="break-after-page pt-4">
        <h2 className="text-xl font-black text-center border-b-2 border-[#3E342E] pb-2 mb-6 tracking-widest">契約附件 - 身分證影本留存</h2>
        <p className="text-center text-xs text-[#8E7F74] mb-10">※ 以下影本僅供本次房屋租賃契約身分核對與留存使用，禁止挪作他用。</p>
        
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-12">
          {tenants.map((t: any, idx: number) => (
            <div key={`idcard-t-${idx}`} className="break-inside-avoid border-2 border-dashed border-[#D1C7C0] p-6 rounded-2xl bg-[#F9F7F5] w-full max-w-[450px]">
              <h3 className="text-lg font-black text-center mb-6 text-[#3E342E] border-b border-[#D1C7C0] pb-2">承租人 {idx+1}：{t.name}</h3>
              <div className="flex flex-row justify-center gap-6">
                <IDCard1to1 src={t.id_front} label="正面" />
                <IDCard1to1 src={t.id_back} label="反面" />
              </div>
            </div>
          ))}

          {guarantors.map((g: any, idx: number) => (
            <div key={`idcard-g-${idx}`} className="break-inside-avoid border-2 border-dashed border-[#D1C7C0] p-6 rounded-2xl bg-white w-full max-w-[450px]">
              <h3 className="text-lg font-black text-center mb-6 text-[#8E7F74] border-b border-[#D1C7C0] pb-2">保證人 {idx+1}：{g.name}</h3>
              <div className="flex flex-row justify-center gap-6">
                <IDCard1to1 src={g.id_front} label="正面" />
                <IDCard1to1 src={g.id_back} label="反面" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- 附件：房屋現況照片 ---------------- */}
      <div className="pt-4">
        <h2 className="text-xl font-black text-center border-b-2 border-[#3E342E] pb-2 mb-6 tracking-widest">附件：房屋現況照片確認書</h2>
        <p className="text-xs mb-6 text-center text-[#8E7F74]">以下照片為雙方點交時之房屋與設備現況存證</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.property_photos?.map((photo: string, idx: number) => (
             <div key={idx} className="break-inside-avoid border-[3px] border-[#EFEBE8] h-[180px] flex items-center justify-center overflow-hidden bg-[#F9F7F5] relative rounded-xl shadow-sm">
               {photo ? <img src={photo} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-[#D1C7C0] tracking-widest">存證照片 {idx + 1}</span>}
               <div className="absolute top-2 left-2 bg-[#3E342E]/80 backdrop-blur-sm text-white text-xs font-black px-3 py-1 rounded-lg shadow-sm">#{idx + 1}</div>
             </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 輔助 UI 元件庫
// ==========================================

// ✅ 1:1 實體比例身分證防偽浮水印元件 (85.6mm x 54mm)
function IDCard1to1({ src, label }: { src: string, label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-black text-[#8E7F74] mb-2 tracking-widest bg-white px-3 py-0.5 rounded-full border border-[#EFEBE8] shadow-sm">{label}</span>
      <div className="w-[85.6mm] h-[54mm] relative flex justify-center items-center overflow-hidden border-2 border-[#D1C7C0] rounded-xl bg-white shrink-0 print:border-[#8E7F74] box-border shadow-inner">
        {src ? (
          <>
            <img src={src} className="w-full h-full object-contain p-1" alt={label} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{ color: 'rgba(142, 127, 116, 0.45)', borderColor: 'rgba(142, 127, 116, 0.45)' }} className="font-black text-2xl -rotate-[15deg] tracking-[0.2em] border-[3px] px-3 py-1.5 rounded-xl whitespace-nowrap">
                僅供租賃使用
              </div>
            </div>
          </>
        ) : (
          <span className="text-[#D1C7C0] text-sm font-bold tracking-widest">{label}影本黏貼處</span>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) { return <h3 className="text-md font-black text-white bg-[#3E342E] px-4 py-2 rounded-xl inline-block shadow-sm tracking-widest">{title}</h3>; }

interface CardProps { icon: React.ReactNode; title: string; onClick: () => void; }
function ContractTypeCard({ icon, title, onClick }: CardProps) { return <div onClick={onClick} className="bg-white p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer border border-[#EFEBE8] hover:border-[#3E342E] transition-all active:scale-95 group"><div className="bg-[#F9F7F5] p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">{icon}</div><h3 className="font-black text-sm text-[#3E342E]">{title}</h3></div>; }

interface InputProps { label: string; value: string | number; onChange: (v: string) => void; placeholder?: string; }
function InputText({ label, value, onChange, placeholder }: InputProps) { return <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">{label}</label><input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-12 bg-white border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold focus:border-[#3E342E] outline-none" /></div>; }
function InputDate({ label, value, onChange }: InputProps) { return <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">{label}</label><input type="date" value={value as string} onChange={(e) => onChange(e.target.value)} className="w-full h-12 bg-white border border-[#EFEBE8] rounded-xl px-4 text-sm font-bold outline-none text-[#3E342E]" /></div>; }
function InputRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void; }) { return <div className="space-y-1"><label className="text-[10px] font-black text-[#8E7F74]">{label}</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D1C7C0]">NT$</span><input type="number" value={value || ''} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-12 bg-white border border-[#EFEBE8] rounded-xl pl-12 pr-4 text-sm font-bold outline-none text-[#3E342E]" /></div></div>; }

interface ImageUploaderProps { label: string; image: string; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: () => void; isSmall?: boolean; }
function ImageUploader({ label, image, onUpload, onRemove, isSmall }: ImageUploaderProps) {
  return (
    <div className={`relative bg-white border-2 border-dashed border-[#D1C7C0] rounded-xl flex flex-col items-center justify-center overflow-hidden hover:border-[#3E342E] transition-all ${isSmall ? 'h-24' : 'h-32'}`}>
      {image ? <img src={image} className="w-full h-full object-cover opacity-80" /> : <div className="flex flex-col items-center text-[#8E7F74]"><Camera className={`${isSmall ? 'w-5 h-5' : 'w-8 h-8'} mb-1`} /><span className={`font-bold ${isSmall ? 'text-[9px]' : 'text-xs'}`}>{label}</span></div>}
      <input type="file" accept="image/*" onChange={onUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      {image && <button onClick={onRemove} className="absolute bottom-1 right-1 bg-red-500 text-white p-1 rounded-md z-10"><Trash2 className="w-3 h-3" /></button>}
    </div>
  );
}