"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, ChevronRight, Plus, Loader2, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 新增房產表單專屬狀態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: '',
    address: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      // 1. 抓取所有房產
      const { data: props, error: propsError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (propsError) throw propsError;

      // 2. 🌟 抓取所有房間，準備進行配對計算！
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('property_id, tenant_name');
        
      if (roomsError) throw roomsError;

      // 3. 🌟 自動幫每一棟大樓算房間數與出租數
      const enrichedProps = (props || []).map(prop => {
        const myRooms = (rooms || []).filter(r => r.property_id === prop.id);
        const total = myRooms.length;
        const occupied = myRooms.filter(r => r.tenant_name).length;
        
        // 聰明判斷狀態：如果房間大於0且全部租出，自動變「滿租」！
        let currentStatus = '招租中';
        if (total > 0 && total === occupied) currentStatus = '滿租';
        if (total === 0) currentStatus = '待建房';

        return {
          ...prop,
          units: total, // 覆寫成真實總房間數
          occupied: occupied, // 覆寫成真實已租數量
          status: currentStatus // 覆寫成動態狀態
        };
      });

      setProperties(enrichedProps);
    } catch (error: any) {
      console.error('❌ 讀取房產失敗:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProperty = async () => {
    if (!newProperty.name) {
      alert('請至少輸入房產名稱！');
      return;
    }
    
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('properties')
        .insert([
          {
            name: newProperty.name,
            address: newProperty.address,
            status: 'vacant', // 這裡不管填什麼，現在都會被上面動態計算覆寫！
            units: 0,
            occupied: 0
          }
        ]);

      if (error) throw error;
      
      alert(`✅ 成功建立 ${newProperty.name}！`);
      setIsAddModalOpen(false); 
      setNewProperty({ name: '', address: '' }); 
      fetchProperties(); 
      
    } catch (error: any) {
      alert('❌ 新增房產失敗：' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 text-[#3E342E]">
      <div className="flex items-center justify-between bg-white p-5 shadow-sm">
        <Link href="/" className="rounded-full p-2 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} color="#3E342E" />
        </Link>
        <h1 className="text-lg font-bold text-[#8E7F74]">資產管家</h1>
        <div className="w-10"></div>
      </div>

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">我的房產 ({properties.length})</h2>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 rounded-full bg-[#EFEBE8] px-3 py-1.5 text-xs font-bold text-[#8E7F74] transition-colors hover:bg-[#D1C4BC] hover:text-white"
          >
            <Plus size={16} /> 新增
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#8E7F74]">
            <Loader2 size={32} className="mb-4 animate-spin" />
            <p className="text-sm font-bold">精算各館數據中...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="font-bold">目前還沒有房產資料喔！</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {properties.map(prop => (
              <Link href={`/properties/${prop.id}`} key={prop.id}>
                <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFEBE8]">
                      <Building2 size={24} color="#8E7F74" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{prop.name || '未命名房產'}</h3>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                        <MapPin size={12} /> {prop.address || '尚未設定地址'}
                      </div>
                      <div className="mt-1.5 text-[11px] font-semibold text-[#8E7F74]">
                        {/* 🌟 這裡現在顯示的是「真實動態數據」了！ */}
                        {prop.occupied} / {prop.units} 間出租 • 
                        <span className={prop.status === '滿租' ? 'ml-1 text-green-600' : prop.status === '待建房' ? 'ml-1 text-gray-400' : 'ml-1 text-orange-500'}>
                          {prop.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} color="#D1C4BC" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#3E342E]">新增房產</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#8E7F74]">房產/館別名稱 <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                  className="w-full rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] p-4 font-bold text-[#3E342E] outline-none focus:border-[#B5A59B]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-[#8E7F74]">完整地址</label>
                <input 
                  type="text" 
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                  className="w-full rounded-xl border border-[#EFEBE8] bg-[#F9F7F5] p-4 font-bold text-[#3E342E] outline-none focus:border-[#B5A59B]"
                />
              </div>
            </div>
            <button 
              onClick={handleAddProperty}
              disabled={!newProperty.name || isAdding}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E342E] py-4 font-bold text-white transition-all hover:bg-black disabled:bg-gray-300"
            >
              {isAdding ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {isAdding ? '建立中...' : '確認並建立房產'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}