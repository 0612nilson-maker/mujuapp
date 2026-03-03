"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Droplets, Users, FileText, Wrench, Loader2 } from 'lucide-react';
// 🌟 這裡只需退三層：../../..
import { supabase } from '../../../lib/supabase';

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (propertyId) fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase.from('properties').select('*').eq('id', propertyId).single(); 
      if (error) throw error;
      if (data) setProperty(data);
    } catch (error: any) {
      console.error('❌ 讀取失敗:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#F9F7F5]"><Loader2 className="animate-spin text-[#8E7F74]" /></div>;

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 text-[#3E342E]">
      <div className="flex items-center justify-between bg-white p-5 shadow-sm">
        <Link href="/properties" className="rounded-full p-2"><ArrowLeft size={24} color="#3E342E" /></Link>
        <h1 className="text-lg font-bold text-[#8E7F74]">房產詳情</h1>
        <div className="w-10"></div>
      </div>
      <div className="p-6">
        <div className="mb-8 rounded-3xl bg-[#B5A59B] p-6 shadow-lg text-white">
          <h2 className="text-2xl font-bold">{property?.name || '未命名'}</h2>
          <p className="mt-2 flex items-center gap-1 text-xs text-white/80"><MapPin size={14} /> {property?.address}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link href={`/properties/${propertyId}/meter`} className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-3 rounded-2xl bg-blue-50 p-3"><Droplets size={28} className="text-blue-500" /></div>
            <span className="font-bold">水電抄表</span>
          </Link>
          <Link href={`/properties/${propertyId}/tenants`} className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-3 rounded-2xl bg-orange-50 p-3"><Users size={28} className="text-orange-500" /></div>
            <span className="font-bold">租客管理</span>
          </Link>
          <Link href={`/properties/${propertyId}/finance`} className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-3 rounded-2xl bg-green-50 p-3"><FileText size={28} className="text-green-500" /></div>
            <span className="font-bold">財務報表</span>
          </Link>
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-sm opacity-50">
            <div className="mb-3 rounded-2xl bg-red-50 p-3"><Wrench size={28} className="text-red-500" /></div>
            <span className="font-bold">報修管理</span>
          </div>
        </div>
      </div>
    </div>
  );
}