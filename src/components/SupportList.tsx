import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { MessageSquare, Clock, User, Store, ChevronDown, X, Send, Loader2 } from 'lucide-react';
import { getAllSupportTickets, addTicketResponse, closeSupportTicket } from '../lib/db';
import type { SupportTicket } from '../types/database';

const SupportList = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const ticketsData = await getAllSupportTickets();
        setTickets(ticketsData as SupportTicket[]);
      } catch (err) {
        console.error('Error loading tickets:', err);
        setError('Virhe tukipyyntöjen latauksessa');
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  const handleSendResponse = async () => {
    if (!selectedTicket || !response.trim()) return;

    try {
      setSendingResponse(true);
      await addTicketResponse(selectedTicket.id, {
        userId: 'admin',
        userRole: 'admin',
        message: response
      });

      // Refresh tickets
      const updatedTickets = await getAllSupportTickets();
      setTickets(updatedTickets as SupportTicket[]);
      setResponse('');
      
      // Update selected ticket
      const updatedTicket = updatedTickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket as SupportTicket);
      }
    } catch (err) {
      console.error('Error sending response:', err);
      setError('Virhe vastauksen lähetyksessä');
    } finally {
      setSendingResponse(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      await closeSupportTicket(selectedTicket.id);
      
      // Refresh tickets
      const updatedTickets = await getAllSupportTickets();
      setTickets(updatedTickets as SupportTicket[]);
      
      // Update selected ticket
      const updatedTicket = updatedTickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket as SupportTicket);
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
      setError('Virhe tukipyynnön sulkemisessa');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
        <div className="flex">
          <X className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200">
        {/* Tickets List */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tukipyynnöt</h3>
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-lg cursor-pointer transition-all
                  ${selectedTicket?.id === ticket.id
                    ? 'bg-blue-50 ring-2 ring-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {ticket.userRole === 'vendor' ? (
                      <Store className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-green-600" />
                    )}
                    <span className="ml-2 text-sm font-medium">
                      {ticket.userRole === 'vendor' ? 'Yritys' : 'Asiakas'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium
                    ${ticket.status === 'open'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ticket.status === 'open' ? 'Avoin' : 'Suljettu'}
                  </span>
                </div>
                <h4 className="font-medium mb-1">{ticket.subject}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{ticket.message}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(new Date(ticket.createdAt.seconds * 1000), "d.M.yyyy 'klo' HH:mm", { locale: fi })}
                </div>
              </div>
            ))}

            {tickets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3" />
                <p>Ei tukipyyntöjä</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Ticket */}
        <div className="p-6">
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
                  <button
                    onClick={handleCloseTicket}
                    disabled={selectedTicket.status === 'closed'}
                    className={`px-3 py-1 rounded-lg text-sm font-medium
                      ${selectedTicket.status === 'open'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {selectedTicket.status === 'open' ? 'Sulje tukipyyntö' : 'Suljettu'}
                  </button>
                </div>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {format(new Date(selectedTicket.createdAt.seconds * 1000), "d.M.yyyy 'klo' HH:mm", { locale: fi })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mb-4">
                {/* Original message */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-900">{selectedTicket.message}</p>
                </div>

                {/* Responses */}
                {selectedTicket.responses?.map((response, index) => (
                  <div
                    key={response.id}
                    className={`mb-4 flex ${response.userRole === 'admin' ? 'justify-end' : ''}`}
                  >
                    <div className={`rounded-lg p-4 max-w-[80%] ${
                      response.userRole === 'admin'
                        ? 'bg-blue-50 text-blue-900'
                        : 'bg-gray-50 text-gray-900'
                    }`}>
                      <div className="flex items-center mb-2">
                        {response.userRole === 'admin' ? (
                          <Store className="w-4 h-4 text-blue-600" />
                        ) : (
                          <User className="w-4 h-4 text-gray-600" />
                        )}
                        <span className="ml-2 text-xs font-medium">
                          {response.userRole === 'admin' ? 'Ylläpito' : 'Asiakas'}
                        </span>
                      </div>
                      <p className="text-sm">{response.message}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {format(new Date(response.createdAt.seconds * 1000), "d.M.yyyy 'klo' HH:mm", { locale: fi })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTicket.status === 'open' && (
                <div className="mt-auto">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Kirjoita vastaus..."
                      className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSendResponse}
                      disabled={!response.trim() || sendingResponse}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sendingResponse ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3" />
                <p>Valitse tukipyyntö</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportList;
