import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaShareAlt, FaDownload } from 'react-icons/fa';

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
  const [currentEventId, setCurrentEventId] = useState<string>("");

  // Get the correct URL for Vercel deployment
  const getRedirectUrl = () => {
    const baseUrl = window.location.origin;
    // Use the eventId from URL params or from state
    const id = eventId || currentEventId;
    if (!id) return baseUrl;
    return `${baseUrl}/picture/${id}`;
  };

  // Persistence: Check localStorage profile state on QR scan/root
  useEffect(() => {
  const checkProfileState = async () => {
    let targetEventId: string | undefined = eventId;
    
    // If no eventId in URL, try session/localStorage
    if (!targetEventId) {
      const sessionId = sessionStorage.getItem('currentEventId') || undefined;
      const localProfiles = Object.keys(localStorage).filter(key => key.startsWith('linkupProfile_'));
      const recentProfile = localProfiles[localProfiles.length - 1];
      targetEventId = sessionId || (recentProfile ? recentProfile.split('_')[1] as string : undefined);
    }
    
    if (targetEventId) {
      const profileKey = `linkupProfile_${targetEventId}`;
      const profile = localStorage.getItem(profileKey);
      if (profile) {
        const profileData = JSON.parse(profile);
        if (profileData.step === 'complete') {
          navigate(`/gallery/${targetEventId}`);
          return;
        } else if (profileData.step === 'location') {
          navigate(`/lollipop/${targetEventId}`);
          return;
        }
      }
    }
    
    // Fallback: sessionStorage picture redirect for fresh
    if (!eventId) {
      const sessionId = sessionStorage.getItem('currentEventId');
      if (sessionId) {
        navigate(`/picture/${sessionId}`);
      }
    }
  };

    
    checkProfileState();
  }, [eventId, navigate]);

  useEffect(() => {
    const fetchEventData = async () => {
      // First, try to get eventId from URL params
      let id: string | undefined = eventId;
      
      // If no eventId in URL, try to get from sessionStorage
      if (!id) {
        const storedId = sessionStorage.getItem('currentEventId');
        if (storedId) {
          id = storedId;
          setCurrentEventId(storedId);
        }
      } else {
        setCurrentEventId(id);
      }
      
      if (!id) {
        setError("Create LINKUP for your SHOW/EVENT/SPOT ");
        setLoading(false);
        return;
      }

      try {
        const eventDoc = await getDoc(doc(db, "events", id));
        
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          setEventName(data.eventName || "LINK UP Event");
          setLocations(data.locations || []);
        // Store eventId in both session & localStorage for persistence
        sessionStorage.setItem('currentEventId', id);
        localStorage.setItem('currentEventId', id);
        } else {
          const savedName = sessionStorage.getItem('currentEventName');
          const savedLocations = sessionStorage.getItem('currentEventLocations');
          
          if (savedName) setEventName(savedName);
          if (savedLocations) setLocations(JSON.parse(savedLocations));
          else setError("Event not found");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
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
    if (!currentEventId) return;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.async = true;
    script.onload = () => {
      if (window.QRCode && qrCodeRef.current) {
        qrCodeRef.current.innerHTML = '';
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
      if (qrCodeRef.current) {
        qrCodeRef.current.innerHTML = '';
      }
    };
  }, [loading, currentEventId]);

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
      <div className="landing-page" style={{minHeight: 'auto'}}>
        <div className="animated-bg" />
        <div style={{ textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
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

  if (error && !currentEventId) {
    return (
      <div className="landing-page">
        <div className="animated-bg" />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
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
              {/* in the moment */}
            </p>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
            }}>
              {/* <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>No Event Found</h2> */}
              <p style={{ color: '#7f8c8d' }}>{error}</p>
<>
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
    <button
      onClick={() => navigate('/admin')}
      style={{
        background: '#1e4fa3',
        color: 'white',
        border: 'none',
        padding: '20px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 10px #1e4fa3',
        transition: 'all 0.3s ease-in-out',
        animation: 'pulse 2s infinite'
      }}
    >
      Generate QR
    </button>
  </div>

  <style>
    {`
      @keyframes pulse {
        0% {
          box-shadow: 0 0 10px #1e4fa3;
          transform: scale(1);
        }
        50% {
          box-shadow: 0 0 25px #1e4fa3;
          transform: scale(1.1);
        }
        100% {
          box-shadow: 0 0 10px #1e4fa3;
          transform: scale(1);
        }
      }

      @media (max-width: 768px) {
        button {
          width: 90px !important;
          height: 90px !important;
          font-size: 14px !important;
        }
      }

      @media (max-width: 480px) {
        button {
          width: 70px !important;
          height: 70px !important;
          font-size: 12px !important;
        }
      }
    `}
  </style>
</>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="animated-bg" />
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          width: '100%',
          maxWidth: '480px',
          animation: 'fadeIn 1s ease-in-out'
        }}>
          <button
            onClick={() => navigate('/admin')}
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

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
        </div>
      </div>
    </div>
  );
};

export default DateQr;