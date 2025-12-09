import React, { useState, useEffect } from 'react';



import { 

  Clock, 

  Briefcase, 

  FileText, 

  BarChart2, 

  Plus, 

  LogOut, 

  User, 

  Calendar, 

  Trash2,

  ChevronDown,

  PieChart,

  Activity,

  CheckCircle2,

  X,        

  Check,    

  FolderPlus,

  Filter,

  Tag,

  Users, 

  Shield, 

  Search,

  Lock 

} from 'lucide-react';

// 這裡我們引入的是 app, auth (驗證), firestore (資料庫)

import { initializeApp } from 'firebase/app';

import { 

  getAuth, 

  signInAnonymously, 

  onAuthStateChanged, 

  signOut,

  updateProfile,

  signInWithCustomToken

} from 'firebase/auth';

import { 

  getFirestore, 

  collection, 

  addDoc, 

  query, 

  orderBy, 

  onSnapshot, 

  deleteDoc, 

  doc, 

  getDocs,

  serverTimestamp,

  where

} from 'firebase/firestore';

// --- Firebase Configuration ---

// ✅ 已更新：填入您提供的真實設定

const firebaseConfig = {

  apiKey: "AIzaSyContLdIY2hgCZ0DkxwL05cLcxs_OVx3JE",

  authDomain: "hannee-time-tracker.firebaseapp.com",

  projectId: "hannee-time-tracker",

  storageBucket: "hannee-time-tracker.firebasestorage.app",

  messagingSenderId: "25484599876",

  appId: "1:25484599876:web:2ede5f23cbe7c2ab715211",

  measurementId: "G-2DDMC53Y08"

};

// --- 初始化 Firebase (關鍵步驟) ---

// ⚠️ 注意：這裡必須手動啟動 Auth 和 Firestore，不能只 copy 官方預設碼

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);       // 啟動身份驗證 (工時系統核心)

const db = getFirestore(app);    // 啟動資料庫 (工時系統核心)

const appId = 'hannee-tracker-v1'; // 資料庫集合名稱

// --- Main Component ---

export default function TimeTrackerApp() {

  const [currentUserData, setCurrentUserData] = useState(null); 

  const [firebaseUser, setFirebaseUser] = useState(null); 

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('report'); 

  const [projects, setProjects] = useState([]);

  const [usersList, setUsersList] = useState([]); 

  const [entries, setEntries] = useState([]);

  // Login State

  const [selectedUserId, setSelectedUserId] = useState('');

  const [passwordInput, setPasswordInput] = useState(''); 

  // Admin State

  const [newUserOpen, setNewUserOpen] = useState(false);

  const [newUserName, setNewUserName] = useState('');

  const [newUserPassword, setNewUserPassword] = useState('');

  const [newUserRole, setNewUserRole] = useState('employee');

  // Quick Add Project

  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [quickProjectName, setQuickProjectName] = useState('');

  // Date Filters

  const [myFilterStartDate, setMyFilterStartDate] = useState(() => {

    const date = new Date();

    date.setDate(1); 

    return date.toISOString().split('T')[0];

  });

  const [myFilterEndDate, setMyFilterEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [adminFilterStartDate, setAdminFilterStartDate] = useState(() => {

    const date = new Date();

    date.setDate(1); 

    return date.toISOString().split('T')[0];

  });

  const [adminFilterEndDate, setAdminFilterEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State

  const [formData, setFormData] = useState({

    projectId: '',

    workNature: '',

    hours: '',

    date: new Date().toISOString().split('T')[0],

    description: ''

  });

  // --- Cleaned Auth Initialization (修正後) ---

  useEffect(() => {

    // 直接使用匿名登入，移除所有聊天室環境變數檢查

    signInAnonymously(auth).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      setFirebaseUser(user);

    });

    return () => unsubscribe();

  }, []);

  // --- Data Fetching ---

  useEffect(() => {

    if (!firebaseUser) return;

    // 1. Projects

    const projectsRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');

    // Seed default projects if empty

    getDocs(projectsRef).then(snapshot => {

      if (snapshot.empty) {

        addDoc(projectsRef, { name: '內部會議', createdAt: serverTimestamp() });

        addDoc(projectsRef, { name: '行政工作', createdAt: serverTimestamp() });

      }

    });

    

    const unsubProjects = onSnapshot(query(projectsRef, orderBy('name')), (snapshot) => {

      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setProjects(list);

    });

    // 2. Users

    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');

    // Seed default users if empty

    getDocs(usersRef).then(snapshot => {

      if (snapshot.empty) {

        addDoc(usersRef, { name: 'Admin', role: 'manager', password: '123', createdAt: serverTimestamp() });

        addDoc(usersRef, { name: 'Employee A', role: 'employee', password: '123', createdAt: serverTimestamp() });

      }

    });

    const unsubUsers = onSnapshot(query(usersRef, orderBy('name')), (snapshot) => {

      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setUsersList(list);

      setLoading(false);

    });

    // 3. Entries

    const entriesRef = collection(db, 'artifacts', appId, 'public', 'data', 'time_entries');

    const unsubEntries = onSnapshot(entriesRef, (snapshot) => {

      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      list.sort((a, b) => new Date(b.date) - new Date(a.date));

      setEntries(list);

    });

    return () => {

      unsubProjects();

      unsubUsers();

      unsubEntries();

    };

  }, [firebaseUser]);

  // --- Handlers ---

  const handleLogin = (e) => {

    e.preventDefault();

    if (!selectedUserId || !passwordInput) return;

    const user = usersList.find(u => u.id === selectedUserId);

    if (user && user.password === passwordInput) {

      setCurrentUserData(user);

      setPasswordInput('');

    } else {

      alert("密碼錯誤，請重試");

    }

  };

  const handleLogout = () => {

    setCurrentUserData(null);

    setSelectedUserId('');

    setPasswordInput('');

    setActiveTab('report');

  };

  const handleAddUser = async (e) => {

    e.preventDefault();

    if (!newUserName.trim() || !newUserPassword.trim()) return;

    try {

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users'), {

        name: newUserName.trim(),

        role: newUserRole,

        password: newUserPassword.trim(),

        createdAt: serverTimestamp()

      });

      setNewUserName('');

      setNewUserPassword('');

      setNewUserRole('employee');

      setNewUserOpen(false);

      alert("新增使用者成功！");

    } catch (error) {

      console.error("Error adding user:", error);

    }

  }

  const handleDeleteUser = async (id) => {

    if (confirm("確定要刪除這位使用者嗎？")) {

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id));

    }

  }

  const handleQuickAddProject = async () => {

    if (!quickProjectName.trim()) return;

    try {

      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), {

        name: quickProjectName.trim(),

        createdAt: serverTimestamp()

      });

      setQuickProjectName('');

      setIsCreatingProject(false);

      setFormData(prev => ({ ...prev, projectId: docRef.id }));

    } catch (error) {

      console.error("Error creating project:", error);

    }

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!currentUserData || !formData.projectId || !formData.hours || !formData.date || !formData.workNature) {

      return;

    }

    try {

      const selectedProject = projects.find(p => p.id === formData.projectId);

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'time_entries'), {

        userId: currentUserData.id,

        userName: currentUserData.name,

        projectId: formData.projectId,

        projectName: selectedProject?.name || '未知專案',

        workNature: formData.workNature,

        hours: parseFloat(formData.hours),

        date: formData.date,

        description: formData.description,

        createdAt: serverTimestamp()

      });

      setFormData({

        projectId: '',

        workNature: '',

        hours: '',

        date: new Date().toISOString().split('T')[0],

        description: ''

      });

      alert("提交成功！");

    } catch (error) {

      console.error("Error adding entry:", error);

    }

  };

  const handleDeleteEntry = async (id) => {

    if (confirm("確定要刪除這筆紀錄嗎？")) {

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'time_entries', id));

    }

  };

  // --- Derived Data ---

  const myEntries = entries.filter(e => {

    const isOwner = e.userId === currentUserData?.id;

    const isAfterStart = !myFilterStartDate || e.date >= myFilterStartDate;

    const isBeforeEnd = !myFilterEndDate || e.date <= myFilterEndDate;

    return isOwner && isAfterStart && isBeforeEnd;

  });

  const myTotalHours = myEntries.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);

  const adminEntries = entries.filter(e => {

    const isAfterStart = !adminFilterStartDate || e.date >= adminFilterStartDate;

    const isBeforeEnd = !adminFilterEndDate || e.date <= adminFilterEndDate;

    return isAfterStart && isBeforeEnd;

  });

  const adminTotalHours = adminEntries.reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);

  const adminUniqueUsers = new Set(adminEntries.map(e => e.userId)).size;

  const getNatureBadgeColor = (nature) => {

    if (nature === '設計性質') return 'bg-purple-50 text-purple-700 border-purple-100';

    if (nature === '專案管理性質') return 'bg-blue-50 text-blue-700 border-blue-100';

    return 'bg-gray-50 text-gray-700 border-gray-100';

  };

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-50">

        <div className="flex flex-col items-center gap-4">

          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-100 border-t-[#7adbd4]"></div>

          <p className="text-[#7adbd4] font-medium animate-pulse">系統載入中...</p>

        </div>

      </div>

    );

  }

  if (!currentUserData) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-[#7adbd4]/10 px-4">

        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl shadow-cyan-100/50 w-full max-w-md border border-white/50">

          <div className="flex justify-center mb-8">

            <div className="p-4 bg-gradient-to-tr from-[#7adbd4] to-cyan-400 rounded-2xl shadow-lg shadow-cyan-200/50">

              <Clock className="w-10 h-10 text-white" />

            </div>

          </div>

          <h2 className="text-3xl font-extrabold text-center text-slate-800 mb-2 tracking-tight">歡迎使用</h2>

          <p className="text-center text-slate-500 mb-8 font-medium">請登入您的帳號</p>

          

          <form onSubmit={handleLogin} className="space-y-6">

            <div className="space-y-2">

              <label className="block text-sm font-bold text-slate-700 ml-1">選擇使用者</label>

              <div className="relative">

                <select 

                  required

                  value={selectedUserId}

                  onChange={(e) => setSelectedUserId(e.target.value)}

                  className="w-full appearance-none px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#7adbd4]/30 focus:border-[#7adbd4] outline-none transition-all duration-200 text-slate-800 cursor-pointer text-lg"

                >

                  <option value="" disabled>請選擇...</option>

                  {usersList.map(u => (

                    <option key={u.id} value={u.id}>

                      {u.name} {u.role === 'manager' ? '(管理員)' : ''}

                    </option>

                  ))}

                </select>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">

                  <ChevronDown className="w-5 h-5" />

                </div>

              </div>

            </div>

            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">

              <label className="block text-sm font-bold text-slate-700 ml-1">登入密碼</label>

              <div className="relative">

                <input 

                  type="password"

                  required

                  placeholder="請輸入密碼..."

                  value={passwordInput}

                  onChange={(e) => setPasswordInput(e.target.value)}

                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#7adbd4]/30 focus:border-[#7adbd4] outline-none transition-all duration-200 text-slate-800 text-lg"

                />

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">

                  <Lock className="w-5 h-5" />

                </div>

              </div>

            </div>

            <button

              type="submit"

              disabled={!selectedUserId || !passwordInput}

              className="w-full py-3.5 px-6 bg-[#7adbd4] hover:bg-[#6bcac3] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-cyan-200/50 active:transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"

            >

              <span>進入系統</span>

              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />

            </button>

          </form>

          <div className="mt-6 text-center text-xs text-slate-400">

            Hannee Design Internal System

          </div>

        </div>

      </div>

    );

  }

  return (

    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">

      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between h-20 items-center">

            <div className="flex items-center gap-4">

              <div className="bg-gradient-to-br from-[#7adbd4] to-cyan-600 p-2.5 rounded-xl shadow-md shadow-cyan-200/50">

                <Clock className="w-6 h-6 text-white" />

              </div>

              <div>

                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">工時管理系統</h1>

                <p className="text-xs text-slate-500 font-medium mt-0.5 tracking-wide">Hannee Design</p>

              </div>

            </div>

            <div className="flex items-center gap-6">

              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">

                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm ${currentUserData.role === 'manager' ? 'bg-purple-400' : 'bg-[#7adbd4]'}`}>

                  {currentUserData.name?.[0]}

                </div>

                <div className="flex flex-col items-start">

                   <span className="text-sm font-bold text-slate-700 leading-tight">{currentUserData.name}</span>

                   <span className="text-[10px] text-slate-400 font-medium uppercase">{currentUserData.role === 'manager' ? 'Manager' : 'Employee'}</span>

                </div>

              </div>

              <button 

                onClick={handleLogout}

                className="group flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors py-2 px-3 rounded-lg hover:bg-red-50"

                title="登出"

              >

                <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />

              </button>

            </div>

          </div>

        </div>

        

        <div className="border-t border-slate-100 bg-white/50 backdrop-blur-sm">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="flex space-x-8 overflow-x-auto no-scrollbar">

              <TabButton 

                active={activeTab === 'report'} 

                onClick={() => setActiveTab('report')} 

                icon={<Plus className="w-4 h-4" />}

                label="新增紀錄"

              />

               <TabButton 

                active={activeTab === 'my-records'} 

                onClick={() => setActiveTab('my-records')} 

                icon={<User className="w-4 h-4" />}

                label="我的紀錄"

              />

              {currentUserData.role === 'manager' && (

                <TabButton 

                  active={activeTab === 'admin'} 

                  onClick={() => setActiveTab('admin')} 

                  icon={<Shield className="w-4 h-4" />}

                  label="團隊儀表板 (後台)"

                />

              )}

            </div>

          </div>

        </div>

      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {activeTab === 'report' && (

          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

             <div className="flex items-center justify-between mb-8">

              <div>

                <h2 className="text-2xl font-bold text-slate-900">新增工時紀錄</h2>

                <p className="text-slate-500 mt-1">Hello, {currentUserData.name}。請填寫今日工作內容。</p>

              </div>

            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative">

              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#7adbd4] via-cyan-400 to-teal-300"></div>

              

              <div className="p-8 md:p-10">

                <form onSubmit={handleSubmit} className="space-y-8">

                  <div className="space-y-3">

                    <label className="block text-sm font-bold text-slate-700">

                      工項性質 <span className="text-red-500">*</span>

                    </label>

                    <div className="relative group">

                      <select

                        required

                        value={formData.workNature}

                        onChange={(e) => setFormData({...formData, workNature: e.target.value})}

                        className="w-full appearance-none bg-slate-50/50 border border-slate-200 text-slate-700 py-4 px-5 pr-10 rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#7adbd4] focus:ring-4 focus:ring-[#7adbd4]/20 transition-all cursor-pointer hover:border-[#7adbd4]/50"

                      >

                        <option value="" disabled>請選擇性質...</option>

                        <option value="專案管理性質">專案管理性質</option>

                        <option value="設計性質">設計性質</option>

                      </select>

                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 group-hover:text-[#7adbd4] transition-colors">

                        <ChevronDown className="w-5 h-5" />

                      </div>

                    </div>

                  </div>

                  <div className="space-y-3">

                    <div className="flex justify-between items-center">

                      <label className="block text-sm font-bold text-slate-700">

                        專案名稱 <span className="text-red-500">*</span>

                      </label>

                      {!isCreatingProject && (

                        <button 

                          type="button"

                          onClick={() => setIsCreatingProject(true)}

                          className="text-xs font-bold text-[#7adbd4] hover:text-[#6bcac3] flex items-center gap-1 px-2 py-1 hover:bg-[#7adbd4]/10 rounded transition-colors"

                        >

                          <Plus className="w-3 h-3" />

                          找不到專案？新增

                        </button>

                      )}

                    </div>

                    {isCreatingProject ? (

                      <div className="relative flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">

                        <div className="relative flex-1">

                          <input

                            type="text"

                            autoFocus

                            placeholder="輸入新專案名稱..."

                            value={quickProjectName}

                            onChange={(e) => setQuickProjectName(e.target.value)}

                            className="w-full bg-white border-2 border-[#7adbd4] text-slate-700 py-3.5 px-5 pr-10 rounded-xl font-medium focus:outline-none shadow-sm"

                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAddProject(); } }}

                          />

                        </div>

                        <button type="button" onClick={handleQuickAddProject} disabled={!quickProjectName.trim()} className="bg-[#7adbd4] hover:bg-[#6bcac3] disabled:bg-slate-300 text-white p-4 rounded-xl shadow-md transition-colors"><Check className="w-5 h-5" /></button>

                        <button type="button" onClick={() => { setIsCreatingProject(false); setQuickProjectName(''); }} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-4 rounded-xl shadow-sm transition-colors"><X className="w-5 h-5" /></button>

                      </div>

                    ) : (

                      <div className="relative group">

                        <select

                          required

                          value={formData.projectId}

                          onChange={(e) => setFormData({...formData, projectId: e.target.value})}

                          className="w-full appearance-none bg-slate-50/50 border border-slate-200 text-slate-700 py-4 px-5 pr-10 rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#7adbd4] focus:ring-4 focus:ring-[#7adbd4]/20 transition-all cursor-pointer hover:border-[#7adbd4]/50"

                        >

                          <option value="" disabled>請選擇專案...</option>

                          {projects.map(p => (

                            <option key={p.id} value={p.id}>{p.name}</option>

                          ))}

                        </select>

                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 group-hover:text-[#7adbd4] transition-colors">

                          <ChevronDown className="w-5 h-5" />

                        </div>

                      </div>

                    )}

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <div className="space-y-3">

                      <label className="block text-sm font-bold text-slate-700">工時 (小時) <span className="text-red-500">*</span></label>

                      <input type="number" step="0.5" required placeholder="0.0" value={formData.hours} onChange={(e) => setFormData({...formData, hours: e.target.value})} className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 py-4 px-5 rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#7adbd4] focus:ring-4 focus:ring-[#7adbd4]/20 transition-all hover:border-[#7adbd4]/50" />

                    </div>

                    <div className="space-y-3">

                      <label className="block text-sm font-bold text-slate-700">日期 <span className="text-red-500">*</span></label>

                      <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 py-4 px-5 rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#7adbd4] focus:ring-4 focus:ring-[#7adbd4]/20 transition-all hover:border-[#7adbd4]/50" />

                    </div>

                  </div>

                  <div className="space-y-3">

                    <label className="block text-sm font-bold text-slate-700">工作內容描述</label>

                    <textarea rows="4" placeholder="請簡單描述您今天完成了哪些項目..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50/50 border border-slate-200 text-slate-700 py-4 px-5 rounded-xl font-medium focus:outline-none focus:bg-white focus:border-[#7adbd4] focus:ring-4 focus:ring-[#7adbd4]/20 transition-all resize-none hover:border-[#7adbd4]/50"></textarea>

                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-6">

                    <span className="text-sm text-slate-400">所有欄位皆為必填</span>

                    <button type="submit" className="bg-[#7adbd4] hover:bg-[#6bcac3] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-cyan-200/50 hover:shadow-xl hover:shadow-cyan-300/50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">

                      <Plus className="w-5 h-5" /> 提交工時

                    </button>

                  </div>

                </form>

              </div>

            </div>

          </div>

        )}

        {activeTab === 'my-records' && (

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

              <div>

                <h2 className="text-2xl font-bold text-slate-900">我的工時紀錄</h2>

                <p className="text-slate-500 mt-1">個人工作歷程查詢</p>

              </div>

              <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">

                 <div className="bg-[#7adbd4]/10 p-2 rounded-lg"><Activity className="w-5 h-5 text-[#7adbd4]" /></div>

                 <div>

                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">區間累計</p>

                    <p className="text-xl font-extrabold text-slate-800 tabular-nums">{myTotalHours} <span className="text-sm font-medium text-slate-400">hrs</span></p>

                 </div>

              </div>

            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4">

               <div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><Filter className="w-4 h-4" /> 篩選日期:</div>

               <div className="flex items-center gap-2 w-full md:w-auto">

                 <input type="date" value={myFilterStartDate} onChange={(e) => setMyFilterStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#7adbd4]/30 focus:border-[#7adbd4] outline-none flex-1 md:w-40" />

                 <span className="text-slate-400">至</span>

                 <input type="date" value={myFilterEndDate} onChange={(e) => setMyFilterEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#7adbd4]/30 focus:border-[#7adbd4] outline-none flex-1 md:w-40" />

               </div>

            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

               {myEntries.length === 0 ? <EmptyState message="區間內無紀錄" /> : (

                <div className="overflow-x-auto">

                  <table className="min-w-full">

                    <thead>

                      <tr className="bg-slate-50/80 border-b border-slate-200">

                        <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">日期</th>

                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">專案</th>

                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">性質</th>

                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">內容</th>

                        <th className="px-6 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">時數</th>

                        <th className="px-6 py-5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">操作</th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {myEntries.map((entry) => (

                        <tr key={entry.id} className="group hover:bg-slate-50/80 transition-colors">

                          <td className="px-8 py-5 whitespace-nowrap text-sm font-medium text-slate-600">{entry.date}</td>

                          <td className="px-6 py-5 whitespace-nowrap"><span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#7adbd4]/10 text-[#5ab8b1] border border-[#7adbd4]/30">{entry.projectName}</span></td>

                          <td className="px-6 py-5 whitespace-nowrap"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${getNatureBadgeColor(entry.workNature)}`}>{entry.workNature}</span></td>

                          <td className="px-6 py-5 text-sm text-slate-600 max-w-md truncate">{entry.description || '-'}</td>

                          <td className="px-6 py-5 whitespace-nowrap text-right"><span className="text-sm font-bold text-slate-800">{entry.hours} h</span></td>

                          <td className="px-6 py-5 whitespace-nowrap text-center">

                            <button onClick={() => handleDeleteEntry(entry.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

               )}

            </div>

          </div>

        )}

        {activeTab === 'admin' && currentUserData.role === 'manager' && (

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

              <div>

                <h2 className="text-2xl font-bold text-slate-900">團隊儀表板</h2>

                <p className="text-slate-500 mt-1">管理員專用：查看所有成員工作狀況與人員管理</p>

              </div>

              <div className="grid grid-cols-3 gap-4">

                 <StatCard icon={<Clock className="w-5 h-5 text-white" />} color="bg-[#7adbd4]" label="篩選總工時" value={`${adminTotalHours}h`} />

                 <StatCard icon={<PieChart className="w-5 h-5 text-white" />} color="bg-emerald-500" label="專案數" value={projects.length} />

                 <StatCard icon={<User className="w-5 h-5 text-white" />} color="bg-blue-500" label="活躍成員" value={adminUniqueUsers} />

              </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              

              <div className="lg:col-span-2 space-y-4">

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-4 justify-between">

                   <div className="flex items-center gap-2 text-slate-700 font-bold"><Search className="w-4 h-4" /> 紀錄搜尋</div>

                   <div className="flex items-center gap-2 w-full sm:w-auto">

                     <input type="date" value={adminFilterStartDate} onChange={(e) => setAdminFilterStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#7adbd4]/30 focus:border-[#7adbd4] outline-none flex-1" />

                     <span className="text-slate-400">-</span>

                     <input type="date" value={adminFilterEndDate} onChange={(e) => setAdminFilterEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-[#7adbd4]/30 focus:border-[#7adbd4] outline-none flex-1" />

                   </div>

                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden min-h-[400px]">

                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">

                    <h3 className="font-bold text-slate-800">工時紀錄明細</h3>

                    <span className="text-xs font-medium px-2 py-1 bg-slate-200 rounded text-slate-600">{adminEntries.length} 筆資料</span>

                  </div>

                  {adminEntries.length === 0 ? <EmptyState message="區間內無紀錄" /> : (

                    <div className="overflow-x-auto">

                      <table className="min-w-full">

                        <thead>

                          <tr className="bg-slate-50/50">

                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">成員</th>

                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">日期</th>

                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase">專案/性質</th>

                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase">時數</th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-50">

                          {adminEntries.map((entry) => (

                            <tr key={entry.id} className="hover:bg-slate-50/80">

                              <td className="px-6 py-4 whitespace-nowrap">

                                <div className="flex items-center gap-2">

                                  <div className="w-6 h-6 rounded bg-[#7adbd4] text-white flex items-center justify-center text-xs font-bold">{entry.userName?.[0]}</div>

                                  <span className="text-sm font-bold text-slate-700">{entry.userName}</span>

                                </div>

                              </td>

                              <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">{entry.date}</td>

                              <td className="px-4 py-4">

                                <div className="flex flex-col gap-1">

                                  <span className="text-xs font-semibold text-slate-700">{entry.projectName}</span>

                                  <span className="text-[10px] text-slate-400">{entry.workNature}</span>

                                </div>

                              </td>

                              <td className="px-4 py-4 whitespace-nowrap text-right"><span className="text-sm font-bold text-slate-800">{entry.hours}</span></td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>

              </div>

              <div className="space-y-4">

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">

                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4"/> 人員管理</h3>

                    <button onClick={() => setNewUserOpen(!newUserOpen)} className="text-xs bg-[#7adbd4] text-white px-2 py-1 rounded hover:bg-[#6bcac3] transition">

                      {newUserOpen ? '取消' : '+ 新增'}

                    </button>

                  </div>

                  

                  {newUserOpen && (

                    <div className="p-4 bg-[#7adbd4]/5 border-b border-[#7adbd4]/10 animate-in fade-in slide-in-from-top-2">

                      <form onSubmit={handleAddUser} className="space-y-3">

                        <div>

                          <label className="text-xs font-bold text-slate-600">姓名</label>

                          <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full text-sm border border-slate-200 rounded p-2 mt-1 focus:outline-none focus:border-[#7adbd4]" placeholder="輸入姓名" />

                        </div>

                        <div>

                          <label className="text-xs font-bold text-slate-600">預設密碼</label>

                          <input type="text" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full text-sm border border-slate-200 rounded p-2 mt-1 focus:outline-none focus:border-[#7adbd4]" placeholder="設定密碼" />

                        </div>

                        <div>

                          <label className="text-xs font-bold text-slate-600">權限角色</label>

                          <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full text-sm border border-slate-200 rounded p-2 mt-1 focus:outline-none focus:border-[#7adbd4]">

                            <option value="employee">一般員工</option>

                            <option value="manager">管理員 (Manager)</option>

                          </select>

                        </div>

                        <button type="submit" className="w-full bg-[#7adbd4] text-white text-xs font-bold py-2 rounded shadow-sm hover:bg-[#6bcac3]">確認新增</button>

                      </form>

                    </div>

                  )}

                  <div className="max-h-[400px] overflow-y-auto">

                    {usersList.map(u => (

                      <div key={u.id} className="px-6 py-3 border-b border-slate-50 hover:bg-slate-50 flex justify-between items-center group">

                        <div className="flex items-center gap-3">

                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${u.role === 'manager' ? 'bg-purple-400' : 'bg-slate-300'}`}>

                            {u.name[0]}

                          </div>

                          <div>

                            <p className="text-sm font-bold text-slate-700">{u.name}</p>

                            <p className="text-[10px] text-slate-400 uppercase">{u.role}</p>

                          </div>

                        </div>

                        <button onClick={() => handleDeleteUser(u.id)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>

                      </div>

                    ))}

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>

  );

}

function TabButton({ active, onClick, icon, label }) {

  return (

    <button onClick={onClick} className={`relative flex items-center gap-2.5 py-4 px-1 text-sm font-bold transition-all duration-300 ${active ? 'text-[#7adbd4]' : 'text-slate-400 hover:text-slate-600'}`}>

      <span className={`p-1 rounded-md transition-colors ${active ? 'bg-[#7adbd4]/10' : 'bg-transparent'}`}>{icon}</span>

      {label}

      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[#7adbd4] rounded-full transform transition-transform duration-300 origin-left ${active ? 'scale-x-100' : 'scale-x-0'}`}></span>

    </button>

  );

}

function StatCard({ icon, color, label, value }) {

  return (

    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[140px]">

      <div className={`p-3 rounded-xl shadow-lg shadow-gray-200 ${color}`}>{icon}</div>

      <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p><p className="text-lg font-extrabold text-slate-800 leading-none mt-0.5">{value}</p></div>

    </div>

  )

}

function EmptyState({ message }) {

  return (

    <div className="text-center py-20 px-4">

      <div className="bg-slate-50 inline-flex p-6 rounded-full mb-6 ring-8 ring-slate-50/50"><FileText className="w-10 h-10 text-slate-300" /></div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">這裡空空如也</h3>

      <p className="text-slate-500 max-w-sm mx-auto">{message}</p>

    </div>

  );

}

