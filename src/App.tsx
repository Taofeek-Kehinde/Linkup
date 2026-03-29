import React from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import DateQr from "./assets/DateQr.tsx";
import Picture from "./assets/Picture.tsx";
import Lollipop from "./assets/Lolipop.tsx";
import Gallery from "./assets/Gallery.tsx";
import Chat from "./assets/Chat.tsx";
import { AdminLock, LinkupGenerator } from "./admin-lock/admin";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* DateQr page - displays QR code for scanning */}
        <Route path="/" element={<DateQr />} />
        
        {/* Picture page - take photo with front camera */}
        <Route path="/picture/:eventId" element={<Picture />} />
        
        {/* Lollipop page - choose chocolate/lollipop and location */}
        <Route path="/lollipop/:eventId" element={<Lollipop />} />
        
        {/* Gallery page - view all participants and chat */}
        <Route path="/gallery/:eventId" element={<Gallery />} />
        
        {/* Chat page - 1-on-1 messaging with timer */}
        <Route path="/chat/:eventId/:participantId" element={<Chat />} />
        
        {/* Admin page with encryption lock */}
        <Route 
          path="/admin" 
          element={
            <AdminLock>
              <LinkupGenerator />
            </AdminLock>
          } 
        />
        
        {/* Dynamic route for event details when QR code is scanned */}
        <Route path="/event-details/:eventId" element={<EventDetails />} />
        
        {/* Redirect any unknown routes to DateQr */}
        <Route path="*" element={<DateQr />} />
      </Routes>
    </BrowserRouter>
  );
};

// EventDetails component for displaying event information when QR is scanned
const EventDetails: React.FC = () => {
  const [eventData, setEventData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const { eventId } = useParams<{ eventId: string }>();

  React.useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setError("No event ID found");
        setLoading(false);
        return;
      }

      try {
        // Dynamically import firebase to avoid issues if not needed
        const { db } = await import("./firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        
        const eventDoc = await getDoc(doc(db, "events", eventId));
        
        if (eventDoc.exists()) {
          setEventData(eventDoc.data());
        } else {
          setError("Event not found");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fb',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e8eef5',
            borderTopColor: '#1e4fa3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#1e4fa3' }}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fb',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '400px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>Event Not Found</h2>
          <p style={{ color: '#7f8c8d' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f5f7fb',
      padding: 'clamp(40px, 8vh, 100px) 20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        width: '100%',
        maxWidth: '480px',
        animation: 'fadeIn 1s ease-in-out'
      }}>
        <h1 style={{
          color: '#1e4fa3',
          letterSpacing: '6px',
          fontWeight: '700',
          fontSize: 'clamp(28px, 5vw, 42px)',
          marginBottom: '5px'
        }}>
          LINK UP
        </h1>

        <p style={{
          color: '#1e4fa3',
          fontStyle: 'italic',
          fontSize: 'clamp(16px, 3vw, 22px)',
          marginBottom: '40px'
        }}>
          in the moment
        </p>

        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#e8eef5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <span style={{ fontSize: '40px' }}>🎉</span>
          </div>
          
          <h2 style={{
            color: '#1e4fa3',
            fontSize: 'clamp(20px, 4vw, 28px)',
            marginBottom: '15px'
          }}>
            {eventData?.eventName || "LINK UP Event"}
          </h2>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            {eventData?.locations?.map((loc: string, idx: number) => (
              <span key={idx} style={{
                background: '#e8eef5',
                padding: '6px 14px',
                borderRadius: '50px',
                fontSize: '13px',
                color: '#1e4fa3'
              }}>
                📍 {loc}
              </span>
            ))}
          </div>
          
          <p style={{
            color: '#7f8c8d',
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            Scan the QR code to join this amazing event happening across multiple locations in Nigeria!
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;