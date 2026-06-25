import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './index.css'

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('public:events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
        setEvents(current => [payload.new, ...current]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    }
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Connecting to Supabase...</div>;

  const totalEvents = events.length;
  
  // Calculate specific metrics from payloads
  const cartsAbandoned = events.filter(e => {
    const cart = e.payload?.signals?.cart_state;
    return cart && cart.item_count > 0;
  }).length;

  const promoConflicts = events.filter(e => {
    const banners = e.payload?.signals?.promo_banners || [];
    return banners.length > 1; // Simplistic rule: more than 1 promo banner = potential conflict
  }).length;

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-top">
          <h1>AIORA Retailer Dashboard</h1>
          <div className="live-badge">
            <span className="pulse-dot"></span> LIVE
          </div>
        </div>
        <p>Real-time coordination failure detection & intelligence</p>
      </header>

      <main>
        <section className="metrics-grid">
          <div className="metric-card card-total">
            <span className="metric-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              Total Signals Captured
            </span>
            <h2 className="metric-value highlight">{totalEvents}</h2>
          </div>
          
          <div className="metric-card card-cart">
            <span className="metric-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              Carts Abandoned
            </span>
            <h2 className="metric-value">{cartsAbandoned}</h2>
          </div>

          <div className="metric-card card-conflict">
            <span className="metric-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Potential Promo Conflicts
            </span>
            <h2 className="metric-value" style={{color: promoConflicts > 0 ? 'var(--red)' : ''}}>{promoConflicts}</h2>
          </div>
        </section>
        
        <section className="events-section">
          <div className="events-header">
            <h2>Recent Events Stream</h2>
          </div>
          <div className="events-list">
            {events.slice(0, 8).map(event => (
              <div key={event.id} className="event-item">
                <div className="event-time">
                  {new Date(event.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                </div>
                <div className="event-details">
                  <span className="event-type">{event.payload?.page?.page_type?.toUpperCase() || 'UNKNOWN'}</span>
                  <span className="event-url">{event.page_url}</span>
                </div>
                <div className="event-client">
                  {event.client_id}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
