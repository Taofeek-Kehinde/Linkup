import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, getDocs, orderBy } from 'firebase/firestore';
import { FaChevronDown, FaHeart, FaArrowRight, FaCamera, FaUndo } from 'react-icons/fa';

const Lollipop: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [eventName, setEventName] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);

  // Fetch locations from admin form and user photo
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        navigate('/');
        return;
      }

      try {
        // Fetch event details
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          // Handle both old format (string array) and new format (location details)
          if (data.locationDetails) {
            setLocations(data.locationDetails.map((loc: any) => loc.fullLocation));
          } else {
            setLocations(data.locations || []);
          }
          setEventName(data.eventName || "LINK UP Event");
        }

        // Get the user's photo from the most recent submission for this event
        const photosRef = collection(db, `events/${eventId}/photos`);
        const q = query(photosRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const latestPhoto = querySnapshot.docs[0].data();
          setUserPhoto(latestPhoto.photoUrl);
        }
      } catch (err) {
        console.error("Error fetching event data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, navigate]);

  const handleRetakeSelfie = () => {
    navigate(`/picture/${eventId}`);
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      alert("Please select your location!");
      return;
    }

    setSubmitting(true);

    try {
      // Get the user's photo again to ensure we have the latest
      const photosRef = collection(db, `events/${eventId}/photos`);
      const q = query(photosRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);

      let photoUrl = "";
      if (!querySnapshot.empty) {
        photoUrl = querySnapshot.docs[0].data().photoUrl;
      }

      // Save participant data to Firestore
      const participantData = {
        eventId: eventId,
        eventName: eventName,
        location: selectedLocation,
        photoUrl: photoUrl,
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      };

      await addDoc(collection(db, "participants"), participantData);

      // Also save to event-specific subcollection
      await addDoc(collection(db, `events/${eventId}/participants`), participantData);

      // Redirect to gallery page showing all participants
      navigate(`/gallery/${eventId}`);

    } catch (err) {
      console.error("Error saving choice:", err);
      alert("Failed to save your choice. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid white',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: 'white' }}>Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f7fb',
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      justifyContent: 'center',
      padding: 'clamp(20px, 5vh, 40px) 20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        {/* Header */}
        {/* <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            color: 'white',
            fontSize: 'clamp(28px, 6vw, 36px)',
            fontWeight: '700',
            marginBottom: '8px',
            letterSpacing: '2px'
          }}>
            LINK UP
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 'clamp(14px, 3vw, 16px)',
            fontStyle: 'italic'
          }}>
            {eventName}
          </p>
        </div> */}

        {/* Main Card */}
        <div style={{
          background: 'white',
          borderRadius: '32px',
          padding: 'clamp(25px, 5vw, 35px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.5s ease-out'
        }}>
          
          {/* Selfie Section */}
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <h2 style={{
              color: '#333',
              fontSize: 'clamp(18px, 4vw, 22px)',
              fontWeight: '600',
              marginBottom: '15px'
            }}>
              Your Selfie Moment
            </h2>
            
            {/* Photo Circle */}
            <div
              style={{
                width: 'clamp(150px, 40vw, 200px)',
                height: 'clamp(150px, 40vw, 200px)',
                borderRadius: '50%',
                margin: '0 auto 15px',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
              onClick={handleRetakeSelfie}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt="Your selfie"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <FaCamera size={50} color="#999" />
              )}
            </div>
            
            {/* Retake Button */}
            <button
              onClick={handleRetakeSelfie}
              style={{
                background: 'none',
                border: 'none',
                color: '#1e4fa3',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '50px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e8eef5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <FaUndo size={12} />
              RETAKE SELFIE
            </button>
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, #e0e0e0, transparent)',
            margin: '20px 0'
          }} />

          {/* Location Section */}
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{
              color: '#333',
              fontSize: 'clamp(16px, 3.5vw, 18px)',
              fontWeight: '600',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              Where are you linking up?
            </h3>
            
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '50px',
                  border: '2px solid #e0e0e0',
                  fontSize: '16px',
                  background: '#fafcfd',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1e4fa3'}
                onMouseLeave={(e) => {
                  if (!isDropdownOpen) e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <span style={{ color: selectedLocation ? '#333' : '#999' }}>
                  {selectedLocation || "Tap to select your linkup spot"}
                </span>
                <FaChevronDown style={{
                  fontSize: '12px',
                  color: '#1e4fa3',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }} />
              </div>

              {isDropdownOpen && (
                <>
                  <div
                    onClick={() => setIsDropdownOpen(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998,
                      background: 'transparent'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    border: '1px solid #e8eef5',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    zIndex: 999,
                    animation: 'dropdownFadeIn 0.2s ease-out'
                  }}>
                    {locations.map((location) => (
                      <div
                        key={location}
                        onClick={() => {
                          setSelectedLocation(location);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          padding: '12px 18px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '14px',
                          color: '#333',
                          background: selectedLocation === location ? '#e8eef5' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e8eef5';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedLocation !== location) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        📍 {location}
                      </div>
                    ))}
                    {locations.length === 0 && (
                      <div style={{
                        padding: '12px 18px',
                        color: '#7f8c8d',
                        textAlign: 'center'
                      }}>
                        No locations available
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* LINK UP Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 20px',
              borderRadius: '50px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: submitting ? 0.7 : 1,
              marginTop: '20px'
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(102,126,234,0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {submitting ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '10%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Linking up...
              </>
            ) : (
              <>
                LINK UP with Others
                <FaArrowRight />
              </>
            )}
          </button>

          {/* Motivational Message */}
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            padding: '12px',
            background: '#fef9e6',
            borderRadius: '16px'
          }}>
            <FaHeart style={{ color: '#e74c3c', marginRight: '8px' }} />
            <span style={{ fontSize: '13px', color: '#2d3436', fontWeight: '500' }}>
              Join the moment and link up with others!
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Lollipop;