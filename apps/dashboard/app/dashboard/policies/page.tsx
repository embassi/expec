'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Community { id: string; name: string }
interface Policy {
  family_can_generate_guest_passes: boolean;
  tenant_can_generate_guest_passes: boolean;
  staff_can_generate_guest_passes: boolean;
  max_active_guest_passes_per_host: number;
  max_guest_passes_per_day: number;
  guest_pass_guest_duration_hours: number;
  guest_pass_delivery_duration_hours: number;
  guest_pass_service_duration_hours: number;
  guest_pass_guest_usage_limit: number;
  guest_pass_delivery_usage_limit: number;
  guest_pass_service_usage_limit: number;
}

export default function PoliciesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selected, setSelected] = useState('');
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<Community[]>('/admin/communities').then(cs => {
      setCommunities(cs);
      if (cs.length > 0) setSelected(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get<Policy>(`/admin/communities/${selected}/policy`).then(setPolicy).finally(() => setLoading(false));
  }, [selected]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!policy) return;
    setSaving(true);
    try {
      const updated = await api.patch<Policy>(`/admin/communities/${selected}/policy`, policy);
      setPolicy(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function setField(key: keyof Policy, value: boolean | number) {
    setPolicy(p => p ? { ...p, [key]: value } : p);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Community Policy</h2>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading…</p> : policy && (
        <form onSubmit={save} className="space-y-6 max-w-2xl">
          <Section title="Guest Pass Permissions">
            <Toggle label="Family members can create guest passes" value={policy.family_can_generate_guest_passes} onChange={v => setField('family_can_generate_guest_passes', v)} />
            <Toggle label="Tenants can create guest passes" value={policy.tenant_can_generate_guest_passes} onChange={v => setField('tenant_can_generate_guest_passes', v)} />
            <Toggle label="Staff can create guest passes" value={policy.staff_can_generate_guest_passes} onChange={v => setField('staff_can_generate_guest_passes', v)} />
          </Section>

          <Section title="Limits">
            <NumberField label="Max active passes per host" value={policy.max_active_guest_passes_per_host} onChange={v => setField('max_active_guest_passes_per_host', v)} />
            <NumberField label="Max passes per day" value={policy.max_guest_passes_per_day} onChange={v => setField('max_guest_passes_per_day', v)} />
          </Section>

          <Section title="Pass Duration (hours)">
            <NumberField label="Guest" value={policy.guest_pass_guest_duration_hours} onChange={v => setField('guest_pass_guest_duration_hours', v)} />
            <NumberField label="Delivery" value={policy.guest_pass_delivery_duration_hours} onChange={v => setField('guest_pass_delivery_duration_hours', v)} />
            <NumberField label="Service Provider" value={policy.guest_pass_service_duration_hours} onChange={v => setField('guest_pass_service_duration_hours', v)} />
          </Section>

          <Section title="Pass Usage Limit">
            <NumberField label="Guest" value={policy.guest_pass_guest_usage_limit} onChange={v => setField('guest_pass_guest_usage_limit', v)} />
            <NumberField label="Delivery" value={policy.guest_pass_delivery_usage_limit} onChange={v => setField('guest_pass_delivery_usage_limit', v)} />
            <NumberField label="Service Provider" value={policy.guest_pass_service_usage_limit} onChange={v => setField('guest_pass_service_usage_limit', v)} />
          </Section>

          <button type="submit" disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2 rounded-lg text-sm disabled:opacity-50">
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Policy'}
          </button>
        </form>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700">{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${value ? 'bg-brand-600' : 'bg-gray-200'}`}>
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <input type="number" min={0} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500" />
    </div>
  );
}
