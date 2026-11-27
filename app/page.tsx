'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  School,
  Newspaper,
  Users,
  UserPlus,
  PhoneCall,
  LogIn,
  LogOut,
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';

interface SchoolSettings {
  id?: number;
  school_name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  ppdb_info: string;
}

interface PostItem {
  id: string;
  title: string;
  category: string;
  content: string;
  created_at?: string;
}

interface StaffItem {
  id: string;
  name: string;
  role: string;
  subject_or_unit: string;
}

interface ContactMessageItem {
  id: string;
  sender_name: string;
  contact_info: string;
  message: string;
  created_at?: string;
}

const DEFAULT_SETTINGS: SchoolSettings = {
  school_name: 'SMA Sains Terpadu Darussaadah Pace',
  tagline: 'Unggul dalam Sains, Berkarakter Islami, Berwawasan Global',
  address: 'Kecamatan Pace, Kabupaten Nganjuk, Jawa Timur',
  phone: '0812-3456-7890',
  email: 'info@smadarussaadahpace.sch.id',
  ppdb_info: 'Pendaftaran peserta didik baru dibuka untuk tahun ajaran baru.',
};

export default function SchoolPortalPage() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const [supabaseUrl, setSupabaseUrl] = useState(envUrl);
  const [supabaseKey, setSupabaseKey] = useState(envKey);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'home' | 'posts' | 'staff' | 'ppdb' | 'contact' | 'admin'
  >('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [settings, setSettings] = useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [ppdbList, setPpdbList] = useState<PpdbItem[]>([]);
const [contactList, setContactList] = useState<ContactMessageItem[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Form PPDB
  const [studentName, setStudentName] = useState('');
  const [originSchool, setOriginSchool] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  // Form Kontak
  const [senderName, setSenderName] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [messageText, setMessageText] = useState('');

  // Form Admin Berita
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('Pengumuman');
  const [postContent, setPostContent] = useState('');

  // Form Admin Guru/Staf
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Guru Mapel');
  const [staffUnit, setStaffUnit] = useState('');

  const supabase: SupabaseClient | null = useMemo(() => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) return null;
    try {
      return createClient(supabaseUrl.trim(), supabaseKey.trim());
    } catch {
      return null;
    }
  }, [supabaseUrl, supabaseKey]);

  const notify = (type: 'ok' | 'err', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const loadPortalData = async (client: SupabaseClient, isLoggedIn: boolean) => {
    try {
      const { data: settingsData } = await client
        .from('school_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...settingsData,
        });
      }

      const { data: postsData } = await client
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (postsData) setPosts(postsData);

      const { data: staffData } = await client
        .from('staff')
        .select('*')
        .order('name', { ascending: true });
      if (staffData) setStaff(staffData);

      if (isLoggedIn) {
        const { data: ppdbData } = await client
          .from('ppdb_registrations')
          .select('*')
          .order('created_at', { ascending: false });
        if (ppdbData) setPpdbList(ppdbData);
        const { data: contactsData } = await client
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (contactsData) setContactList(contactsData);
      } else {
        setPpdbList([]);
        setContactList([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data Supabase.';
      notify('err', msg);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const email = data.session?.user?.email ?? null;
      setUserEmail(email);
      loadPortalData(supabase, Boolean(email));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      loadPortalData(supabase, Boolean(email));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      notify('err', 'Hubungkan URL dan Anon Key Supabase terlebih dahulu.');
      return;
    }
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setAuthLoading(false);

    if (error) {
      notify('err', `Login gagal: ${error.message}`);
      return;
    }
    setUserEmail(data.user?.email ?? loginEmail.trim());
    setLoginPassword('');
    notify('ok', 'Berhasil login sebagai admin.');
    loadPortalData(supabase, true);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    setPpdbList([]);
    setContactList([]);
    notify('ok', 'Anda telah keluar dari akun admin.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userEmail) {
      notify('err', 'Silakan login admin terlebih dahulu.');
      return;
    }
    const payload = {
      school_name: settings.school_name,
      tagline: settings.tagline,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      ppdb_info: settings.ppdb_info,
    };

    const query = settings.id
      ? supabase.from('school_settings').update(payload).eq('id', settings.id)
      : supabase.from('school_settings').insert(payload);

    const { error } = await query;
    if (error) {
      notify('err', `Gagal menyimpan profil: ${error.message}`);
    } else {
      notify('ok', 'Profil sekolah berhasil disimpan ke Supabase.');
      loadPortalData(supabase, true);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userEmail) {
      notify('err', 'Silakan login admin terlebih dahulu.');
      return;
    }
    const { error } = await supabase.from('posts').insert({
      title: postTitle.trim(),
      category: postCategory,
      content: postContent.trim(),
    });
    if (error) {
      notify('err', `Gagal menambah berita: ${error.message}`);
    } else {
      setPostTitle('');
      setPostContent('');
      notify('ok', 'Berita/pengumuman berhasil dipublikasikan.');
      loadPortalData(supabase, true);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!supabase || !userEmail) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      notify('err', `Gagal menghapus berita: ${error.message}`);
    } else {
      notify('ok', 'Berita dihapus.');
      loadPortalData(supabase, true);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userEmail) {
      notify('err', 'Silakan login admin terlebih dahulu.');
      return;
    }
    const { error } = await supabase.from('staff').insert({
      name: staffName.trim(),
      role: staffRole,
      subject_or_unit: staffUnit.trim(),
    });
    if (error) {
      notify('err', `Gagal menambah guru/staf: ${error.message}`);
    } else {
      setStaffName('');
      setStaffUnit('');
      notify('ok', 'Data guru/staf berhasil ditambahkan.');
      loadPortalData(supabase, true);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!supabase || !userEmail) return;
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) {
      notify('err', `Gagal menghapus data: ${error.message}`);
    } else {
      notify('ok', 'Data guru/staf dihapus.');
      loadPortalData(supabase, true);
    }
  };

  const handlePpdbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      notify('err', 'Koneksi Supabase belum aktif.');
      return;
    }
    const { error } = await supabase.from('ppdb_registrations').insert({
      student_name: studentName.trim(),
      origin_school: originSchool.trim(),
      parent_phone: parentPhone.trim(),
      status: 'Menunggu Verifikasi',
    });
    if (error) {
      notify('err', `Gagal mengirim pendaftaran PPDB: ${error.message}`);
    } else {
      setStudentName('');
      setOriginSchool('');
      setParentPhone('');
      notify('ok', 'Pendaftaran PPDB berhasil dikirim!');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      notify('err', 'Koneksi Supabase belum aktif.');
      return;
    }
    const { error } = await supabase.from('contact_messages').insert({
      sender_name: senderName.trim(),
      contact_info: senderContact.trim(),
      message: messageText.trim(),
    });
    if (error) {
      notify('err', `Gagal mengirim pesan: ${error.message}`);
    } else {
      setSenderName('');
      setSenderContact('');
      setMessageText('');
      notify('ok', 'Pesan Anda telah terkirim ke pihak sekolah.');
    }
  };

  const navItems = [
    { id: 'home', label: 'Beranda', icon: School },
    { id: 'posts', label: 'Berita', icon: Newspaper },
    { id: 'staff', label: 'Guru & Staf', icon: Users },
    { id: 'ppdb', label: 'PPDB', icon: UserPlus },
    { id: 'contact', label: 'Kontak', icon: PhoneCall },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Navbar */}
      <header className="bg-blue-900 text-white sticky top-0 z-30 shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left"
          >
            <img
              src="https://banaxebevmxlzpvjbnii.supabase.co/storage/v1/object/public/BARCODE-PPDB/0.png"
              alt="Logo SMA Sains Terpadu Darussaadah Pace"
              className="h-10 w-10 object-contain shrink-0"
            />
            <div>
              <p className="font-bold text-sm sm:text-base leading-tight">
                {settings.school_name}
              </p>
              <p className="text-[11px] text-blue-200 hidden sm:block">
                Portal Informasi & Layanan Digital Sekolah
              </p>
            </div>
          </button>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition ${
                    active
                      ? 'bg-blue-700 text-white font-medium'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => setActiveTab('admin')}
              className={`ml-1 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition ${
                activeTab === 'admin'
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-medium'
              }`}
            >
              <LogIn className="w-4 h-4" />
              {userEmail ? 'Admin' : 'Login Admin'}
            </button>
            <button
              onClick={() => setShowConnectModal(true)}
              className="ml-1 px-2.5 py-1.5 rounded-lg text-xs bg-emerald-950/70 hover:bg-emerald-950 border border-emerald-700 flex items-center gap-1"
              title="Pengaturan Koneksi Supabase"
            >
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              {supabase ? 'Terhubung' : 'Koneksikan Supabase'}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-800"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-emerald-950 border-t border-emerald-800 px-4 py-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm text-left flex items-center gap-2 hover:bg-blue-900"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full px-3 py-2 rounded-lg text-sm text-left bg-amber-400 text-slate-950 font-semibold flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {userEmail ? `Admin (${userEmail})` : 'Login Admin'}
            </button>
            <button
              onClick={() => {
                setShowConnectModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full px-3 py-2 rounded-lg text-sm text-left bg-blue-900 text-blue-200 flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              {supabase ? 'Supabase Terhubung' : 'Koneksikan Supabase'}
            </button>
          </div>
        )}
      </header>

      {/* Notice Banner */}
      {notice && (
        <div className="max-w-6xl w-full mx-auto px-4 pt-4">
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-sm ${
              notice.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {notice.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {activeTab === 'home' && (
          <div className="space-y-8">
            <section className="bg-gradient-to-br from-blue-800 to-blue-950 text-white rounded-2xl p-6 sm:p-10 shadow-sm">
              <p className="text-xs uppercase tracking-wider text-amber-300 font-semibold mb-2">
                Selamat Datang di Portal Resmi
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold leading-tight">
                {settings.school_name}
              </h1>
              <p className="mt-3 text-blue-100 text-sm sm:text-base max-w-2xl">
                {settings.tagline}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('ppdb')}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm transition"
                >
                  Daftar PPDB Sekarang
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition"
                >
                  Lihat Berita & Pengumuman
                </button>
              </div>
            </section>

            <section className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h2 className="font-semibold text-slate-900">Alamat Sekolah</h2>
                <p className="text-sm text-slate-600 mt-1">{settings.address}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h2 className="font-semibold text-slate-900">Kontak Resmi</h2>
                <p className="text-sm text-slate-600 mt-1">Telp/WA: {settings.phone}</p>
                <p className="text-sm text-slate-600">Email: {settings.email}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h2 className="font-semibold text-slate-900">Informasi PPDB</h2>
                <p className="text-sm text-slate-600 mt-1">{settings.ppdb_info}</p>
                <div className="mt-4 flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
  <p className="mb-2 text-xs font-semibold text-slate-800">
    QRIS Pendaftaran / Pembayaran PPDB
  </p>
  <img
    src="https://banaxebevmxlzpvjbnii.supabase.co/storage/v1/object/public/BARCODE-PPDB/SPMB%20SMA%20DARUSSA%20ADAH.png"
    alt="QRIS Pendaftaran SMA Sains Terpadu Darussaadah Pace"
    className="h-44 w-44 rounded object-contain bg-white p-1"
  />
  <p className="mt-2 text-[11px] text-slate-600">
    Scan QRIS untuk pendaftaran & pembayaran PPDB
  </p>
</div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">Berita & Pengumuman</h1>
            {posts.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-sm text-slate-500">
                Belum ada berita atau pengumuman yang tampil. Login sebagai admin untuk menambahkan data baru.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 space-y-2"
                  >
                    <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      {post.category}
                    </span>
                    <h2 className="font-bold text-lg text-slate-900">{post.title}</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-line">{post.content}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">Direktori Guru & Staf</h1>
            {staff.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-sm text-slate-500">
                Belum ada data guru atau staf yang tampil.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {staff.map((person) => (
                  <div
                    key={person.id}
                    className="bg-white p-5 rounded-xl border border-slate-200"
                  >
                    <h2 className="font-bold text-slate-900">{person.name}</h2>
                    <p className="text-sm text-emerald-700 font-medium mt-0.5">{person.role}</p>
                    <p className="text-xs text-slate-500 mt-1">{person.subject_or_unit}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ppdb' && (
          <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Formulir PPDB Online</h1>
              <p className="text-sm text-slate-600 mt-1">{settings.ppdb_info}</p>
            </div>
            <form onSubmit={handlePpdbSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Calon Siswa</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  placeholder="Nama lengkap calon peserta didik"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Asal Sekolah (SMP/MTs)</label>
                <input
                  type="text"
                  required
                  value={originSchool}
                  onChange={(e) => setOriginSchool(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  placeholder="Contoh: SMP Negeri 1 Pace"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">No. HP / WhatsApp Orang Tua</label>
                <input
                  type="text"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm"
              >
                Kirim Pendaftaran
              </button>
            </form>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Hubungi Kami</h1>
              <p className="text-sm text-slate-600 mt-1">
                {settings.address} • {settings.phone}
              </p>
            </div>
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Pengirim</label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email atau No. WhatsApp</label>
                <input
                  type="text"
                  required
                  value={senderContact}
                  onChange={(e) => setSenderContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pesan</label>
                <textarea
                  rows={4}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm"
              >
                Kirim Pesan
              </button>
            </form>
          </div>
        )}

        {activeTab === 'admin' && (
          <div>
            {!userEmail ? (
              <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h1 className="text-xl font-bold text-slate-900">Login Admin Sekolah</h1>
                <p className="text-xs text-slate-500">
                  Masuk menggunakan akun yang terdaftar di Supabase Authentication → Users.
                </p>
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Admin</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-semibold text-sm disabled:opacity-60"
                  >
                    {authLoading ? 'Memproses...' : 'Masuk ke Dashboard'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">Dashboard Admin</h1>
                    <p className="text-xs text-slate-500">Login sebagai: {userEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-medium flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>

                {/* Kelola Profil Sekolah */}
                <form
                  onSubmit={handleSaveSettings}
                  className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3"
                >
                  <h2 className="font-bold text-lg text-slate-900">Profil & Informasi Sekolah</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Nama Sekolah</label>
                      <input
                        type="text"
                        value={settings.school_name}
                        onChange={(e) =>
                          setSettings({ ...settings, school_name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Telepon / WhatsApp</label>
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tagline / Motto</label>
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Alamat</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
                  >
                    Simpan Profil Sekolah
                  </button>
                </form>

                {/* Kelola Berita & Guru */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                    <h2 className="font-bold text-lg text-slate-900">Berita & Pengumuman</h2>
                    <form onSubmit={handleAddPost} className="space-y-2.5">
                      <input
                        type="text"
                        required
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="Judul berita/pengumuman"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      <select
                        value={postCategory}
                        onChange={(e) => setPostCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      >
                        <option value="Pengumuman">Pengumuman</option>
                        <option value="Berita">Berita</option>
                        <option value="Prestasi">Prestasi</option>
                      </select>
                      <textarea
                        rows={3}
                        required
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Isi berita/pengumuman..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah
                      </button>
                    </form>
                    <div className="divide-y divide-slate-100 pt-2">
                      {posts.map((p) => (
                        <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{p.title}</p>
                            <p className="text-xs text-slate-500">{p.category}</p>
                          </div>
                          <button
                            onClick={() => handleDeletePost(p.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                    <h2 className="font-bold text-lg text-slate-900">Data Guru & Staf</h2>
                    <form onSubmit={handleAddStaff} className="space-y-2.5">
                      <input
                        type="text"
                        required
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Nama lengkap guru/staf"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value)}
                        placeholder="Jabatan (mis. Guru Mapel / Tenaga Kependidikan)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={staffUnit}
                        onChange={(e) => setStaffUnit(e.target.value)}
                        placeholder="Mata pelajaran / unit kerja"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Tambah
                      </button>
                    </form>
                    <div className="divide-y divide-slate-100 pt-2">
                      {staff.map((s) => (
                        <div key={s.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{s.name}</p>
                            <p className="text-xs text-slate-500">
                              {s.role} • {s.subject_or_unit}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteStaff(s.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Daftar Pendaftar PPDB */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                  <h2 className="font-bold text-lg text-slate-900">Data Pendaftar PPDB</h2>
                  {ppdbList.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada pendaftar PPDB.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="border-b text-slate-500 text-xs">
                          <tr>
                            <th className="py-2 pr-4">Nama Siswa</th>
                            <th className="py-2 pr-4">Asal Sekolah</th>
                            <th className="py-2 pr-4">No. HP Ortu</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {ppdbList.map((row) => (
                            <tr key={row.id}>
                              <td className="py-2.5 pr-4 font-medium">{row.student_name}</td>
                              <td className="py-2.5 pr-4">{row.origin_school}</td>
                              <td className="py-2.5 pr-4">{row.parent_phone}</td>
                              <td className="py-2.5">{row.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Pesan Masuk */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                  <h2 className="font-bold text-lg text-slate-900">Pesan Masuk (Hubungi Kami)</h2>
                  {contactList.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada pesan masuk.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="border-b text-slate-500 text-xs">
                          <tr>
                            <th className="py-2 pr-4">Nama Pengirim</th>
                            <th className="py-2 pr-4">Kontak</th>
                            <th className="py-2 pr-4">Pesan</th>
                            <th className="py-2">Waktu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {contactList.map((row) => (
                            <tr key={row.id}>
                              <td className="py-2.5 pr-4 font-medium">{row.sender_name}</td>
                              <td className="py-2.5 pr-4">{row.contact_info}</td>
                              <td className="py-2.5 pr-4 whitespace-pre-line">{row.message}</td>
                              <td className="py-2.5 text-xs text-slate-500">
                                {row.created_at
                                  ? new Date(row.created_at).toLocaleString('id-ID')
                                  : '-'}
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
          </div>
        )}
      </main>

      {/* Modal Koneksikan Supabase */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Pengaturan Koneksi Supabase</h2>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Jika sudah diisi di file <code>.env.local</code>, kolom ini otomatis terisi. Anda juga bisa menempelkannya langsung di sini untuk menguji.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Project URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://wczqmtbohtyhccbzvuou.supabase.co"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Publishable / Anon Key</label>
                <input
                  type="text"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="sb_publishable_..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
              >
                Simpan & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
<footer className="bg-slate-900 text-slate-300 py-5 px-4 text-center text-xs">
  © 2026 {settings.school_name}. Semua hak dilindungi.
</footer>
    </div>
  );
}
