import React, { useState, useEffect, useRef } from 'react';
import { Facility, Task } from '../types';
import { Bot, X, Send, Settings, Sparkles, CheckCircle } from 'lucide-react';
import { generateId, MANAGERS } from '../data';

interface AIChatBotProps {
  facilities: Facility[];
  tasks: Task[];
  funds: FundTransaction[];
  projects: Project[];
  onUpdateFacility: (f: Facility) => void;
  onDeleteFacility: (id: string) => void;
  onAddTask: (t: Task) => void;
  onDeleteTask: (id: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
}

export default function AIChatBot({ 
  facilities, tasks, funds, projects, onUpdateFacility, onDeleteFacility, onAddTask, onDeleteTask 
}: AIChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) setApiKey(savedKey);
    
    // Welcome message
    setMessages([
      { id: 'welcome', role: 'system', content: 'Xin chào! Tôi là Trợ lý AI PCCC. Đồng chí có thể ra lệnh cho tôi cập nhật ngày kiểm tra cơ sở hoặc giao việc cho cán bộ.' }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('GEMINI_API_KEY', key);
    setShowSettings(false);
  };

  // Hàm tìm kiếm cơ sở gần đúng nhất
  const findFacility = (name: string): Facility | undefined => {
    const normalizedName = name.toLowerCase().trim();
    let found = facilities.find(f => f.name.toLowerCase() === normalizedName);
    if (found) return found;
    found = facilities.find(f => f.name.toLowerCase().includes(normalizedName) || normalizedName.includes(f.name.toLowerCase()));
    return found;
  };

  const findAssignee = (name: string): string => {
    const normalized = name.toLowerCase();
    const found = MANAGERS.find(m => m.toLowerCase().includes(normalized) || normalized.includes(m.toLowerCase()));
    return found || MANAGERS[0];
  };

  const callGeminiAPI = async (userText: string) => {
    if (!apiKey) {
      return "LỖI: Vui lòng vào Cài đặt (⚙️) để nhập Gemini API Key trước khi sử dụng.";
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const balance = funds.reduce((acc, f) => f.type === 'thu' ? acc + f.amount : acc - f.amount, 0);
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    
    const statsStr = `
*** DỮ LIỆU BÁO CÁO HIỆN TẠI TỪ HỆ THỐNG ***
- Tổng số cơ sở quản lý: ${facilities.length}
- Số cơ sở Nhóm 1: ${facilities.filter(f => f.group === 'Nhóm 1').length}
- Số cơ sở Nhóm 2: ${facilities.filter(f => f.group === 'Nhóm 2').length}
- Tổng quỹ Đội hiện tại: ${balance.toLocaleString('vi-VN')} VNĐ
- Tổng số dự án thi công: ${projects.length}
- Tình trạng công việc: ${completedTasks}/${tasks.length} đã hoàn thành
- Các cán bộ quản lý: ${MANAGERS.join(', ')}
********************************************
`;

    const systemPrompt = `Bạn là trợ lý AI quản lý PCCC tên là Trợ lý Bình Tuyền. Hôm nay là ngày ${todayStr}.
Nhiệm vụ của bạn là lắng nghe báo cáo của cán bộ và thực hiện các hành động bằng công cụ (function calling).
Bạn cũng có thể trả lời các câu hỏi về số liệu dựa trên Bảng Dữ Liệu dưới đây.
Nếu người dùng hỏi số liệu, hãy lấy từ Bảng Dữ Liệu và trả lời thân thiện, lịch sự.
Nếu người dùng ra lệnh hành động (tạo việc, cập nhật), hãy gọi công cụ tương ứng, sau đó trả lời ngắn gọn tiếng Việt.

${statsStr}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userText }]
        }
      ],
      tools: [
        {
          functionDeclarations: [
            {
              name: "update_inspection_date",
              description: "Cập nhật ngày kiểm tra an toàn PCCC cho một cơ sở",
              parameters: {
                type: "OBJECT",
                properties: {
                  facilityName: { type: "STRING", description: "Tên của cơ sở (VD: Nhà nghỉ Tùng Lâm, Quán Karaoke X)" },
                  date: { type: "STRING", description: "Ngày kiểm tra, định dạng YYYY-MM-DD" }
                },
                required: ["facilityName", "date"]
              }
            },
            {
              name: "create_task",
              description: "Tạo nhiệm vụ/công việc mới giao cho cán bộ",
              parameters: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING", description: "Mô tả công việc (VD: Đi phúc tra quán karaoke X)" },
                  assignee: { type: "STRING", description: "Tên người được giao (VD: Đ/c Dũng)" },
                  deadline: { type: "STRING", description: "Hạn chót, định dạng YYYY-MM-DD. Nếu không rõ thì để trống." }
                },
                required: ["title", "assignee"]
              }
            },
            {
              name: "delete_task",
              description: "Xóa một nhiệm vụ/công việc",
              parameters: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING", description: "Tên hoặc mô tả ngắn của công việc cần xóa" }
                },
                required: ["title"]
              }
            },
            {
              name: "delete_facility",
              description: "Xóa một cơ sở khỏi hệ thống PCCC",
              parameters: {
                type: "OBJECT",
                properties: {
                  facilityName: { type: "STRING", description: "Tên cơ sở cần xóa" }
                },
                required: ["facilityName"]
              }
            }
          ]
        }
      ],
      toolConfig: {
        functionCallingConfig: { mode: "AUTO" }
      }
    };

    try {
      // 1. Tự động tìm model phù hợp nhất được cấp quyền cho API Key này
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!modelsRes.ok) {
        return `LỖI API KEY: Không thể xác thực API Key. Đảm bảo mã khóa đúng.`;
      }
      
      const modelsData = await modelsRes.json();
      const availableModels = modelsData.models || [];
      
      // Lọc các model có chữ gemini và hỗ trợ generateContent
      const validModels = availableModels.filter((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent') && 
        m.name.includes('gemini')
      );

      if (validModels.length === 0) {
        return "LỖI: API Key không được cấp quyền cho bất kỳ model Gemini nào.";
      }

      // Sắp xếp ưu tiên: pro > flash > các bản khác.
      validModels.sort((a: any, b: any) => {
        if (a.name.includes('pro') && !b.name.includes('pro')) return -1;
        if (!a.name.includes('pro') && b.name.includes('pro')) return 1;
        return 0;
      });

      let res = null;
      let usedModelName = "";
      let lastError = null;

      // 2. Thử lần lượt các model cho đến khi thành công (tránh lỗi Quota 0)
      for (const model of validModels) {
        usedModelName = model.name; // ví dụ: "models/gemini-pro"
        const attemptRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${usedModelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        const data = await attemptRes.json();
        
        if (attemptRes.ok) {
          res = data;
          break; // Thành công
        } else {
          // Ghi nhận lỗi và thử model tiếp theo
          lastError = data.error?.message || "Lỗi không xác định";
          // Nếu không phải lỗi quota thì có thể dừng luôn, nhưng cứ thử tiếp cho chắc chắn.
        }
      }

      if (!res) {
        return `LỖI API (Đã thử mọi model khả dụng): ${lastError}`;
      }

      const candidate = res.candidates?.[0];
      if (!candidate) return "Không nhận được phản hồi từ AI.";

      const part = candidate.content?.parts?.[0];
      
      if (part && part.functionCall) {
        const fnName = part.functionCall.name;
        const args = part.functionCall.args;
        
        let responseMsg = "";

        if (fnName === "update_inspection_date") {
          const facName = args.facilityName;
          const dateStr = args.date;
          
          const facility = findFacility(facName);
          if (facility) {
            onUpdateFacility({ ...facility, lastInspectionDate: dateStr });
            responseMsg = `✅ Đã cập nhật thành công ngày kiểm tra cho cơ sở **${facility.name}** thành ${new Date(dateStr).toLocaleDateString('vi-VN')}.`;
          } else {
            responseMsg = `❌ Không tìm thấy cơ sở nào khớp với tên "${facName}" trong cơ sở dữ liệu.`;
          }
        } 
        else if (fnName === "create_task") {
          const title = args.title;
          const assigneeName = args.assignee;
          const deadline = args.deadline || '';
          
          const realAssignee = findAssignee(assigneeName);
          
          const newTask: Task = {
            id: generateId(),
            title,
            assignee: realAssignee,
            deadline,
            isCompleted: false,
            createdAt: Date.now()
          };
          onAddTask(newTask);
          responseMsg = `✅ Đã tạo nhiệm vụ: **${title}** và giao cho **${realAssignee}**${deadline ? ` (Hạn: ${new Date(deadline).toLocaleDateString('vi-VN')})` : ''}.`;
        }
        else if (fnName === "delete_task") {
          const title = args.title.toLowerCase().trim();
          const taskToDelete = tasks.find(t => t.title.toLowerCase().includes(title));
          
          if (taskToDelete) {
            onDeleteTask(taskToDelete.id);
            responseMsg = `🗑️ Đã xóa công việc: **${taskToDelete.title}** thành công.`;
          } else {
            responseMsg = `❌ Không tìm thấy công việc nào có tên giống "${args.title}" để xóa.`;
          }
        }
        else if (fnName === "delete_facility") {
          const facName = args.facilityName;
          const facility = findFacility(facName);
          
          if (facility) {
            onDeleteFacility(facility.id);
            responseMsg = `🗑️ Đã xóa cơ sở **${facility.name}** khỏi hệ thống.`;
          } else {
            responseMsg = `❌ Không tìm thấy cơ sở nào tên "${facName}" để xóa.`;
          }
        }
        
        return responseMsg;
      }
      
      if (part && part.text) {
        return part.text;
      }

      return "AI không đưa ra phản hồi hợp lệ.";

    } catch (error: any) {
      console.error(error);
      return `LỖI HỆ THỐNG: ${error.message}`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: generateId(), role: 'user', content: userMsg }]);
    
    setIsLoading(true);
    const aiResponse = await callGeminiAPI(userMsg);
    setIsLoading(false);
    
    setMessages(prev => [...prev, { id: generateId(), role: 'model', content: aiResponse }]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50 ${
          isOpen ? 'bg-slate-700 text-slate-300' : 'bg-blue-600 hover:bg-blue-500 text-white animate-bounce'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] md:w-[400px] h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col z-50 overflow-hidden transform transition-all">
          
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 p-1.5 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-bold text-slate-100">AI Trợ Lý PCCC</h3>
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="text-slate-400 hover:text-white p-1 rounded"
              title="Cài đặt API Key"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {showSettings && (
            <div className="p-4 bg-slate-800 border-b border-slate-700">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Gemini API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 mb-2"
              />
              <button 
                onClick={() => saveApiKey(apiKey)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded"
              >
                Lưu Mã Khóa (Lưu trên máy)
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : msg.role === 'system'
                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800 rounded-bl-none'
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}
                >
                  {msg.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-slate-800 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="VD: Cập nhật nhà nghỉ tùng lâm hôm nay"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full p-2.5 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          
        </div>
      )}
    </>
  );
}
