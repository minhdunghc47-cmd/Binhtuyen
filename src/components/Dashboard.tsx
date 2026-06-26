/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Facility, Task, FundTransaction } from '../types';
import { Shield, AlertTriangle, ListChecks, Wallet, Send, Eye, CheckCircle, Activity, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { MANAGERS } from '../data';

interface DashboardProps {
  facilities: Facility[];
  tasks: Task[];
  funds: FundTransaction[];
  onSwitchTab: (tab: string) => void;
  onRemindUser: (managerName: string) => void;
}

export default function Dashboard({
  facilities,
  tasks,
  funds,
  onSwitchTab,
  onRemindUser,
}: DashboardProps) {
  // Compute basic stats
  const activeFacilities = facilities.filter((f) => f.recordStatus !== 'da_nop_luu');
  const totalFacilities = facilities.filter((f) => f.recordStatus === 'hien_hanh').length;
  const pendingTasks = tasks.filter((t) => !t.isCompleted).length;

  // Calculat fund balance
  const totalIn = funds
    .filter((f) => f.type === 'thu')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalOut = funds
    .filter((f) => f.type === 'chi')
    .reduce((sum, f) => sum + f.amount, 0);
  const fundBalance = totalIn - totalOut;

  // Compute facilities due for inspection
  // Nhóm 1: 1 year (365 days)
  // Nhóm 2: 2 years (730 days)
  const today = new Date();
  
  const dueFacilitiesList = activeFacilities.filter((f) => {
    if (f.group !== 'Nhóm 1' && f.group !== 'Nhóm 2') return false;
    const inspectDateStr = f.lastInspectionDate;
    if (!inspectDateStr) return true; // Never inspected is overdue
    
    const lastInspect = new Date(inspectDateStr);
    const diffTime = Math.abs(today.getTime() - lastInspect.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (f.group === 'Nhóm 1' && diffDays >= 365) return true;
    if (f.group === 'Nhóm 2' && diffDays >= 730) return true;
    return false;
  });
  
  const dueFacilitiesCount = dueFacilitiesList.length;

  // Compute type counts for mini chart
  const typeCounts: Record<string, number> = {};
  activeFacilities.forEach((f) => {
    const t = f.facilityType || 'Chưa phân loại';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  // Calculate manager performance
  const managerStats = MANAGERS.map((mgr) => {
    const mgrTasks = tasks.filter((t) => t.assignee === mgr);
    const total = mgrTasks.length;
    const completed = mgrTasks.filter((t) => t.isCompleted).length;
    const overdue = mgrTasks.filter(
      (t) => !t.isCompleted && t.deadline && new Date(t.deadline + 'T23:59:59') < today
    ).length;
    const kpi = total === 0 ? 100 : Math.round((completed / total) * 100);
    return { name: mgr, total, completed, overdue, kpi };
  });

  interface UrgentItem {
    id: string;
    type: 'overdue_task' | 'unscheduled_inspection' | 'missing_plan';
    title: string;
    description: string;
    targetId?: string;
    meta?: any;
  }

  const urgentItems: UrgentItem[] = [];

  // 1. Overdue Tasks from Kanban
  tasks.forEach((t) => {
    if (!t.isCompleted && t.deadline) {
      const deadlineDate = new Date(t.deadline + 'T23:59:59');
      if (deadlineDate < today) {
        urgentItems.push({
          id: `task-overdue-${t.id}`,
          type: 'overdue_task',
          title: `Nhiệm vụ quá hạn: ${t.title}`,
          description: `Giao cho: ${t.assignee} | Hạn chót: ${new Date(t.deadline).toLocaleDateString('vi-VN')}`,
          targetId: t.id,
          meta: { assignee: t.assignee }
        });
      }
    }
  });

  // 2. Overdue Inspections (Unscheduled)
  activeFacilities.forEach((f) => {
    const hasPendingTask = tasks.some((t) => !t.isCompleted && (t.facilityId === f.id || (t.title && t.title.includes(f.name))));
    if (hasPendingTask) return;

    if (f.group === 'Nhóm 1' || f.group === 'Nhóm 2') {
      const inspectDateStr = f.lastInspectionDate;
      let isOverdue = false;
      let diffDays = 0;
      if (!inspectDateStr) {
        isOverdue = true;
      } else {
        const lastInspect = new Date(inspectDateStr);
        const diffTime = Math.abs(today.getTime() - lastInspect.getTime());
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (f.group === 'Nhóm 1' && diffDays >= 365) isOverdue = true;
        if (f.group === 'Nhóm 2' && diffDays >= 730) isOverdue = true;
      }

      if (isOverdue) {
        const cycleText = f.group === 'Nhóm 1' ? '1 năm' : '2 năm';
        const lastInspectText = inspectDateStr ? `Lần cuối: ${new Date(inspectDateStr).toLocaleDateString('vi-VN')} (${diffDays} ngày trước)` : 'Chưa từng kiểm tra';
        urgentItems.push({
          id: `inspect-overdue-${f.id}`,
          type: 'unscheduled_inspection',
          title: `Cơ sở quá hạn chu kỳ (${cycleText}): ${f.name}`,
          description: `${lastInspectText} | Cán bộ phụ trách: ${f.manager}`,
          targetId: f.id,
          meta: { manager: f.manager }
        });
      }
    }
  });

  // 3. Missing Plan Number
  activeFacilities.forEach((f) => {
    if (!f.planNum) {
      urgentItems.push({
        id: `missing-plan-${f.id}`,
        type: 'missing_plan',
        title: `Thiếu số phương án PCCC: ${f.name}`,
        description: `Hồ sơ hiện hành cần bổ sung Số Phương án | Phụ trách: ${f.manager}`,
        targetId: f.id,
        meta: { manager: f.manager }
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Eye Care Tip Header */}
      <div className="bg-amber-950/30 border border-amber-900/60 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 flex-shrink-0">
          <Activity className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-amber-300">
            ☀️ Chế Độ Bảo Vệ Mắt PCCC Bình Tuyền
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Hệ thống sử dụng bảng màu **Muted Charcoal & Warm Amber**, tối ưu độ tương phản,
            giảm ánh sáng xanh có hại. Giúp các bộ chiến sĩ không mỏi mắt khi trực ca dài rà soát hồ sơ.
          </p>
        </div>
      </div>

      {/* Main Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facilities Card */}
        <div 
          onClick={() => onSwitchTab('facilities')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-blue-500/40 transition-all cursor-pointer group hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng Cơ Sở Quản Lý</p>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-blue-100 mt-1">{totalFacilities}</h3>
            </div>
            <div className="h-10 w-10 bg-blue-950/40 border border-blue-900/50 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-950/70 transition-colors">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-400 gap-1 select-none">
            <span className="text-emerald-400 font-bold">100%</span> ổn định trên bản thảo
          </div>
        </div>

        {/* Due Facilities Card */}
        <div 
          onClick={() => onSwitchTab('scheduler')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-orange-500/40 transition-all cursor-pointer group hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cơ Sở Quá/Sắp Hạn KT</p>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-orange-400 mt-1">{dueFacilitiesCount}</h3>
            </div>
            <div className="h-10 w-10 bg-orange-950/40 border border-orange-900/50 rounded-xl flex items-center justify-center text-orange-400 group-hover:bg-orange-950/70 transition-colors">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-400 gap-1 select-none">
            <span className="text-orange-400 font-bold">Cần rà soát tuyến</span> lập kế hoạch ngay
          </div>
        </div>

        {/* Tasks Card */}
        <div 
          onClick={() => onSwitchTab('tasks')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-rose-500/40 transition-all cursor-pointer group hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nhiệm Vụ Chưa Xong</p>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-rose-400 mt-1">{pendingTasks}</h3>
            </div>
            <div className="h-10 w-10 bg-rose-950/40 border border-rose-900/50 rounded-xl flex items-center justify-center text-rose-400 group-hover:bg-rose-950/70 transition-colors">
              <ListChecks className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-400 gap-1 select-none">
            Phân bổ đều cho các chiến sĩ
          </div>
        </div>

        {/* Funds Card */}
        <div 
          onClick={() => onSwitchTab('finance')}
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/40 transition-all cursor-pointer group hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="flex items-center justify-between">
            <div className="max-w-[70%]">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider truncate">Số Tồn Quỹ Tổ</p>
              <h3 className="text-xl lg:text-2xl font-extrabold text-emerald-400 mt-1 truncate">
                {new Intl.NumberFormat('vi-VN').format(fundBalance)} ₫
              </h3>
            </div>
            <div className="h-10 w-10 bg-emerald-950/40 border border-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-950/70 transition-colors flex-shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-400 gap-1 select-none">
            Quỹ mua sắm cơ sở vật chất đơn vị
          </div>
        </div>
      </div>

      {/* Main Charts & Key Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Clean Custom UI List & Simple Horizontal Bar Chart for Type Distribution (Lightweight, No Overlap) */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-5 lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Cơ Cấu Loại Hình Cơ Sở Quản Lý
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono">
              Phân tích
            </span>
          </div>

          <div className="space-y-4 py-2">
            {Object.keys(typeCounts).length === 0 ? (
              <p className="text-slate-500 italic text-center py-6 text-xs">Chưa có dữ liệu cơ sở.</p>
            ) : (
              Object.entries(typeCounts).map(([type, count]) => {
                const percentage = Math.round((count / activeFacilities.length) * 100) || 0;
                
                // Muted and relaxing color map
                let barColor = 'bg-blue-500/80';
                if (type.toLowerCase().includes('karaoke') || type.toLowerCase().includes('bar')) barColor = 'bg-pink-500/70';
                else if (type.toLowerCase().includes('xăng') || type.toLowerCase().includes('gas')) barColor = 'bg-rose-500/70';
                else if (type.toLowerCase().includes('khách sạn') || type.toLowerCase().includes('măng')) barColor = 'bg-purple-500/70';
                else if (type.toLowerCase().includes('xưởng') || type.toLowerCase().includes('xuất')) barColor = 'bg-yellow-600/75';
                else if (type.toLowerCase().includes('mầm non') || type.toLowerCase().includes('trường')) barColor = 'bg-teal-500/70';

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-slate-300">
                      <span className="font-medium truncate max-w-[70%]" title={type}>{type}</span>
                      <span className="font-mono text-slate-400 font-bold">
                        {count} cơ sở ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 mt-2">
            <h5 className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
              ⚠️ Điểm Cần Lưu Ý Ngay:
            </h5>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
              Các hộ kinh doanh có nguy cơ cháy nổ cao (Xăng dầu, Karaoke, Chế biến lâm sản) cần được rà soát định kỳ nghiêm ngặt nhằm tránh các sự cố tai nạn đáng tiếc.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Professional KPI Table */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-hidden lg:col-span-6 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/30 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-orange-400" />
              Đánh Giá Chiến Sĩ & KPI (Bấm gửi Zalo)
            </h3>
            <span className="text-[11px] text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full font-bold">
              Công Văn
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
              <thead className="bg-slate-950/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider">Thành Viên</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-400 uppercase tracking-wider">Sổ Việc</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-400 uppercase tracking-wider text-emerald-400">Xong</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-400 uppercase tracking-wider text-rose-400">Quá Hạn</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-400 uppercase tracking-wider">Tỉ Lệ KPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-transparent">
                {managerStats.map((st) => (
                  <tr 
                    key={st.name} 
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onRemindUser(st.name)}
                    title="Bấm để nhắc nhở công việc qua Zalo"
                  >
                    <td className="px-4 py-3 font-bold text-slate-200 group-hover:text-amber-400 transition-colors flex items-center gap-2">
                      <span className="h-2 w-2 bg-slate-600 group-hover:bg-amber-400 rounded-full transition-all"></span>
                      {st.name}
                      <Send className="h-3.5 w-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-200 font-semibold">{st.total}</td>
                    <td className="px-3 py-3 text-center font-mono text-emerald-400 font-bold">{st.completed}</td>
                    <td className="px-3 py-3 text-center font-mono text-rose-400 font-bold">{st.overdue}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                        st.kpi >= 80 
                          ? 'text-emerald-400 bg-emerald-950/30' 
                          : st.kpi >= 50 
                            ? 'text-yellow-400 bg-yellow-950/30' 
                            : 'text-rose-400 bg-rose-950/30'
                      }`}>
                        {st.kpi}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950/20 p-3 border-t border-slate-800 text-slate-400 text-[11px] leading-relaxed">
            💡 **Mẹo:** Bấm chuột vào tên chiến sĩ bất kỳ để hệ thống tự động soạn tin nhắn, đính kèm các đầu việc còn tồn đọng và trích dẫn trực tiếp tới tài khoản Zalo của họ.
          </div>
        </div>
      </div>

      {/* Urgent Tasks to Complete */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5">
        <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase mb-4 flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
          Việc Gấp Cần Hoàn Thành (Ưu tiên xử lý ngay)
        </h4>

        {urgentItems.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">Tuyệt vời! Không có việc khẩn cấp nào tồn đọng. 🎉</p>
        ) : (
          <div className="space-y-3">
            {urgentItems.slice(0, 10).map((item) => {
              let iconColor = 'text-rose-400 bg-rose-950/40 border-rose-900/30';
              let badgeText = 'Công việc quá hạn';
              
              if (item.type === 'unscheduled_inspection') {
                iconColor = 'text-orange-400 bg-orange-950/40 border-orange-900/30';
                badgeText = 'Chưa lên lịch kiểm tra';
              } else if (item.type === 'missing_plan') {
                iconColor = 'text-blue-400 bg-blue-950/40 border-blue-900/30';
                badgeText = 'Khuyết hồ sơ';
              }

              return (
                <div 
                  key={item.id} 
                  className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 border rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                      {item.type === 'overdue_task' ? (
                        <Clock className="h-4.5 w-4.5" />
                      ) : item.type === 'unscheduled_inspection' ? (
                        <AlertTriangle className="h-4.5 w-4.5" />
                      ) : (
                        <AlertCircle className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs md:text-sm text-slate-200">{item.title}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${iconColor}`}>
                          {badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                    {item.type === 'overdue_task' && (
                      <>
                        <button
                          onClick={() => onRemindUser(item.meta.assignee)}
                          className="px-3 py-1.5 bg-blue-950/30 hover:bg-blue-950/50 border border-blue-900/40 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Nhắc Zalo</span>
                        </button>
                        <button
                          onClick={() => onSwitchTab('tasks')}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <span>Xem Kanban ➜</span>
                        </button>
                      </>
                    )}

                    {item.type === 'unscheduled_inspection' && (
                      <button
                        onClick={() => onSwitchTab('scheduler')}
                        className="px-3 py-1.5 bg-orange-950/30 hover:bg-orange-950/50 border border-orange-900/40 text-orange-400 hover:text-orange-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>Lên lịch kiểm tra</span>
                      </button>
                    )}

                    {item.type === 'missing_plan' && (
                      <button
                        onClick={() => onSwitchTab('facilities')}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>Cập nhật số phương án</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
