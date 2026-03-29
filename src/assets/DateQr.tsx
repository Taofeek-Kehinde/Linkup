import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaShareAlt, FaDownload } from 'react-icons/fa';
// import { IoMusicalNotes } from 'react-icons/io5';

// Extend Window interface to include QRCode
declare global {
  interface Window {
    QRCode: any;
  }
}

const DateQr: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [eventName, setEventName] = useState<string>("");
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Build the redirect URL - this will point to a page where users can see event details
  const getRedirectUrl = () => {
    // In production, replace with your actual domain
    const baseUrl = window.location.origin;
    return `${baseUrl}/event-details/${eventId}`;
  };

  useEffect(() => {
    // Fetch event data from Firebase
    const fetchEventData = async () => {
      if (!eventId) {
        setError("No event ID found");
        setLoading(false);
        return;
      }

      try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          setEventName(data.eventName || "LINK UP Event");
          setLocations(data.locations || []);
        } else {
          // Try to get from sessionStorage as fallback
          const savedName = sessionStorage.getItem('currentEventName');
          const savedLocations = sessionStorage.getItem('currentEventLocations');
          
          if (savedName) setEventName(savedName);
          if (savedLocations) setLocations(JSON.parse(savedLocations));
          else setError("Event not found");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
        // Fallback to sessionStorage
        const savedName = sessionStorage.getItem('currentEventName');
        const savedLocations = sessionStorage.getItem('currentEventLocations');
        
        if (savedName) setEventName(savedName);
        if (savedLocations) setLocations(JSON.parse(savedLocations));
        else setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    if (loading) return;

    // Dynamically load the QRCode library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.async = true;
    script.onload = () => {
      if (window.QRCode && qrCodeRef.current) {
        // Clear any existing QR code
        qrCodeRef.current.innerHTML = '';
        // Generate new QR code with event details URL
        new window.QRCode(qrCodeRef.current, {
          text: getRedirectUrl(),
          width: 180,
          height: 180,
          colorDark: "#1e4fa3",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (qrCodeRef.current) {
        qrCodeRef.current.innerHTML = '';
      }
    };
  }, [loading, eventId]);

  const handleShare = () => {
    const shareUrl = getRedirectUrl();
    if (navigator.share) {
      navigator.share({
        title: eventName,
        text: `Join us at ${eventName}!`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleDownloadQR = () => {
    const qrImage = qrCodeRef.current?.querySelector('img');
    if (qrImage) {
      const link = document.createElement('a');
      link.download = `${eventName.replace(/\s/g, '-')}-qr.png`;
      link.href = qrImage.src;
      link.click();
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fb',
        padding: 'clamp(40px, 8vh, 100px) 20px',
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

  return (
    <div style={{
      minHeight: 'auto',
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
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin-lock')}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FaArrowLeft style={{ color: '#1e4fa3' }} />
        </button>

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
          marginBottom: '20px'
        }}>
          in the moment
        </p>

        {/* Event Details */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '15px 20px',
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <FaCalendarAlt style={{ color: '#1e4fa3' }} />
            <span style={{ fontWeight: '600', color: '#333' }}>{eventName || "LINK UP Event"}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
            <FaMapMarkerAlt style={{ color: '#1e4fa3', marginTop: '2px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {locations.length > 0 ? (
                locations.map((loc, idx) => (
                  <span key={idx} style={{
                    background: '#e8eef5',
                    padding: '4px 12px',
                    borderRadius: '50px',
                    fontSize: '12px',
                    color: '#1e4fa3'
                  }}>
                    {loc}
                  </span>
                ))
              ) : (
                <span style={{ color: '#7f8c8d' }}>Multiple locations across Nigeria</span>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Container */}
        <div style={{
          background: 'white',
          width: 'clamp(220px, 65vw, 300px)',
          height: 'clamp(220px, 65vw, 300px)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '15px',
          margin: '0 auto 20px auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          animation: 'pulse 2s infinite ease-in-out'
        }}>
          <div
            ref={qrCodeRef}
            style={{
              width: '70%',
              height: '70%',
              maxWidth: '180px',
              maxHeight: '180px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          />
        </div>

        <p style={{
          color: '#1e4fa3',
          marginBottom: '25px',
          fontSize: 'clamp(14px, 3vw, 18px)'
        }}>
          (Scan to linkup)
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={handleShare}
            style={{
              background: '#1e4fa3',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#163d7a'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1e4fa3'}
          >
            <FaShareAlt /> Share Event
          </button>
          <button
            onClick={handleDownloadQR}
            style={{
              background: 'white',
              color: '#1e4fa3',
              border: '2px solid #1e4fa3',
              padding: '12px 24px',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e8eef5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <FaDownload /> Save QR
          </button>
        </div>

        {error && (
          <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '20px' }}>
            {error}
          </p>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
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

export default DateQr;