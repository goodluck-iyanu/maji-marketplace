'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function DashboardCharts({ data }: { data: any[] }) {
  return (
    <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-6">Financial Overview (30 Days)</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
              tickFormatter={(val) => {
                const date = new Date(val);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any, name: string) => [`₦${Number(value || 0).toLocaleString()}`, name === 'gmv' ? 'Total GMV' : 'Platform Revenue']}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar name="Platform Revenue" dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar name="Total GMV" dataKey="gmv" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
