/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task } from '../types';
import { ListTodo, CheckCircle, Clock, AlertCircle, Plus, Edit2, Trash2, Filter, CalendarDays } from 'lucide-react';
import { MANAGERS, generateId } from '../data';

interface KanbanProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export default function Kanban({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: KanbanProps) {
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(MANAGERS[0]);
  const [deadline, setDeadline] = useState('');

  const openFormModal = (task: Task | null = null) => {
    setFormError('');
    if (task) {
      setEditingTask(task);
      setTitle(task.title || '');
      setAssignee(task.assignee || MANAGERS[0]);
      setDeadline(task.deadline || '');
    } else {
      setEditingTask(null);
      setTitle('');
      setAssignee(MANAGERS[0]);
      setDeadline('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) return setFormError('Hãy nhập tên đầu việc!');

    const payload: Task = {
      ...(editingTask || {}),
      id: editingTask ? (editingTask.id || generateId()) : generateId(),
      title: title.trim(),
      assignee,
      deadline,
      isCompleted: editingTask ? editingTask.isCompleted : false,
      createdAt: editingTask ? editingTask.createdAt : Date.now(),
    };

    if (editingTask) {
      onUpdateTask(payload);
    } else {
      onAddTask(payload);
    }
    setIsModalOpen(false);
  };

  const handleToggleCompleted = (task: Task) => {
    onUpdateTask({
      ...task,
      isCompleted: !task.isCompleted,
    });
  };

  // Drag & Drop Handlers
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedOverCol !== colId) {
      setDraggedOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let updatedTask = { ...task };
    const todayVal = new Date();
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const in5daysStr = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    if (colId === 'done') {
      updatedTask.isCompleted = true;
    } else {
      updatedTask.isCompleted = false;

      if (colId === 'doing') {
        const hasDeadline = !!task.deadline;
        if (hasDeadline) {
          const dl = new Date(task.deadline + 'T23:59:59');
          const isOverdueOrNear = dl < todayVal || (dl.getTime() - todayVal.getTime()) / (1000 * 60 * 60 * 24) <= 2;
          if (isOverdueOrNear || task.isCompleted) {
            updatedTask.deadline = in5daysStr;
          }
        } else {
          updatedTask.deadline = '';
        }
      } else if (colId === 'upcoming') {
        updatedTask.deadline = tomorrowStr;
      } else if (colId === 'overdue') {
        updatedTask.deadline = yesterdayStr;
      }
    }

    onUpdateTask(updatedTask);
  };

  // Classify Tasks scientifically
  const today = new Date();
  
  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee === 'all') return true;
    return t.assignee === filterAssignee;
  });

  const colDoing: Task[] = [];
  const colUpcoming: Task[] = [];
  const colOverdue: Task[] = [];
  const colDone: Task[] = [];

  filteredTasks.forEach((t) => {
    if (t.isCompleted) {
      colDone.push(t);
    } else if (!t.deadline) {
      colDoing.push(t);
    } else {
      // Calculate day difference
      const deadlineDate = new Date(t.deadline + 'T23:59:59');
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays < 0) {
        colOverdue.push(t);
      } else if (diffDays <= 2) {
        colUpcoming.push(t);
      } else {
        colDoing.push(t);
      }
    }
  });

  const statusColumns = [
    {
      id: 'doing',
      title: '🛠️ Đang Triển Khai',
      items: colDoing,
      borderColor: 'border-l-blue-500',
      badgeColor: 'bg-blue-950/40 text-blue-400',
      panelBg: 'bg-slate-900/40',
      icon: <Clock className="h-4 w-4 text-blue-400" />
    },
    {
      id: 'upcoming',
      title: '⏳ Sắp Đến Hạn (<=2 ngày)',
      items: colUpcoming,
      borderColor: 'border-l-orange-500',
      badgeColor: 'bg-orange-950/40 text-orange-400',
      panelBg: 'bg-slate-900/30',
      icon: <CalendarDays className="h-4 w-4 text-orange-400" />
    },
    {
      id: 'overdue',
      title: '🚨 Vượt Trôi Quá Hạn',
      items: colOverdue,
      borderColor: 'border-l-rose-500',
      badgeColor: 'bg-rose-950/50 text-rose-400 animate-pulse',
      panelBg: 'bg-slate-900/20',
      icon: <AlertCircle className="h-4 w-4 text-rose-400 animate-pulse" />
    },
    {
      id: 'done',
      title: '✅ Đã Hoàn Thành',
      items: colDone,
      borderColor: 'border-l-emerald-500',
      badgeColor: 'bg-emerald-950/40 text-emerald-400',
      panelBg: 'bg-slate-900/10',
      icon: <CheckCircle className="h-4 w-4 text-emerald-400" />
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-orange-400" />
            Bảng Quản Trị Phân Công Nhiệm Vụ (Kanban)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi phân công, đôn đốc tiến độ, đo hiệu suất KPI của các chiến sĩ Tổ Bình Tuyền.
          </p>
        </div>

        <button
          onClick={() => openFormModal()}
          className="self-start md:self-auto px-4 py-2 bg-blue-650/90 hover:bg-blue-600 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 shadow"
        >
          <Plus className="h-4 w-4" />
          <span>Ra lệnh giao việc</span>
        </button>
      </div>

      {/* Member Filter Selector */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/40 p-1.5 border border-slate-800 rounded-xl overflow-x-auto">
        <span className="text-xs font-semibold text-slate-500 px-2.5 flex items-center gap-1">
          <Filter className="h-3 w-3" />
          Bộ lọc:
        </span>
        <button
          onClick={() => setFilterAssignee('all')}
          className={`px-3 py-1 bg-transparent text-xs font-bold rounded-lg border transition ${
            filterAssignee === 'all'
              ? 'bg-slate-800 border-slate-700 text-white shadow-sm'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Tất cả chiến sĩ
        </button>
        {MANAGERS.map((mgr) => (
          <button
            key={mgr}
            onClick={() => setFilterAssignee(mgr)}
            className={`px-3 py-1 bg-transparent text-xs font-semibold rounded-lg border transition ${
              filterAssignee === mgr
                ? 'bg-blue-950/30 border-blue-900/40 text-blue-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {mgr}
          </button>
        ))}
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start pb-4 min-h-[calc(100vh-280px)]">
        {statusColumns.map((col) => (
          <div 
            key={col.id} 
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`${col.panelBg} border rounded-xl p-3 flex flex-col h-full space-y-3.5 transition-all duration-200 ${
              draggedOverCol === col.id 
                ? 'border-amber-500 bg-[#1e2335]/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-[1.01]' 
                : 'border-slate-805/50'
            }`}
          >
            {/* Column Header */}
            <div className="flex justify-between items-center border-b border-slate-800/65 pb-2 min-h-8">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-350">
                {col.icon}
                <span>{col.title}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${col.badgeColor}`}>
                {col.items.length}
              </span>
            </div>

            {/* Column Contents */}
            <div className="flex-1 space-y-3 max-h-[60vh] md:max-h-[70vh] overflow-y-auto pr-1">
              {col.items.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-600 italic font-medium">
                  Trống việc cột này
                </div>
              ) : (
                col.items.map((t, idx) => {
                  const isExceeded = t.deadline && new Date(t.deadline + 'T23:59:59') < today && !t.isCompleted;
                  return (
                    <div 
                      key={`${t.id}-${idx}`} 
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      className={`group bg-slate-900 border border-slate-800 rounded-lg p-3.5 shadow-sm border-l-4 ${col.borderColor} hover:border-slate-750 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.01]`}
                    >
                      <h4 className={`text-xs md:text-sm font-semibold text-slate-200 leading-relaxed ${
                        t.isCompleted ? 'line-through opacity-40' : ''
                      }`}>
                        {t.title}
                      </h4>

                      <div className="mt-3 pt-2.5 border-t border-slate-850 flex justify-between items-center text-[10px] text-slate-400 font-bold font-mono">
                        <span>👤 {t.assignee}</span>
                        <span className={isExceeded ? 'text-rose-400 font-bold' : ''}>
                          ⏰ {t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN') : 'Không hạn'}
                        </span>
                      </div>

                      {/* Floating actions */}
                      <div className="mt-3 pt-2 border-t border-slate-850 flex justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleCompleted(t)}
                          className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded transition ${
                            t.isCompleted
                              ? 'bg-slate-850 text-slate-500 hover:text-slate-300'
                              : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-950/50'
                          }`}
                        >
                          {t.isCompleted ? 'Mở Lại' : 'Hoàn Tất'}
                        </button>
                        
                        <button
                          onClick={() => openFormModal(t)}
                          className="p-1 text-slate-500 hover:text-blue-400 rounded transition"
                          title="Sửa đầu việc"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>

                        <button
                          onClick={() => {
                            if (deleteConfirmId === t.id) {
                              onDeleteTask(t.id);
                              setDeleteConfirmId(null);
                            } else {
                              setDeleteConfirmId(t.id);
                              setTimeout(() => setDeleteConfirmId(null), 3000);
                            }
                          }}
                          className={`p-1 rounded transition ${
                            deleteConfirmId === t.id
                              ? 'bg-rose-500 text-white hover:bg-rose-600'
                              : 'text-slate-500 hover:text-rose-400'
                          }`}
                          title="Xóa nhiệm vụ"
                        >
                          {deleteConfirmId === t.id ? (
                            <span className="text-[10px] font-bold">Xóa?</span>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DETAILED DIALOG FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 text-slate-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3.5 mb-3.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <ListTodo className="h-4.5 w-4.5 text-blue-400" />
                {editingTask ? 'Cập Nhật Nhiệm Vụ' : 'Ra Chỉ Thị Giao Việc Mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-350 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mô tả văn bản công vụ (*)</label>
                <textarea
                  required
                  rows={3}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs md:text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ví dụ: Kiểm tra an toàn thiết bị đo nhiệt độ hầm xăng Bình Phú..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cán bộ đảm nhiệm</label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none text-blue-300 font-bold cursor-pointer"
                  >
                    {MANAGERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Hạn hoàn tất</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs focus:outline-none text-slate-300"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-rose-950/40 border border-rose-900 text-rose-400 p-2 rounded text-xs font-semibold text-center">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-slate-800 text-xs hover:border-slate-750 font-semibold"
                >
                  Bỏ Qua
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-blue-650 hover:bg-blue-600 text-white text-xs font-bold shadow"
                >
                  Lưu Chỉ Thị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
