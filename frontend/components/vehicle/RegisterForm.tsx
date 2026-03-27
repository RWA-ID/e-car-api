'use client'

import { useState } from 'react'
import { useRegisterVehicle } from '../../hooks/useVehicleIdentity'

export default function RegisterForm() {
  const [form, setForm] = useState({ vin: '', manufacturer: '', model: '', year: '', batteryKwh: '' })
  const { register, isPending, isConfirming, isSuccess, error } = useRegisterVehicle()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vin || !form.manufacturer || !form.model || !form.year) return
    register(form.vin, form.manufacturer, form.model, parseInt(form.year), BigInt(form.batteryKwh || '0'))
  }

  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-3">
      {[
        { key: 'vin', label: 'VIN', placeholder: '5YJSA1H21FFP12345' },
        { key: 'manufacturer', label: 'Manufacturer', placeholder: 'Tesla' },
        { key: 'model', label: 'Model', placeholder: 'Model 3' },
        { key: 'year', label: 'Year', placeholder: '2024' },
        { key: 'batteryKwh', label: 'Battery Capacity (Wh)', placeholder: '82000' },
      ].map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
          <input
            value={form[key as keyof typeof form]}
            onChange={set(key)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-lg text-sm font-mono"
            style={inputStyle}
          />
        </div>
      ))}
      <button type="submit" disabled={isPending || isConfirming} className="btn-primary text-sm mt-2 disabled:opacity-50">
        {isPending ? 'Confirm in wallet…' : isConfirming ? 'Registering…' : isSuccess ? '✓ Registered!' : 'Register Vehicle'}
      </button>
      {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error.message}</p>}
    </form>
  )
}
