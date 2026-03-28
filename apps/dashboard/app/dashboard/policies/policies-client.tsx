'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Policy } from './page';

interface Community { id: string; name: string }

interface Props {
  communities: Community[];
  policiesByCommunity: Record<string, Policy>;
  defaultCommunityId: string;
}

export default function PoliciesClient({ communities, policiesByCommunity, defaultCommunityId }: Props) {
  const [selectedId, setSelectedId] = useState(defaultCommunityId);
  const [localData, setLocalData] = useState<Record<string, Policy>>(policiesByCommunity);
  const [saving, setSaving] = useState(false);

  const policy = localData[selectedId] ?? null;

  function setField(key: keyof Policy, value: boolean | number) {
    setLocalData(prev => {
      const current = prev[selectedId];
      if (!current) return prev;
      return { ...prev, [selectedId]: { ...current, [key]: value } };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!policy) return;
    setSaving(true);
    try {
      // Send only the known policy fields — extra fields (id, community_id, timestamps)
      // are rejected by the API's validation pipe with forbidNonWhitelisted: true
      const payload: Policy = {
        family_can_generate_guest_passes: policy.family_can_generate_guest_passes,
        tenant_can_generate_guest_passes: policy.tenant_can_generate_guest_passes,
        staff_can_generate_guest_passes: policy.staff_can_generate_guest_passes,
        max_active_guest_passes_per_host: policy.max_active_guest_passes_per_host,
        max_guest_passes_per_day: policy.max_guest_passes_per_day,
        guest_pass_guest_duration_hours: policy.guest_pass_guest_duration_hours,
        guest_pass_delivery_duration_hours: policy.guest_pass_delivery_duration_hours,
        guest_pass_service_duration_hours: policy.guest_pass_service_duration_hours,
        guest_pass_guest_usage_limit: policy.guest_pass_guest_usage_limit,
        guest_pass_delivery_usage_limit: policy.guest_pass_delivery_usage_limit,
        guest_pass_service_usage_limit: policy.guest_pass_service_usage_limit,
      };
      await api.patch(`/admin/communities/${selectedId}/policy`, payload);
      toast.success('Policy saved');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Community Policy</h2>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {policy ? (
        <form onSubmit={save} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader><CardTitle>Guest Pass Permissions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Toggle label="Family members can create guest passes" value={policy.family_can_generate_guest_passes} onChange={v => setField('family_can_generate_guest_passes', v)} />
              <Toggle label="Tenants can create guest passes" value={policy.tenant_can_generate_guest_passes} onChange={v => setField('tenant_can_generate_guest_passes', v)} />
              <Toggle label="Staff can create guest passes" value={policy.staff_can_generate_guest_passes} onChange={v => setField('staff_can_generate_guest_passes', v)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Limits</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <NumberField label="Max active passes per host" value={policy.max_active_guest_passes_per_host} onChange={v => setField('max_active_guest_passes_per_host', v)} />
              <NumberField label="Max passes per day" value={policy.max_guest_passes_per_day} onChange={v => setField('max_guest_passes_per_day', v)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pass Duration (hours)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <NumberField label="Guest" value={policy.guest_pass_guest_duration_hours} onChange={v => setField('guest_pass_guest_duration_hours', v)} />
              <NumberField label="Delivery" value={policy.guest_pass_delivery_duration_hours} onChange={v => setField('guest_pass_delivery_duration_hours', v)} />
              <NumberField label="Service Provider" value={policy.guest_pass_service_duration_hours} onChange={v => setField('guest_pass_service_duration_hours', v)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pass Usage Limit</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <NumberField label="Guest" value={policy.guest_pass_guest_usage_limit} onChange={v => setField('guest_pass_guest_usage_limit', v)} />
              <NumberField label="Delivery" value={policy.guest_pass_delivery_usage_limit} onChange={v => setField('guest_pass_delivery_usage_limit', v)} />
              <NumberField label="Service Provider" value={policy.guest_pass_service_usage_limit} onChange={v => setField('guest_pass_service_usage_limit', v)} />
            </CardContent>
          </Card>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Policy'}</Button>
        </form>
      ) : (
        <p className="text-gray-400 text-sm">No policy configured for this community.</p>
      )}
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
