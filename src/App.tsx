/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  CalendarRange, 
  KanbanSquare, 
  WalletCards, 
  Hammer, 
  Eye, 
  Menu, 
  X, 
  RefreshCcw, 
  Info,
  Flame,
  AlertTriangle,
  FileSpreadsheet,
  BookOpen
} from 'lucide-react';
import { Facility, Task, FundTransaction, Project } from './types';
import { loadAllData, saveAllData, generateId, ZALO_PHONES } from './data';
import Dashboard from './components/Dashboard';
import Facilities from './components/Facilities';
import Scheduler from './components/Scheduler';
import Kanban from './components/Kanban';
import Finance from './components/Finance';
import Projects from './components/Projects';
import Notebook from './components/Notebook';
import { fetchFromFirebase, facilitiesRef, tasksRef, fundsRef, projectsRef, db } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function App() {
  // State elements
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [funds, setFunds] = useState<FundTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Mobile UI Sidebar Drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cloud backup state
  const [syncMessage, setSyncMessage] = useState<string>('Bản ghi lưu trữ cục bộ');
  const [isSyncing, setIsSyncing] = useState(false);

  // Load state values from Firebase and localStorage
  useEffect(() => {
    async function loadData() {
      setIsSyncing(true);
      setSyncMessage('Đang tải dữ liệu từ Firebase...');
      
      try {
        const [fbFacilities, fbTasks, fbFunds, fbProjects] = await Promise.all([
          fetchFromFirebase(facilitiesRef),
          fetchFromFirebase(tasksRef),
          fetchFromFirebase(fundsRef),
          fetchFromFirebase(projectsRef)
        ]);
        
        const localData = loadAllData();
        
        const loadedFacilities = fbFacilities && fbFacilities.length > 0 ? fbFacilities : localData.facilities || [];
        const loadedTasks = fbTasks && fbTasks.length > 0 ? fbTasks : localData.tasks || [];
        const loadedFunds = fbFunds && fbFunds.length > 0 ? fbFunds : localData.funds || [];
        const loadedProjects = fbProjects && fbProjects.length > 0 ? fbProjects : localData.projects || [];

        if ((!fbFacilities || fbFacilities.length === 0) && (!fbTasks || fbTasks.length === 0)) {
          setSyncMessage('Sử dụng dữ liệu mẫu cục bộ');
        } else {
          setSyncMessage('Đã tải Firebase thành công ✓');
        }

        const ensureIds = (arr: any[]) => {
          if (!Array.isArray(arr)) return [];
          return arr.map(item => item.id ? item : { ...item, id: Math.random().toString(36).substring(2, 9) });
        };

        const normalizeFacilities = (arr: any[]) => {
          if (!Array.isArray(arr)) return [];
          return arr.map(item => {
            const f = item.id ? item : { ...item, id: Math.random().toString(36).substring(2, 9) };
            if (!f.recordStatus) {
              if (f.recordNum && typeof f.recordNum === 'string' && f.recordNum.trim() !== '') {
                f.recordStatus = 'hien_hanh';
              } else {
                f.recordStatus = 'chua_dang_ky';
              }
            }
            return f;
          });
        };

        const finalFacilities = normalizeFacilities(loadedFacilities);
        const finalTasks = ensureIds(loadedTasks);
        const finalFunds = ensureIds(loadedFunds);
        const finalProjects = ensureIds(loadedProjects);

        setFacilities(finalFacilities as Facility[]);
        setTasks(finalTasks as Task[]);
        setFunds(finalFunds as FundTransaction[]);
        setProjects(finalProjects as Project[]);

        // If something was missing IDs, resave to local to fix corruption
        if (loadedTasks.some(t => !t.id)) {
            saveAllData({ tasks: finalTasks });
        }
      } catch (e) {
        console.error(e);
        const localData = loadAllData();
        
        const ensureIds = (arr: any[]) => {
          if (!Array.isArray(arr)) return [];
          return arr.map(item => item.id ? item : { ...item, id: Math.random().toString(36).substring(2, 9) });
        };

        const normalizeFacilities = (arr: any[]) => {
          if (!Array.isArray(arr)) return [];
          return arr.map(item => {
            const f = item.id ? item : { ...item, id: Math.random().toString(36).substring(2, 9) };
            if (!f.recordStatus) {
              if (f.recordNum && typeof f.recordNum === 'string' && f.recordNum.trim() !== '') {
                f.recordStatus = 'hien_hanh';
              } else {
                f.recordStatus = 'chua_dang_ky';
              }
            }
            return f;
          });
        };

        setFacilities(normalizeFacilities(localData.facilities));
        setTasks(ensureIds(localData.tasks));
        setFunds(ensureIds(localData.funds));
        setProjects(ensureIds(localData.projects));
        setSyncMessage('Lỗi tải Firebase, dùng bản cục bộ ✓');
      } finally {
        setIsSyncing(false);
      }
    }
    
    loadData();
  }, []);


  // Save facilities automatically
  const handleAddFacility = (newFac: Facility) => {
    const updated = [newFac, ...facilities];
    setFacilities(updated);
    saveAllData({ facilities: updated });
    triggerCloudSync('ADD', 'facilities', newFac);
  };

  const handleUpdateFacility = (updatedFac: Facility) => {
    const updated = facilities.map((f) => (f.id === updatedFac.id ? updatedFac : f));
    setFacilities(updated);
    saveAllData({ facilities: updated });
    triggerCloudSync('UPDATE', 'facilities', updatedFac);
  };

  const handleDeleteFacility = (id: string) => {
    const updated = facilities.filter((f) => f.id !== id);
    setFacilities(updated);
    saveAllData({ facilities: updated });
    triggerCloudSync('DELETE', 'facilities', { id });
  };

  const handleBulkImportFacilities = (newItems: Omit<Facility, 'id' | 'createdAt' | 'trainingHistory'>[]) => {
    const mapped: Facility[] = newItems.map((item) => ({
      ...item,
      id: generateId(),
      createdAt: Date.now(),
      trainingHistory: [],
    }));

    const updated = [...mapped, ...facilities];
    setFacilities(updated);
    saveAllData({ facilities: updated });
    mapped.forEach(fac => {
      triggerCloudSync('ADD', 'facilities', fac);
    });
  };

  // Save tasks automatically
  const handleAddTask = (newTask: Task) => {
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveAllData({ tasks: updated });
    triggerCloudSync('ADD', 'tasks', newTask);
  };

  const handleAddTasks = (newTasksList: Task[]) => {
    const updated = [...newTasksList, ...tasks];
    setTasks(updated);
    saveAllData({ tasks: updated });
    // Sync array item by individual item
    newTasksList.forEach((t) => {
      triggerCloudSync('ADD', 'tasks', t);
    });
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const oldTask = tasks.find((t) => t.id === updatedTask.id);
    if (oldTask && !oldTask.isCompleted && updatedTask.isCompleted && updatedTask.facilityId) {
      // Mark the facility's last inspection date to the task's deadline
      const facility = facilities.find((f) => f.id === updatedTask.facilityId);
      if (facility) {
        const updatedFac = { ...facility, lastInspectionDate: updatedTask.deadline || new Date().toISOString().slice(0, 10) };
        handleUpdateFacility(updatedFac);
      }
    }

    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    saveAllData({ tasks: updated });
    triggerCloudSync('UPDATE', 'tasks', updatedTask);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveAllData({ tasks: updated });
    triggerCloudSync('DELETE', 'tasks', { id });
  };

  // Save transactions automatically
  const handleAddTransaction = (newTrans: FundTransaction) => {
    const updated = [newTrans, ...funds];
    setFunds(updated);
    saveAllData({ funds: updated });
    triggerCloudSync('ADD', 'funds', newTrans);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = funds.filter((f) => f.id !== id);
    setFunds(updated);
    saveAllData({ funds: updated });
    triggerCloudSync('DELETE', 'funds', { id });
  };

  // Save projects automatically
  const handleAddProject = (newProj: Project) => {
    const updated = [newProj, ...projects];
    setProjects(updated);
    saveAllData({ projects: updated });
    triggerCloudSync('ADD', 'projects', newProj);
  };

  const handleUpdateProject = (updatedProj: Project) => {
    const updated = projects.map((p) => (p.id === updatedProj.id ? updatedProj : p));
    setProjects(updated);
    saveAllData({ projects: updated });
    triggerCloudSync('UPDATE', 'projects', updatedProj);
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveAllData({ projects: updated });
    triggerCloudSync('DELETE', 'projects', { id });
  };

  const handleSettleProfitToQuỹ = (amount: number, desc: string) => {
    const newTrans: FundTransaction = {
      id: generateId(),
      type: 'thu',
      amount,
      desc,
      createdAt: Date.now()
    };
    handleAddTransaction(newTrans);
  };

  // Triggers Zalo messaging draft copied
  const handleRemindUser = (managerName: string) => {
    const pending = tasks.filter((t) => t.assignee === managerName && !t.isCompleted);
    if (pending.length === 0) {
      console.log(`Đồng chí ${managerName} không có việc tồn đọng nào! 🎉`);
      return;
    }

    const taskTextLines = pending.map((t, idx) => `${idx + 1}. ${t.title}`).join('\n');
    const msg = `🚨 *NHẮC NHỞ TIẾN ĐỘ THI CÔNG & KIỂM TRA PCCC*\n👤 Chiến sĩ: ${managerName}\nĐồng chí đang có *${pending.length} đầu việc* chưa hoàn thành. Yêu cầu rà soát:\n\n${taskTextLines}\n\n👉 Vui lòng lập kế hoạch xử lý và cập nhật tiến trình lên hệ thống ngay!`;

    navigator.clipboard.writeText(msg).then(() => {
      console.log(`Đã sao chép tin nhắn nhắc việc cho ${managerName}! Hệ thống đang kết nối ứng dụng gửi tin.`);
      window.open('zalo://share?text=' + encodeURIComponent(msg), '_self');
    }).catch(() => {
      console.error('Không thể sao chép tự động. Hãy thử lại trên cửa sổ trình duyệt.');
    });
  };

  // Write to Firebase
  const triggerCloudSync = async (action: string, collectionName: string, data: any) => {
    setIsSyncing(true);
    setSyncMessage('Đang đồng bộ mây...');
    try {
      const docRef = doc(db, 'artifacts', 'pccc-binh-tuyen-app', 'public', 'data', collectionName, data.id || 'bulk');

      if (action === 'DELETE') {
        await deleteDoc(docRef);
      } else if (action === 'FULL_SYNC') {
        await new Promise((res) => setTimeout(res, 600));
      } else {
        const payloadToSave = JSON.parse(JSON.stringify(data));
        const finalDoc = Array.isArray(payloadToSave) ? { items: payloadToSave } : payloadToSave;
        await setDoc(docRef, finalDoc);
      }
      
      setSyncMessage('Mây lưu thành công ✓');
    } catch (e) {
      setSyncMessage('Không có mây, lưu Offline ✓');
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceSheetsSync = async () => {
    setIsSyncing(true);
    setSyncMessage('Bắn lệnh đẩy đè Sheets...');
    await new Promise((res) => setTimeout(res, 900));
    setSyncMessage('Bảo lưu dự phòng tốt ✓');
    setIsSyncing(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-cyber-dark text-cyber-cyan font-sans relative">
      <div className="scanlines"></div>
      
      {/* 1. LEFT SIDEBAR: Cyberpunk Navigation */}
      <aside className="w-64 bg-cyber-panel border-r border-cyber-cyan glow-box-cyan flex flex-col justify-between hidden md:flex flex-shrink-0 select-none z-10">
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center px-6 gap-3 bg-cyan-950/30 border-b border-cyber-cyan clip-corner-reverse m-2">
            <div className="h-9 w-9 bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center text-cyber-cyan glow-box-cyan">
              <Flame className="h-5 w-5 animate-pulse glow-text-cyan" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider text-cyber-cyan uppercase glow-text-cyan">Tổ Bình Tuyền</h1>
              <p className="text-[10px] text-cyber-yellow font-mono font-extrabold uppercase tracking-widest mt-0.5 glow-text-yellow">PCCC & CNCH</p>
            </div>
          </div>

          {/* Nav groups */}
          <div className="p-4 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block px-3 mb-2.5">
                Chuyên Môn Nghiệp vụ
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => { setActiveTab('dashboard'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-cyber-cyan/20 border-l-[3px] border-cyber-cyan text-cyber-cyan font-bold glow-box-cyan clip-corner glow-text-cyan'
                      : 'border-l-[3px] border-transparent text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 hover:glow-text-cyan transition-all'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Tổng quan số lượng</span>
                </button>

                <button
                  onClick={() => { setActiveTab('facilities'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    activeTab === 'facilities'
                      ? 'bg-cyber-cyan/20 border-l-[3px] border-cyber-cyan text-cyber-cyan font-bold glow-box-cyan clip-corner glow-text-cyan'
                      : 'border-l-[3px] border-transparent text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 hover:glow-text-cyan transition-all'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Cơ sở hồ sơ quản lý</span>
                </button>

                <button
                  onClick={() => { setActiveTab('scheduler'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    activeTab === 'scheduler'
                      ? 'bg-cyber-cyan/20 border-l-[3px] border-cyber-cyan text-cyber-cyan font-bold glow-box-cyan clip-corner glow-text-cyan'
                      : 'border-l-[3px] border-transparent text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 hover:glow-text-cyan transition-all'
                  }`}
                >
                  <CalendarRange className="h-4 w-4" />
                  <span>Kế hoạch tuyến kiểm</span>
                </button>

                <button
                  onClick={() => { setActiveTab('tasks'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    activeTab === 'tasks'
                      ? 'bg-cyber-cyan/20 border-l-[3px] border-cyber-cyan text-cyber-cyan font-bold glow-box-cyan clip-corner glow-text-cyan'
                      : 'border-l-[3px] border-transparent text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 hover:glow-text-cyan transition-all'
                  }`}
                >
                  <KanbanSquare className="h-4 w-4" />
                  <span>Bảng việc Kanban</span>
                </button>

                <button
                  onClick={() => { setActiveTab('notebook'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    activeTab === 'notebook'
                      ? 'bg-cyber-cyan/20 border-l-[3px] border-cyber-cyan text-cyber-cyan font-bold glow-box-cyan clip-corner glow-text-cyan'
                      : 'border-l-[3px] border-transparent text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 hover:glow-text-cyan transition-all'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Sổ tay Notebook</span>
                </button>
              </nav>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block px-3 mb-2.5">
                Kinh tế & Quỹ Đội
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => { setActiveTab('finance'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    activeTab === 'finance'
                      ? 'bg-cyber-cyan/20 border-l-[3px] border-cyber-cyan text-cyber-cyan font-bold glow-box-cyan clip-corner glow-text-cyan'
                      : 'border-l-[3px] border-transparent text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 hover:glow-text-cyan transition-all'
                  }`}
                >
                  <WalletCards className="h-4 w-4" />
                  <span>Sổ thu chi quỹ tổ</span>
                </button>

                <button
                  onClick={() => { setActiveTab('projects'); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    activeTab === 'projects'
                      ? 'bg-cyber-cyan/20 border-l-[3px] border-cyber-cyan text-cyber-cyan font-bold glow-box-cyan clip-corner glow-text-cyan'
                      : 'border-l-[3px] border-transparent text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 hover:glow-text-cyan transition-all'
                  }`}
                >
                  <Hammer className="h-4 w-4" />
                  <span>Dự án thi công ngoài</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom cloud indicator */}
        <div className="p-4 border-t border-cyber-cyan bg-cyber-panel">
          <div className="bg-cyber-dark border border-cyber-cyan clip-corner p-3 space-y-2 glow-box-cyan">
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2.5 w-2.5 rounded-none ${isSyncing ? 'bg-cyber-yellow animate-spin' : 'bg-cyber-cyan'} flex-shrink-0 glow-box-cyan`}></span>
              <span className="font-bold text-cyber-cyan font-mono truncate">{syncMessage}</span>
            </div>
            <button
              onClick={handleForceSheetsSync}
              className="w-full py-1 text-[10px] bg-cyber-dark border border-cyber-yellow text-cyber-yellow hover:bg-cyber-yellow/20 font-mono font-extrabold uppercase clip-corner transition-all glow-text-yellow"
            >
              Sao Lưu Sheets
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN SCREEN BODY */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-cyber-dark bg-grid-cyber z-0 relative">
        
        {/* TOP MOBILE HEADER & STATUS BAR */}
        <header className="h-16 border-b border-cyber-cyan bg-cyber-panel/90 backdrop-blur-md flex items-center px-4 md:px-6 justify-between select-none flex-shrink-0 glow-box-cyan z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile screens */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 bg-slate-900 border border-slate-805 rounded-xl md:hidden text-slate-350"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Trực Ghi Hồ Sơ Công Vụ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* HUD Status */}
            <div className="flex items-center gap-1.5 bg-cyber-magenta/10 border border-cyber-magenta text-[10px] font-bold text-cyber-magenta px-3 py-1 clip-corner glow-box-magenta font-mono uppercase tracking-widest">
              <Eye className="h-3.5 w-3.5 animate-pulse" />
              <span className="hidden sm:inline glow-text-magenta">HỆ THỐNG TRỰC CHIẾN KÍCH HOẠT</span>
            </div>
          </div>
        </header>

        {/* CONTAINER SCROLL VIEW */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-10">
            {activeTab === 'dashboard' && (
              <Dashboard 
                facilities={facilities} 
                tasks={tasks} 
                funds={funds}
                onSwitchTab={(tab) => { setActiveTab(tab); }}
                onRemindUser={handleRemindUser}
              />
            )}
            
            {activeTab === 'facilities' && (
              <Facilities
                facilities={facilities}
                onAddFacility={handleAddFacility}
                onUpdateFacility={handleUpdateFacility}
                onDeleteFacility={handleDeleteFacility}
                onBulkImport={handleBulkImportFacilities}
              />
            )}

            {activeTab === 'scheduler' && (
              <Scheduler
                facilities={facilities}
                tasks={tasks}
                onAddTasks={handleAddTasks}
              />
            )}

            {activeTab === 'tasks' && (
              <Kanban
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeTab === 'finance' && (
              <Finance
                funds={funds}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {activeTab === 'projects' && (
              <Projects
                projects={projects}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onSettleProfitToQuỹ={handleSettleProfitToQuỹ}
              />
            )}

            {activeTab === 'notebook' && (
              <Notebook />
            )}
          </div>
        </div>
      </main>

      {/* 3. MOBILE SIDEBAR NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-cyber-dark/80 backdrop-blur-md">
          <div 
            className="fixed inset-0 scanlines" 
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-cyber-panel h-full border-r border-cyber-cyan glow-box-cyan">
            {/* Header drawer */}
            <div className="h-16 bg-cyan-950/30 px-5 flex items-center justify-between border-b border-cyber-cyan">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-cyber-cyan glow-text-cyan animate-pulse" />
                <span className="font-extrabold text-cyber-cyan text-sm tracking-wider uppercase glow-text-cyan">PCCC Bình Tuyền</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 px-2 border border-cyber-magenta bg-cyber-dark text-cyber-magenta clip-corner glow-box-magenta hover:bg-cyber-magenta/20 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu options grouped inside drawer */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-600 block pl-2 mb-2 uppercase tracking-widest">
                  Danh mục quản lý
                </span>
                <div className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Bảng tổng quan', icon: <LayoutDashboard /> },
                    { id: 'facilities', label: 'Hồ sơ cơ sở', icon: <Building2 /> },
                    { id: 'scheduler', label: 'Tuyến kế hoạch', icon: <CalendarRange /> },
                    { id: 'tasks', label: 'Bảng việc Kanban', icon: <KanbanSquare /> },
                    { id: 'notebook', label: 'Sổ tay Notebook', icon: <BookOpen /> },
                    { id: 'finance', label: 'Sổ quỹ tổ chi', icon: <WalletCards /> },
                    { id: 'projects', label: 'Dự án thi công', icon: <Hammer /> },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveTab(m.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-none text-xs font-semibold transition-all ${
                        activeTab === m.id
                          ? 'bg-cyber-cyan/20 text-cyber-cyan border-l-[3px] border-cyber-cyan font-bold glow-box-cyan glow-text-cyan clip-corner'
                          : 'text-slate-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10'
                      }`}
                    >
                      {React.cloneElement(m.icon, { className: 'h-4 w-4' })}
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer drawer */}
            <div className="p-4 border-t border-cyber-cyan bg-cyber-panel">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 bg-cyber-dark hover:bg-cyber-cyan/20 border border-cyber-cyan text-xs font-bold text-cyber-cyan clip-corner glow-box-cyan glow-text-cyan transition-all"
              >
                ĐÓNG MENU (X)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
