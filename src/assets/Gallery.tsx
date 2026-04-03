import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { FaMapMarkerAlt, FaCamera, FaChevronDown, FaComment, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface Participant {
  id: string;
  photoUrl: string;
  location: string;
  choice?: string;
  timestamp: string;
  eventName: string;
}

interface LocationData {
  state: string;
  specificLocation: string;
  fullLocation: string;
}

const Gallery: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartY = useRef<number>(0);

  // Generate a unique ID for the current user session
  useEffect(() => {
    let userId = sessionStorage.getItem('currentUserId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('currentUserId', userId);
    }
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!eventId) {
        navigate('/');
        return;
      }

      try {
        // Fetch event name and locations
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          setEventName(data.eventName || "LINK UP Event");
          
          // Handle both old and new location formats
          if (data.locationDetails) {
            const locationNames = data.locationDetails.map((loc: LocationData) => loc.fullLocation);
            setLocations(locationNames);
          } else {
            setLocations(data.locations || []);
          }
        }

        // Fetch all participants for this event
        const participantsRef = collection(db, `events/${eventId}/participants`);
        const q = query(participantsRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        const participantsList: Participant[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          participantsList.push({
            id: doc.id,
            photoUrl: data.photoUrl,
            location: data.location,
            choice: data.choice || '',
            timestamp: data.timestamp,
            eventName: data.eventName
          });
        });

        setParticipants(participantsList);
        // Filter out the current user from the main list
        const filteredList = participantsList.filter(p => p.id !== currentUserId);
        setFilteredParticipants(filteredList);
      } catch (err) {
        console.error("Error fetching participants:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchParticipants();
    }
  }, [eventId, navigate, currentUserId]);

  // Filter participants when location changes (excluding current user)
  useEffect(() => {
    let baseList = participants.filter(p => p.id !== currentUserId);
    
    if (selectedLocation === "all") {
      setFilteredParticipants(baseList);
    } else {
      const filtered = baseList.filter(p => p.location === selectedLocation);
      setFilteredParticipants(filtered);
    }
    setCurrentIndex(0);
  }, [selectedLocation, participants, currentUserId]);

  const handleChat = (participant: Participant) => {
    if (participant.id === currentUserId) {
      alert("You cannot chat with yourself!");
      return;
    }
    navigate(`/chat/${eventId}/${participant.id}`, {
      state: {
        participantName: participant.location,
        participantPhoto: participant.photoUrl,
        eventName: eventName,
        participantLocation: participant.location
      }
    });
  };

  const goToNext = () => {
    if (currentIndex < filteredParticipants.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Handle touch/swipe events
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsScrolling(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isScrolling) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    if (diff > 50 && currentIndex < filteredParticipants.length - 1) {
      goToNext();
    }
    if (diff < -50 && currentIndex > 0) {
      goToPrevious();
    }
    setIsScrolling(false);
  };

  // Handle wheel scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0 && currentIndex < filteredParticipants.length - 1) {
        goToNext();
      } else if (e.deltaY < 0 && currentIndex > 0) {
        goToPrevious();
      }
    }
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
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
          <p style={{ color: '#1e4fa3' }}>Loading the LINKUP community...</p>
        </div>
      </div>
    );
  }

  if (filteredParticipants.length === 0) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fb',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          width: '100%',
          maxWidth: '480px',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <FaCamera size={60} color="#bdc3c7" />
            <h3 style={{ marginTop: '20px', color: '#333' }}>No participants found</h3>
            <p style={{ color: '#7f8c8d', marginTop: '10px' }}>
              {selectedLocation === 'all' 
                ? 'No one has linked up yet. Be the first!' 
                : `No participants found in ${selectedLocation}`}
            </p>
            <button
              onClick={() => navigate(`/lollipop/${eventId}`)}
              style={{
                marginTop: '20px',
                background: '#1e4fa3',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Join the LINKUP
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentParticipant = filteredParticipants[currentIndex];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Full Screen Background Image */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${currentParticipant.photoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 0.5s ease-in-out'
        }}
      >
        {/* Dark Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)'
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '20px',
          zIndex: 10
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            position: 'relative',
            textAlign: 'center'
          }}
        >
          <h1
            style={{
              color: 'white',
              fontSize: 'clamp(24px, 5vw, 32px)',
              fontWeight: '700',
              margin: 0,
              letterSpacing: '2px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            CANDY & CLASSY
          </h1>

          {/* Location Filter */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                color: 'white',
                fontWeight: '500',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '25px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <FaMapMarkerAlt style={{ color: 'white', fontSize: '14px' }} />
              <span style={{ color: 'white', fontWeight: '500' }}>
                {selectedLocation === 'all' ? 'All Locations' : selectedLocation}
              </span>
              <FaChevronDown
                style={{
                  fontSize: '10px',
                  color: 'white',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              />
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
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    minWidth: '220px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 999,
                    animation: 'dropdownFadeIn 0.2s ease-out'
                  }}
                >
                  <div
                    onClick={() => {
                      setSelectedLocation('all');
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '14px',
                      color: '#333',
                      background: selectedLocation === 'all' ? '#f0f8ff' : 'transparent'
                    }}
                  >
                    🌍 All Locations
                  </div>
                  {locations.map((location) => (
                    <div
                      key={location}
                      onClick={() => {
                        setSelectedLocation(location);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '14px',
                        color: '#333',
                        background: selectedLocation === location ? '#f0f8ff' : 'transparent'
                      }}
                    >
                      📍 {location}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '40px 20px 50px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 10
        }}
      >
        {/* Location */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}
        >
          <FaMapMarkerAlt style={{ color: '#fff', fontSize: '18px' }} />
          <span
            style={{
              fontSize: '20px',
              color: 'white',
              fontWeight: '500',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {currentParticipant.location}
          </span>
        </div>

        {/* LINKUP Button */}
        <button
          onClick={() => handleChat(currentParticipant)}
          style={{
            width: '90%',
            maxWidth: '320px',
            margin: '0 auto',
            display: 'block',
            background: '#1e4fa3',
            color: 'white',
            border: 'none',
            padding: '16px 24px',
            borderRadius: '50px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#163d7a';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1e4fa3';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FaComment style={{ marginRight: '10px', verticalAlign: 'middle' }} />
          LINKUPwithME
        </button>
      </div>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.3)',
            border: 'none',
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '22px',
            backdropFilter: 'blur(5px)',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
        >
          <FaChevronLeft />
        </button>
      )}

      {currentIndex < filteredParticipants.length - 1 && (
        <button
          onClick={goToNext}
          style={{
            position: 'absolute',
            right: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.3)',
            border: 'none',
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '22px',
            backdropFilter: 'blur(5px)',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
        >
          <FaChevronRight />
        </button>
      )}

      {/* Page Counter */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.6)',
          padding: '6px 14px',
          borderRadius: '20px',
          color: 'white',
          fontSize: '13px',
          fontWeight: '500',
          zIndex: 10,
          backdropFilter: 'blur(4px)'
        }}
      >
        {currentIndex + 1} / {filteredParticipants.length}
      </div>

      {/* Swipe Instruction - Only show on mobile */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '13px',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 10,
          whiteSpace: 'nowrap',
          display: 'block'
        }}
      >
        ↑ Swipe up/down to browse ↓
      </div>

      <style>{`
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

export default Gallery;