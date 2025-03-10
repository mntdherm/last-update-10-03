import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, DollarSign, Users, Store, Star, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Appointment, Transaction, Vendor } from '../types/database';

interface ReportData {
  appointments: Appointment[];
  transactions: Transaction[];
  vendors: Vendor[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminReports: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [reportData, setReportData] = useState<ReportData>({
    appointments: [],
    transactions: [],
    vendors: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range based on timeframe
        const now = new Date();
        let startDate = new Date();
        if (timeframe === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (timeframe === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        } else {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        // Fetch appointments
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(now))
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointments = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];

        // Fetch vendors
        const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
        const vendors = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vendor[];

        setReportData({
          appointments,
          transactions: [], // TODO: Implement transactions fetching
          vendors
        });

      } catch (err) {
        console.error('Error loading report data:', err);
        setError('Virhe raporttien latauksessa');
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [timeframe]);

  const calculateFinancialMetrics = () => {
    const totalRevenue = reportData.appointments.reduce((sum, appointment) => 
      sum + appointment.totalPrice, 0
    );

    const completedAppointments = reportData.appointments.filter(
      appointment => appointment.status === 'completed'
    );

    const averageTicket = completedAppointments.length > 0
      ? totalRevenue / completedAppointments.length
      : 0;

    return {
      totalRevenue,
      averageTicket,
      appointmentCount: completedAppointments.length
    };
  };

  const generateRevenueChart = () => {
    const revenueByDay = new Map();
    
    reportData.appointments.forEach(appointment => {
      const date = new Date(appointment.date.seconds * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      revenueByDay.set(
        dateKey,
        (revenueByDay.get(dateKey) || 0) + appointment.totalPrice
      );
    });

    return Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
      date,
      revenue
    }));
  };

  const generateServiceDistribution = () => {
    const serviceCount = new Map();
    
    reportData.appointments.forEach(appointment => {
      serviceCount.set(
        appointment.serviceId,
        (serviceCount.get(appointment.serviceId) || 0) + 1
      );
    });

    return Array.from(serviceCount.entries()).map(([serviceId, count]) => ({
      name: serviceId,
      value: count
    }));
  };

  const exportReport = () => {
    const metrics = calculateFinancialMetrics();
    const exportData = {
      timeframe,
      metrics,
      appointments: reportData.appointments,
      vendors: reportData.vendors
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${timeframe}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const metrics = calculateFinancialMetrics();

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'year')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="week">Viimeinen viikko</option>
            <option value="month">Viimeinen kuukausi</option>
            <option value="year">Viimeinen vuosi</option>
          </select>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Lataa raportti
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Liikevaihto</p>
              <p className="text-2xl font-bold">{metrics.totalRevenue.toFixed(2)}€</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span className="text-sm">+12.5% edellisestä {timeframe === 'week' ? 'viikosta' : timeframe === 'month' ? 'kuukaudesta' : 'vuodesta'}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Keskiostos</p>
              <p className="text-2xl font-bold">{metrics.averageTicket.toFixed(2)}€</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-red-600">
            <ArrowDownRight className="h-4 w-4 mr-1" />
            <span className="text-sm">-2.3% edellisestä {timeframe === 'week' ? 'viikosta' : timeframe === 'month' ? 'kuukaudesta' : 'vuodesta'}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Varaukset</p>
              <p className="text-2xl font-bold">{metrics.appointmentCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span className="text-sm">+8.1% edellisestä {timeframe === 'week' ? 'viikosta' : timeframe === 'month' ? 'kuukaudesta' : 'vuodesta'}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Liikevaihto</h3>
          <div className="h-80">
            <LineChart
              width={500}
              height={300}
              data={generateRevenueChart()}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
            </LineChart>
          </div>
        </div>

        {/* Service Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Palvelujakauma</h3>
          <div className="h-80">
            <PieChart width={400} height={300}>
              <Pie
                data={generateServiceDistribution()}
                cx={200}
                cy={150}
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {generateServiceDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>
      </div>

      {/* Vendor Performance */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold">Yritysten suorituskyky</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yritys
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Varaukset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liikevaihto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arvosana
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trendi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.vendors.map(vendor => {
                const vendorAppointments = reportData.appointments.filter(
                  a => a.vendorId === vendor.id
                );
                const revenue = vendorAppointments.reduce(
                  (sum, a) => sum + a.totalPrice, 0
                );

                return (
                  <tr key={vendor.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {vendor.logoImage ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={vendor.logoImage}
                              alt={vendor.businessName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Store className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.businessName}
                          </div>
                          <div className="text-sm text-gray-500">{vendor.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendorAppointments.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {revenue.toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-400" />
                        <span className="ml-1 text-sm text-gray-900">
                          {vendor.rating?.toFixed(1) || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-green-600">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        <span className="text-sm">+5.2%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
