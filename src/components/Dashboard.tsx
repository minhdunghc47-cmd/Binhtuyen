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
      {/* HUD Header */}
      <div className="bg-cyber-dark border-l-4 border-cyber-cyan p-4 flex items-start gap-3 clip-corner glow-box-cyan">
        <div className="p-2 bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan flex-shrink-0 glow-box-cyan">
          <Activity className="h-5 w-5 animate-pulse glow-text-cyan" />
        </div>
        <div>
          <h4 className="text-sm font-bold font-mono text-cyber-cyan uppercase tracking-widest glow-text-cyan">
            HỆ THỐNG CHỈ HUY PCCC BÌNH TUYỀN [ ONLINE ]
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed font-mono">
            Kết nối bảo mật. Dữ liệu đang được đồng bộ hóa với hệ thống trung tâm. Trạng thái bình thường.
          </p>
        </div>
      </div>

      {/* Main Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facilities Card */}
        <div 
          onClick={() => onSwitchTab('facilities')}
          className="bg-cyber-panel border border-cyber-cyan clip-corner p-5 hover:bg-cyber-cyan/10 transition-all cursor-pointer group hover:-translate-y-0.5 active:translate-y-0 glow-box-cyan"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Tổng Cơ Sở Quản Lý</p>
              <h3 className="text-2xl lg:text-3xl font-mono font-extrabold text-cyber-cyan mt-1 glow-text-cyan">{totalFacilities}</h3>
            </div>
            <div className="h-10 w-10 bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center text-cyber-cyan group-hover:bg-cyber-cyan/30 transition-colors glow-box-cyan">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-400 gap-1 font-mono select-none">
            <span className="text-cyber-cyan font-bold glow-text-cyan">100%</span> Ổn định trên dữ liệu
          </div>
        </div>

        {/* Due Facilities Card */}
        <div 
          onClick={() => onSwitchTab('scheduler')}
          className="bg-cyber-panel border border-cyber-yellow clip-corner p-5 hover:bg-cyber-yellow/10 transition-all cursor-pointer group hover:-translate-y-0.5 active:translate-y-0 glow-box-yellow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Cơ Sở Quá/Sắp Hạn</p>
              <h3 className="text-2xl lg:text-3xl font-mono font-extrabold text-cyber-yellow mt-1 glow-text-yellow">{dueFacilitiesCount}</h3>
            </div>
            <div className="h-10 w-10 bg-cyber-yellow/10 border border-cyber-yellow flex items-center justify-center text-cyber-yellow group-hover:bg-cyber-yellow/30 transition-colors glow-box-yellow">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-400 gap-1 font-mono select-none">
            <span className="text-cyber-yellow font-bold glow-text-yellow">Cần rà soát tuyến</span> lập kế hoạch ngay
          </div>
        </div>

        {/* Tasks Card */}
        <div 
          onClick={() => onSwitchTab('tasks')}
          className="bg-cyber-panel border border-cyber-magenta clip-corner p-5 hover:bg-cyber-magenta/10 transition-all cursor-pointer group hover:-translate-y-0.5 active:translate-y-0 glow-box-magenta"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Nhiệm Vụ Chưa Xong</p>
              <h3 className="text-2xl lg:text-3xl font-mono font-extrabold text-cyber-magenta mt-1 glow-text-magenta">{pendingTasks}</h3>
            </div>
            <div className="h-10 w-10 bg-cyber-magenta/10 border border-cyber-magenta flex items-center justify-center text-cyber-magenta group-hover:bg-cyber-magenta/30 transition-colors glow-box-magenta">
              <ListChecks className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-400 gap-1 font-mono select-none">
            Phân bổ đều cho các chiến sĩ
          </div>
        </div>

        {/* Funds Card */}
        <div 
          onClick={() => onSwitchTab('finance')}
          className="bg-cyber-panel border border-cyber-cyan clip-corner p-5 hover:bg-cyber-cyan/10 transition-all cursor-pointer group hover:-translate-y-0.5 active:translate-y-0 glow-box-cyan"
        >
          <div className="flex items-center justify-between">
            <div className="max-w-[70%]">
              <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider truncate">Số Tồn Quỹ Tổ</p>
              <h3 className="text-xl lg:text-2xl font-mono font-extrabold text-cyber-cyan mt-1 truncate glow-text-cyan">
                {new Intl.NumberFormat('vi-VN').format(fundBalance)} ₫
              </h3>
            </div>
            <div className="h-10 w-10 bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center text-cyber-cyan group-hover:bg-cyber-cyan/30 transition-colors flex-shrink-0 glow-box-cyan">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-400 gap-1 font-mono select-none">
            Dữ liệu mã hóa mức cao
          </div>
        </div>
      </div>

      {/* Main Charts & Key Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Type Distribution */}
        <div className="bg-cyber-panel border border-cyber-cyan clip-corner p-5 lg:col-span-6 space-y-4 glow-box-cyan relative">
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyber-cyan opacity-50 m-2"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyber-cyan opacity-50 m-2"></div>
          
          <div className="flex justify-between items-center border-b border-cyber-cyan/30 pb-3">
            <h3 className="text-sm font-bold text-cyber-cyan uppercase tracking-wider flex items-center gap-2 glow-text-cyan font-mono">
              <Shield className="h-4 w-4" />
              Cơ Cấu Loại Hình Cơ Sở
            </h3>
            <span className="text-xs text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan px-2 py-0.5 font-mono">
              [ SCANNING ]
            </span>
          </div>

          <div className="space-y-4 py-2">
            {Object.keys(typeCounts).length === 0 ? (
              <p className="text-slate-500 font-mono italic text-center py-6 text-xs">NO DATA FOUND.</p>
            ) : (
              Object.entries(typeCounts).map(([type, count]) => {
                const percentage = Math.round((count / activeFacilities.length) * 100) || 0;
                
                // Cyberpunk colors
                let barColor = 'bg-cyber-cyan glow-box-cyan';
                if (type.toLowerCase().includes('karaoke') || type.toLowerCase().includes('bar')) barColor = 'bg-cyber-magenta glow-box-magenta';
                else if (type.toLowerCase().includes('xăng') || type.toLowerCase().includes('gas')) barColor = 'bg-cyber-yellow glow-box-yellow';
                else if (type.toLowerCase().includes('khách sạn') || type.toLowerCase().includes('măng')) barColor = 'bg-purple-500 box-shadow-[0_0_10px_purple]';

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-slate-300 font-mono">
                      <span className="font-bold truncate max-w-[70%]" title={type}>{type}</span>
                      <span className="text-cyber-cyan font-bold glow-text-cyan">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-cyber-dark border border-cyber-cyan/20 overflow-hidden">
                      <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="bg-cyber-yellow/10 p-3 border border-cyber-yellow mt-2">
            <h5 className="text-[11px] font-bold text-cyber-yellow flex items-center gap-1 font-mono glow-text-yellow">
              <AlertTriangle className="h-3 w-3" /> CẢNH BÁO HỆ THỐNG:
            </h5>
            <p className="text-[11px] text-cyber-yellow/80 font-mono line-clamp-2 mt-1">
              Các mục tiêu nguy cơ cao (Xăng dầu, Karaoke) yêu cầu giám sát tăng cường.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: KPI Table */}
        <div className="bg-cyber-panel border border-cyber-cyan clip-corner overflow-hidden lg:col-span-6 flex flex-col glow-box-cyan relative">
          <div className="px-5 py-4 border-b border-cyber-cyan/30 bg-cyber-dark flex justify-between items-center">
            <h3 className="text-sm font-bold font-mono text-cyber-cyan uppercase tracking-wider flex items-center gap-2 glow-text-cyan">
              <ListChecks className="h-4 w-4" />
              Hiệu Suất Chỉ Huy (Nhấn để gửi Data)
            </h3>
            <span className="text-[11px] text-cyber-magenta bg-cyber-magenta/10 border border-cyber-magenta px-2.5 py-0.5 font-bold font-mono glow-text-magenta">
              [ TRANSMIT ]
            </span>
          </div>

          <div className="overflow-x-auto flex-1 p-2">
            <table className="min-w-full text-xs md:text-sm font-mono">
              <thead>
                <tr className="border-b border-cyber-cyan/20">
                  <th className="px-4 py-3 text-left font-bold text-cyber-cyan uppercase tracking-wider">Mã Chiến Sĩ</th>
                  <th className="px-3 py-3 text-center font-bold text-cyber-cyan uppercase tracking-wider">Tổng</th>
                  <th className="px-3 py-3 text-center font-bold text-cyber-cyan uppercase tracking-wider">OK</th>
                  <th className="px-3 py-3 text-center font-bold text-cyber-magenta uppercase tracking-wider">Lỗi</th>
                  <th className="px-4 py-3 text-right font-bold text-cyber-cyan uppercase tracking-wider">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {managerStats.map((st) => (
                  <tr 
                    key={st.name} 
                    className="hover:bg-cyber-cyan/10 transition-colors group cursor-pointer border-b border-cyber-cyan/10"
                    onClick={() => onRemindUser(st.name)}
                  >
                    <td className="px-4 py-3 font-bold text-slate-200 group-hover:text-cyber-cyan transition-colors flex items-center gap-2">
                      <span className="h-2 w-2 bg-cyber-cyan/30 group-hover:bg-cyber-cyan border border-cyber-cyan transition-all glow-box-cyan"></span>
                      {st.name}
                      <Send className="h-3.5 w-3.5 text-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity ml-1 glow-text-cyan" />
                    </td>
                    <td className="px-3 py-3 text-center text-slate-300 font-bold">{st.total}</td>
                    <td className="px-3 py-3 text-center text-cyber-cyan font-bold">{st.completed}</td>
                    <td className="px-3 py-3 text-center text-cyber-magenta font-bold">{st.overdue}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold px-2 py-0.5 border ${
                        st.kpi >= 80 
                          ? 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan glow-text-cyan' 
                          : st.kpi >= 50 
                            ? 'text-cyber-yellow bg-cyber-yellow/10 border-cyber-yellow glow-text-yellow' 
                            : 'text-cyber-magenta bg-cyber-magenta/10 border-cyber-magenta glow-text-magenta'
                      }`}>
                        {st.kpi}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-cyber-dark p-3 border-t border-cyber-cyan/30 text-cyber-cyan/70 text-[11px] leading-relaxed font-mono">
            Nhấp vào bất kỳ mã chiến sĩ nào để kích hoạt luồng truyền tải dữ liệu tự động qua kênh Zalo.
          </div>
        </div>
      </div>

      {/* Urgent Tasks */}
      <div className="bg-cyber-panel border border-cyber-magenta clip-corner p-5 glow-box-magenta mt-6 relative">
        <h4 className="text-xs font-bold font-mono text-cyber-magenta tracking-wider uppercase mb-4 flex items-center gap-2 glow-text-magenta">
          <AlertTriangle className="h-4 w-4 animate-pulse" />
          [ CHỈ THỊ KHẨN ] - Ưu Tiên Xử Lý Tối Đa
        </h4>

        {urgentItems.length === 0 ? (
          <p className="text-xs text-cyber-cyan font-mono italic py-2">Hệ thống sạch. Không có chỉ thị khẩn.</p>
        ) : (
          <div className="space-y-3">
            {urgentItems.slice(0, 10).map((item) => {
              let iconColor = 'text-cyber-magenta bg-cyber-magenta/10 border-cyber-magenta glow-box-magenta';
              let badgeText = 'QUÁ HẠN';
              let badgeColor = 'text-cyber-magenta border-cyber-magenta glow-text-magenta';
              
              if (item.type === 'unscheduled_inspection') {
                iconColor = 'text-cyber-yellow bg-cyber-yellow/10 border-cyber-yellow glow-box-yellow';
                badgeText = 'LỖI LỊCH TRÌNH';
                badgeColor = 'text-cyber-yellow border-cyber-yellow glow-text-yellow';
              } else if (item.type === 'missing_plan') {
                iconColor = 'text-cyber-cyan bg-cyber-cyan/10 border-cyber-cyan glow-box-cyan';
                badgeText = 'LỖI DỮ LIỆU';
                badgeColor = 'text-cyber-cyan border-cyber-cyan glow-text-cyan';
              }

              return (
                <div 
                  key={item.id} 
                  className="bg-cyber-dark border border-cyber-magenta/50 hover:border-cyber-magenta clip-corner-reverse p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-cyber-magenta/5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 border flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                      {item.type === 'overdue_task' ? (
                        <Clock className="h-5 w-5" />
                      ) : item.type === 'unscheduled_inspection' ? (
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-xs md:text-sm text-slate-200">{item.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 border uppercase font-mono ${badgeColor}`}>
                          [ {badgeText} ]
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                    {item.type === 'overdue_task' && (
                      <>
                        <button
                          onClick={() => onRemindUser(item.meta.assignee)}
                          className="px-4 py-2 bg-cyber-cyan/10 hover:bg-cyber-cyan/30 border border-cyber-cyan text-cyber-cyan clip-corner text-[10px] font-bold transition flex items-center gap-2 cursor-pointer font-mono glow-box-cyan glow-text-cyan uppercase"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>TRUYỀN TIN</span>
                        </button>
                        <button
                          onClick={() => onSwitchTab('tasks')}
                          className="px-4 py-2 bg-cyber-dark hover:bg-cyber-cyan/10 border border-cyber-cyan/50 text-cyber-cyan clip-corner text-[10px] font-bold transition cursor-pointer font-mono uppercase"
                        >
                          <span>Xem Kanban ➜</span>
                        </button>
                      </>
                    )}

                    {item.type === 'unscheduled_inspection' && (
                      <button
                        onClick={() => onSwitchTab('scheduler')}
                        className="px-4 py-2 bg-cyber-yellow/10 hover:bg-cyber-yellow/30 border border-cyber-yellow text-cyber-yellow clip-corner text-[10px] font-bold transition flex items-center gap-2 cursor-pointer font-mono glow-box-yellow glow-text-yellow uppercase"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>SỬA LỊCH</span>
                      </button>
                    )}

                    {item.type === 'missing_plan' && (
                      <button
                        onClick={() => onSwitchTab('facilities')}
                        className="px-4 py-2 bg-cyber-cyan/10 hover:bg-cyber-cyan/30 border border-cyber-cyan text-cyber-cyan clip-corner text-[10px] font-bold transition flex items-center gap-2 cursor-pointer font-mono glow-box-cyan glow-text-cyan uppercase"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>CẬP NHẬT DATA</span>
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
