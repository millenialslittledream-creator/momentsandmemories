import { useEffect, useState } from 'react';
import AdminRoute, { useAdmin } from '@/components/AdminRoute';
import { api } from '@/lib/api';

type Tab = 'overview' | 'users' | 'shopping';

interface Stats {
  total_users: number;
  total_events: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  notifications_sent: number;
  notifications_failed: number;
}

interface AdminUser { id: string; email: string; created_at: string }

interface UserProfile {
  user: { id: string; email: string; created_at: string };
  events: Array<{ id: string; title: string; status: string; event_date: string; location: string | null; created_at: string }>;
  orders: Array<{ id: string; status: string; total_amount: number; created_at: string }>;
}

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
}

const EMPTY_ITEM = { name: '', description: '', price: '', category: '', image_url: '', stock: '0', is_active: true };

function AdminContent() {
  const { secret, onUnauth } = useAdmin();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // User detail panel
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  // Shop item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [form, setForm] = useState<typeof EMPTY_ITEM>({ ...EMPTY_ITEM });
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.adminGetStats(secret).then(setStats).catch(onUnauth).finally(() => setLoading(false));
  }, [secret]);

  const loadUsers = () => {
    setLoading(true);
    api.adminListUsers(secret).then(d => setUsers(d as AdminUser[])).catch(onUnauth).finally(() => setLoading(false));
  };

  const loadShop = () => {
    setLoading(true);
    api.adminListShopItems(secret).then(d => setShopItems(d as ShopItem[])).catch(onUnauth).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'users') loadUsers();
    else if (tab === 'shopping') loadShop();
  }, [tab]);

  const openUserDetail = async (userId: string) => {
    setUserLoading(true);
    setSelectedUser(null);
    try {
      const profile = await api.adminGetUserProfile(secret, userId) as UserProfile;
      setSelectedUser(profile);
    } catch { /* ignore */ }
    finally { setUserLoading(false); }
  };

  const handleDeleteUser = async (userId: string) => {
    await api.adminDeleteUser(secret, userId).catch(onUnauth);
    setDeleteConfirm(null);
    setSelectedUser(null);
    loadUsers();
  };

  // Shop form handlers
  const openAddForm = () => {
    setEditingItem(null);
    setForm({ ...EMPTY_ITEM });
    setShowAddForm(true);
  };

  const openEditForm = (item: ShopItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category: item.category,
      image_url: item.image_url || '',
      stock: String(item.stock),
      is_active: item.is_active,
    });
    setShowAddForm(true);
  };

  const handleSaveItem = async () => {
    setFormSaving(true);
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      category: form.category,
      image_url: form.image_url || null,
      stock: parseInt(form.stock) || 0,
      is_active: form.is_active,
    };
    try {
      if (editingItem) {
        await api.adminUpdateShopItem(secret, editingItem.id, payload);
      } else {
        await api.adminCreateShopItem(secret, payload);
      }
      setShowAddForm(false);
      loadShop();
    } catch { /* ignore */ }
    finally { setFormSaving(false); }
  };

  const handleDeactivate = async (itemId: string) => {
    await api.adminDeleteShopItem(secret, itemId).catch(onUnauth);
    loadShop();
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview',  label: 'Overview',  icon: 'dashboard' },
    { key: 'users',     label: 'Users',     icon: 'people' },
    { key: 'shopping',  label: 'Shopping',  icon: 'storefront' },
  ];

  const statCards = stats ? [
    { label: 'Users',          value: stats.total_users,                    icon: 'people' },
    { label: 'Events',         value: stats.total_events,                   icon: 'event' },
    { label: 'Orders',         value: stats.total_orders,                   icon: 'shopping_bag' },
    { label: 'Revenue',        value: `$${stats.total_revenue.toFixed(2)}`, icon: 'payments' },
    { label: 'Pending Orders', value: stats.pending_orders,                 icon: 'pending' },
    { label: 'Notifs Sent',    value: stats.notifications_sent,             icon: 'send' },
    { label: 'Notifs Failed',  value: stats.notifications_failed,           icon: 'error_outline' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#1a2418] flex">

      {/* ── Main panel ── */}
      <div className={`flex-1 px-6 py-12 transition-all ${selectedUser ? 'max-w-3xl' : 'max-w-5xl mx-auto w-full'}`}>

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-display text-[10px] tracking-[0.35em] uppercase text-[#9cb092] mb-1">Platform</p>
            <h1 className="font-serif-exp text-3xl text-[#e4eee1] italic">Admin Panel</h1>
          </div>
          <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/30">Moments & Memories</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#9cb092]/20 mb-8">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedUser(null); }}
              className={`px-5 py-3 font-display text-[10px] tracking-[0.2em] uppercase transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                tab === t.key ? 'text-[#9cb092] border-[#9cb092]' : 'text-[#b2c3b1]/40 border-transparent hover:text-[#b2c3b1]/70'
              }`}>
              <span className="material-icons text-sm">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
          </div>
        )}

        {/* Overview */}
        {!loading && tab === 'overview' && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {statCards.map(({ label, value, icon }) => (
              <div key={label} className="bg-[#9cb092]/5 border border-[#9cb092]/20 p-5 flex flex-col gap-3">
                <span className="material-icons text-base text-[#9cb092]/40">{icon}</span>
                <div>
                  <p className="font-serif-exp text-2xl text-[#e4eee1] italic">{value}</p>
                  <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/40 mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {!loading && tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50">{users.length} users</p>
              <button onClick={loadUsers} className="font-display text-[9px] tracking-[0.15em] uppercase text-[#9cb092]/60 hover:text-[#9cb092] transition-colors flex items-center gap-1">
                <span className="material-icons text-xs">refresh</span> Refresh
              </button>
            </div>
            <div className="space-y-2">
              {users.length === 0 ? (
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/30 py-12 text-center">No users found</p>
              ) : users.map(u => (
                <div key={u.id}
                  onClick={() => openUserDetail(u.id)}
                  className={`flex items-center justify-between bg-[#9cb092]/5 border px-5 py-4 cursor-pointer transition-all ${
                    selectedUser?.user.id === u.id ? 'border-[#9cb092]/50 bg-[#9cb092]/10' : 'border-[#9cb092]/15 hover:border-[#9cb092]/30'
                  }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 border border-[#9cb092]/30 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons text-xs text-[#9cb092]/50">person</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-xs text-[#e4eee1] truncate">{u.email}</p>
                      <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/35 mt-0.5">
                        Joined {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="material-icons text-sm text-[#9cb092]/30">chevron_right</span>
                    {deleteConfirm === u.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDeleteUser(u.id)} className="font-display text-[9px] tracking-[0.15em] uppercase text-red-400 hover:text-red-300 transition-colors">Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/40">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); setDeleteConfirm(u.id); }}
                        className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/30 hover:text-red-400/70 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shopping */}
        {!loading && tab === 'shopping' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50">{shopItems.length} items</p>
              <div className="flex items-center gap-3">
                <button onClick={loadShop} className="font-display text-[9px] tracking-[0.15em] uppercase text-[#9cb092]/60 hover:text-[#9cb092] transition-colors flex items-center gap-1">
                  <span className="material-icons text-xs">refresh</span> Refresh
                </button>
                <button onClick={openAddForm}
                  className="font-display text-[9px] tracking-[0.2em] uppercase text-[#1a2418] bg-[#9cb092] hover:bg-[#9cb092]/80 transition-colors px-4 py-2 flex items-center gap-1">
                  <span className="material-icons text-xs">add</span> Add Item
                </button>
              </div>
            </div>

            {/* Add / Edit form */}
            {showAddForm && (
              <div className="bg-[#9cb092]/5 border border-[#9cb092]/30 p-5 mb-4">
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] mb-4">
                  {editingItem ? 'Edit Item' : 'New Item'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'name',        label: 'Name *',        type: 'text' },
                    { key: 'category',    label: 'Category *',    type: 'text' },
                    { key: 'price',       label: 'Price ($) *',   type: 'number' },
                    { key: 'stock',       label: 'Stock',         type: 'number' },
                    { key: 'image_url',   label: 'Image URL',     type: 'text' },
                    { key: 'description', label: 'Description',   type: 'text' },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/50 block mb-1">{label}</label>
                      <input
                        type={type}
                        value={(form as Record<string, unknown>)[key] as string}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full bg-transparent border border-[#9cb092]/30 px-3 py-2 font-display text-xs text-[#e4eee1] focus:outline-none focus:border-[#9cb092]/60"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input type="checkbox" id="is_active" checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="accent-[#9cb092]" />
                  <label htmlFor="is_active" className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">Active (visible in shop)</label>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSaveItem} disabled={formSaving || !form.name || !form.category || !form.price}
                    className="px-5 py-2 bg-[#9cb092] hover:bg-[#9cb092]/80 disabled:opacity-30 font-display text-[9px] tracking-[0.2em] uppercase text-[#1a2418] transition-colors">
                    {formSaving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Create Item')}
                  </button>
                  <button onClick={() => setShowAddForm(false)}
                    className="px-5 py-2 border border-[#9cb092]/30 hover:border-[#9cb092]/60 font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {shopItems.length === 0 ? (
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/30 py-12 text-center">No items yet — add one above</p>
              ) : shopItems.map(item => (
                <div key={item.id} className={`flex items-center gap-4 bg-[#9cb092]/5 border px-5 py-4 ${item.is_active ? 'border-[#9cb092]/15' : 'border-[#b2c3b1]/10 opacity-50'}`}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover flex-shrink-0 border border-[#9cb092]/20" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-xs text-[#e4eee1] truncate">{item.name}</p>
                      {!item.is_active && (
                        <span className="font-display text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 bg-red-400/10 text-red-400/60">inactive</span>
                      )}
                    </div>
                    <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/40 mt-0.5">
                      {item.category} · ${item.price.toFixed(2)} · {item.stock} in stock
                    </p>
                  </div>
                  <div className="flex gap-3 flex-shrink-0">
                    <button onClick={() => openEditForm(item)}
                      className="font-display text-[9px] tracking-[0.15em] uppercase text-[#9cb092]/50 hover:text-[#9cb092] transition-colors">
                      Edit
                    </button>
                    {item.is_active && (
                      <button onClick={() => handleDeactivate(item.id)}
                        className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/30 hover:text-red-400/70 transition-colors">
                        Deactivate
                      </button>
                    )}
                    {!item.is_active && (
                      <button onClick={() => api.adminUpdateShopItem(secret, item.id, { is_active: true }).then(loadShop)}
                        className="font-display text-[9px] tracking-[0.15em] uppercase text-[#9cb092]/40 hover:text-[#9cb092] transition-colors">
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── User detail side panel ── */}
      {(selectedUser || userLoading) && (
        <div className="w-96 border-l border-[#9cb092]/20 bg-[#1a2418] overflow-y-auto px-6 py-12 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-[#9cb092]">User Profile</p>
            <button onClick={() => setSelectedUser(null)} className="material-icons text-base text-[#b2c3b1]/40 hover:text-[#e4eee1] transition-colors">close</button>
          </div>

          {userLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
            </div>
          ) : selectedUser && (
            <>
              {/* User info */}
              <div className="bg-[#9cb092]/5 border border-[#9cb092]/20 p-4 mb-6">
                <div className="w-10 h-10 border border-[#9cb092]/30 flex items-center justify-center mb-3">
                  <span className="material-icons text-base text-[#9cb092]/50">person</span>
                </div>
                <p className="font-display text-xs text-[#e4eee1]">{selectedUser.user.email}</p>
                <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/40 mt-1">
                  Joined {new Date(selectedUser.user.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-4 mt-3 pt-3 border-t border-[#9cb092]/15">
                  <div className="text-center">
                    <p className="font-serif-exp text-lg text-[#e4eee1] italic">{selectedUser.events.length}</p>
                    <p className="font-display text-[8px] tracking-[0.15em] uppercase text-[#b2c3b1]/40">Events</p>
                  </div>
                  <div className="text-center">
                    <p className="font-serif-exp text-lg text-[#e4eee1] italic">{selectedUser.orders.length}</p>
                    <p className="font-display text-[8px] tracking-[0.15em] uppercase text-[#b2c3b1]/40">Orders</p>
                  </div>
                </div>
              </div>

              {/* Events */}
              {selectedUser.events.length > 0 && (
                <div className="mb-6">
                  <p className="font-display text-[9px] tracking-[0.25em] uppercase text-[#9cb092] mb-3">Events Created</p>
                  <div className="space-y-2">
                    {selectedUser.events.map(e => (
                      <div key={e.id} className="bg-[#9cb092]/5 border border-[#9cb092]/10 px-3 py-3">
                        <p className="font-display text-xs text-[#e4eee1] truncate">{e.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`font-display text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 ${
                            e.status === 'published' ? 'bg-[#9cb092]/15 text-[#9cb092]' :
                            e.status === 'archived' ? 'bg-red-400/10 text-red-400/60' : 'bg-[#b2c3b1]/10 text-[#b2c3b1]/40'
                          }`}>{e.status}</span>
                          <p className="font-display text-[8px] tracking-[0.1em] uppercase text-[#b2c3b1]/30">
                            {new Date(e.event_date).toLocaleDateString()}
                          </p>
                          {e.location && (
                            <p className="font-display text-[8px] tracking-[0.1em] uppercase text-[#b2c3b1]/30 truncate">{e.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders */}
              {selectedUser.orders.length > 0 && (
                <div className="mb-6">
                  <p className="font-display text-[9px] tracking-[0.25em] uppercase text-[#9cb092] mb-3">Orders</p>
                  <div className="space-y-2">
                    {selectedUser.orders.map(o => (
                      <div key={o.id} className="bg-[#9cb092]/5 border border-[#9cb092]/10 px-3 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-display text-xs text-[#e4eee1]">${o.total_amount.toFixed(2)}</p>
                          <p className="font-display text-[8px] tracking-[0.1em] uppercase text-[#b2c3b1]/30 mt-0.5">
                            {new Date(o.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-display text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 bg-[#b2c3b1]/10 text-[#b2c3b1]/50">
                          {o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.events.length === 0 && selectedUser.orders.length === 0 && (
                <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/30 text-center py-8">No activity yet</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  );
}
