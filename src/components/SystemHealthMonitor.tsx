import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Users, AlertTriangle, CheckCircle, Clock, TrendingUp, BarChart2, CreditCard, Calendar, Star, ShieldAlert } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Appointment, User, Vendor } from '../types/database';

interface SystemMetrics {
  activeUsers: number;
  newUsersToday: number;
  totalUsers: number;
  totalAppointments: number;
  appointmentsToday: number;
  pendingAppointments: number;
  completionRate: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  totalRevenue: number;
  revenueToday: number;
  averageRating: number;
  securityIncidents: number;
  lastIncident?: Date;
}

const SystemHealthMonitor = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    newUsersToday: 0,
    totalUsers: 0,
    totalAppointments: 0,
    appointmentsToday: 0,
    pendingAppointments: 0,
    completionRate: 0,
    averageResponseTime: 0,
    errorRate: 0,
    uptime: 100,
    totalRevenue: 0,
    revenueToday: 0,
    averageRating: 0,
    securityIncidents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const calculateMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date ranges
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        // Get user metrics
        const usersQuery = query(
          collection(db, 'users'),
          where('lastLogin', '>=', Timestamp.fromDate(yesterday))
        );
        const usersSnapshot = await getDocs(usersQuery);
        const activeUsers = usersSnapshot.size;
        
        // Get new users today
        const newUsersQuery = query(
          collection(db, 'users'),
          where('createdAt', '>=', Timestamp.fromDate(startOfToday))
        );
        const newUsersSnapshot = await getDocs(newUsersQuery);
        const newUsersToday = newUsersSnapshot.size;
        
        // Get total users
        const totalUsersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = totalUsersSnapshot.size;

        // Get appointment metrics
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          orderBy('date', 'desc'),
          limit(100)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointments = appointmentsSnapshot.docs.map(doc => ({
          ...doc.data()
        })) as Appointment[];

        // Get today's appointments
        const todayAppointments = appointments.filter(a => {
          const appointmentDate = new Date(a.date.seconds * 1000);
          return appointmentDate >= startOfToday;
        });
        
        // Calculate revenue
        const totalRevenue = appointments.reduce((sum, a) => sum + a.totalPrice, 0);
        const revenueToday = todayAppointments.reduce((sum, a) => sum + a.totalPrice, 0);
        
        // Get pending appointments
        const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
        
        // Calculate average rating
        const ratedAppointments = appointments.filter(a => a.feedback?.rating);
        const averageRating = ratedAppointments.length > 0
          ? ratedAppointments.reduce((sum, a) => sum + (a.feedback?.rating || 0), 0) / ratedAppointments.length
          : 0;

        // Calculate completion rate
        const completedAppointments = appointments.filter(a => a.status === 'completed');
        const completionRate = (completedAppointments.length / appointments.length) * 100;

        // Calculate average response time (time between creation and status update)
        const responseTimes = appointments.map(a => {
          const created = new Date(a.createdAt.seconds * 1000);
          const updated = new Date(a.updatedAt.seconds * 1000);
          return updated.getTime() - created.getTime();
        });
        const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

        // Calculate error rate (cancelled appointments)
        const cancelledAppointments = appointments.filter(a => 
          a.status === 'cancelled' || a.status === 'no_show'
        );
        const errorRate = (cancelledAppointments.length / appointments.length) * 100;

        setMetrics({
          activeUsers,
          newUsersToday,
          totalUsers,
          totalAppointments: appointments.length,
          appointmentsToday: todayAppointments.length,
          pendingAppointments,
          completionRate,
          averageResponseTime: averageResponseTime / 1000, // Convert to seconds
          errorRate,
          uptime: 99.99, // Hardcoded for demo
          totalRevenue,
          revenueToday,
          averageRating,
          securityIncidents: 0 // Hardcoded for demo
        });

        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error calculating metrics:', err);
        setError('Virhe mittareiden laskennassa');
      } finally {
        setLoading(false);
      }
    };

    calculateMetrics();
    const interval = setInterval(calculateMetrics, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
        <div className="flex">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Virhe järjestelmän tilan seurannassa</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-green-500 mr-2" />
              <h2 className="text-xl font-bold">Järjestelmän tila</h2>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              Päivitetty: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* User Activity */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="ml-2 text-sm font-medium text-purple-900">Käyttäjät</span>
                </div>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700">Aktiiviset</span>
                  <span className="font-medium text-purple-900">{metrics.activeUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700">Uudet tänään</span>
                  <span className="font-medium text-purple-900">{metrics.newUsersToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700">Yhteensä</span>
                  <span className="font-medium text-purple-900">{metrics.totalUsers}</span>
                </div>
              </div>
            </div>

            {/* Appointments */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="ml-2 text-sm font-medium text-blue-900">Varaukset</span>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">Tänään</span>
                  <span className="font-medium text-blue-900">{metrics.appointmentsToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">Odottavat</span>
                  <span className="font-medium text-blue-900">{metrics.pendingAppointments}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">Yhteensä</span>
                  <span className="font-medium text-blue-900">{metrics.totalAppointments}</span>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <span className="ml-2 text-sm font-medium text-green-900">Tulot</span>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700">Tänään</span>
                  <span className="font-medium text-green-900">{metrics.revenueToday.toFixed(2)}€</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700">Yhteensä</span>
                  <span className="font-medium text-green-900">{metrics.totalRevenue.toFixed(2)}€</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700">Keskiarvo</span>
                  <span className="font-medium text-green-900">
                    {(metrics.totalRevenue / metrics.totalAppointments || 0).toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShieldAlert className="h-5 w-5 text-yellow-600" />
                  <span className="ml-2 text-sm font-medium text-yellow-900">Turvallisuus</span>
                </div>
                <CheckCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-700">Häiriöt</span>
                  <span className="font-medium text-yellow-900">{metrics.securityIncidents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-700">Käytettävyys</span>
                  <span className="font-medium text-yellow-900">{metrics.uptime}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-700">Tyytyväisyys</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="ml-1 font-medium text-yellow-900">
                      {metrics.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="border-t border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Suorituskyky</h3>
            <div className="space-y-4">
              {/* Server Status */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Server className="h-5 w-5 text-green-600" />
                    <span className="ml-2 text-sm font-medium text-green-900">Palvelin</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metrics.uptime}% käytettävyys</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.uptime}%` }}
                  ></div>
                </div>
              </div>

              {/* Database Status */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span className="ml-2 text-sm font-medium text-blue-900">Tietokanta</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {metrics.averageResponseTime.toFixed(2)}s vasteaika
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((metrics.averageResponseTime / 5) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Completion Rate */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="ml-2 text-sm font-medium text-green-900">Varausten onnistuminen</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metrics.completionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.completionRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Error Rate */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className={`h-5 w-5 ${
                      metrics.errorRate > 10 ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                    <span className="ml-2 text-sm font-medium text-gray-900">Virhemäärä</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metrics.errorRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      metrics.errorRate > 10 ? 'bg-red-600' : 'bg-yellow-600'
                    }`}
                    style={{ width: `${metrics.errorRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;
