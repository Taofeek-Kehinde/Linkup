import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, getDocs, orderBy } from 'firebase/firestore';
import { FaChevronDown, FaHeart, FaArrowRight } from 'react-icons/fa';

const Lollipop: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
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
          setLocations(data.locations || []);
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

  const handleSubmit = async () => {
    if (!selectedLocation) {
      alert("Please select your location!");
      return;
    }
    if (!selectedChoice) {
      alert("Please choose between Chocolate or Lollipop!");
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

      // Save participant choice to Firestore
      const participantData = {
        eventId: eventId,
        eventName: eventName,
        location: selectedLocation,
        choice: selectedChoice,
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
        background: '#f5f7fb',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f5f7fb',
            borderTopColor: '#1e4fa3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#1e4fa3' }}>Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f7fb',
      padding: 'clamp(20px, 5vh, 40px) 20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        animation: 'fadeIn 0.6s ease-out'
      }}>

   {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            color: 'black',
            fontSize: 'clamp(32px, 6vw, 48px)',
            fontWeight: '700',
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}>
            🍭 LINK UP
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 'clamp(14px, 3vw, 18px)',
            fontStyle: 'italic'
          }}>
            {eventName}
          </p>
        </div>

        {/* Single Column Layout - Choice Selection Only */}
        <div style={{
         
          animation: 'slideUp 0.5s ease-out'
        }}>


          {/* Choice Options - No Icons, No Text */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 1fr',
            gap: '20px',
            justifyItems: 'center',
            marginBottom: '35px'
          }}>


            {/* Chocolate Option - Deep Brown Background */}
            <div
  onClick={() => setSelectedChoice('chocolate')}
  style={{
    background: '#3E2723', // always brown

    borderRadius: '50%',
    width: 'clamp(140px, 28vw, 180px)',
    height: 'clamp(140px, 28vw, 180px)',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    cursor: 'pointer',
    transition: 'all 0.3s ease',

    border: selectedChoice === 'chocolate'
      ? '4px solid #795548'
      : '2px solid transparent',

    transform: selectedChoice === 'chocolate'
      ? 'scale(1.08)'
      : 'scale(1)',

    boxShadow: selectedChoice === 'chocolate'
      ? '0 10px 25px rgba(62,39,35,0.4)'
      : '0 6px 15px rgba(0,0,0,0.08)'
  }}
>
  <div style={{ fontSize: 'clamp(50px, 10vw, 80px)' }}>
    🍫
  </div>
  </div>

          {/* OR Separator - Gradient Circle */}
          <div
            style={{
              position: 'relative',
              top: '15px',
              background: 'linear-gradient(to right, #3E2723 50%, #FFD700 50%)',
              borderRadius: '50%',
              width: 'clamp(60px, 12vw, 90px)',
              height: 'clamp(60px, 12vw, 90px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(14px, 3vw, 22px)',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              zIndex: 1
            }}
          >
            OR
          </div>

            {/* Lollipop Option - Yellow Background */}
           <div
  onClick={() => setSelectedChoice('lollipop')}
  style={{
    background: '#FFD700', // always yellow

    borderRadius: '50%',
    width: 'clamp(140px, 28vw, 180px)',
    height: 'clamp(140px, 28vw, 180px)',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    cursor: 'pointer',
    transition: 'all 0.3s ease',

    border: selectedChoice === 'lollipop'
      ? '4px solid #FF8F00'
      : '2px solid transparent',

    transform: selectedChoice === 'lollipop'
      ? 'scale(1.08)'
      : 'scale(1)',

    boxShadow: selectedChoice === 'lollipop'
      ? '0 10px 25px rgba(255,193,7,0.4)'
      : '0 6px 15px rgba(0,0,0,0.08)'
  }}
>
  <div style={{ fontSize: 'clamp(50px, 10vw, 80px)' }}>
    🍭
  </div>
</div>

          </div>

          {/* Location Dropdown */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              color: '#1e4fa3',
              fontWeight: '600',
              marginBottom: '10px',
              fontSize: '14px'
            }}>
              Where are you linking up from?
            </label>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '2px solid #e8eef5',
                  fontSize: '16px',
                  background: '#fafcfd',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ color: selectedLocation ? '#333' : '#7f8c8d' }}>
                  {selectedLocation || "Tap to select your location"}
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
                    borderRadius: '12px',
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

          {/* User Photo Preview */}
          {userPhoto && (
            <div style={{
              textAlign: 'center',
              marginBottom: '25px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '12px'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#7f8c8d',
                marginBottom: '10px'
              }}>
                Your captured moment
              </p>
              <img
                src={userPhoto}
                alt="Your photo"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #1e4fa3'
                }}
              />
            </div>
          )}

          {/* LINK UP Button - Brown Background */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              background: '#5D4037',
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
              opacity: submitting ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.background = '#3E2723';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#5D4037';
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
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Linking up...
              </>
            ) : (
              <>
                LINK UP
                <FaArrowRight />
              </>
            )}
          </button>

          {/* Motivational Message */}
          <div style={{
            textAlign: 'center',
            marginTop: '25px',
            padding: '12px',
            background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
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