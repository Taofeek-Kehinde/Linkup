import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { FaMapMarkerAlt, FaCamera, FaChevronDown, FaComment } from 'react-icons/fa';

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
  }, [selectedLocation, participants, currentUserId]);

  const handleChat = (participant: Participant) => {
    // Don't allow chatting with yourself (already filtered out, but double-check)
    if (participant.id === currentUserId) {
      alert("You cannot chat with yourself!");
      return;
    }
    navigate(`/chat/${eventId}/${participant.id}`, {
      state: {
        participantName: participant.location,
        participantPhoto: participant.photoUrl,
        eventName: eventName
      }
    });
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
            border: '3px solid white',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: 'white' }}>Loading the LINKUP community...</p>
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
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header - No Back Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: '30px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              color: 'white',
              fontSize: 'clamp(24px, 5vw, 36px)',
              fontWeight: '700',
              marginBottom: '5px'
            }}>
              CANDY & CLASSY
            </h1>
         
          </div>
          
          {/* Location Filter Dropdown - Top Right */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0
          }}>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '50px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <FaMapMarkerAlt style={{ color: '#1e4fa3' }} />
                <span style={{ color: selectedLocation === 'all' ? '#7f8c8d' : '#1e4fa3', fontWeight: selectedLocation !== 'all' ? '500' : 'normal' }}>
                  {selectedLocation === 'all' ? 'All Locations' : selectedLocation}
                </span>
                <FaChevronDown style={{
                  fontSize: '10px',
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
                    right: 0,
                    minWidth: '200px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    border: '1px solid #e8eef5',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 999,
                    animation: 'dropdownFadeIn 0.2s ease-out'
                  }}>
                    <div
                      onClick={() => {
                        setSelectedLocation("all");
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        padding: '12px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '14px',
                        color: '#333',
                        background: selectedLocation === "all" ? '#e8eef5' : 'transparent',
                        fontWeight: selectedLocation === "all" ? '600' : 'normal'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e8eef5'}
                      onMouseLeave={(e) => {
                        if (selectedLocation !== "all") e.currentTarget.style.background = 'transparent';
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
                          padding: '12px 18px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '14px',
                          color: '#333',
                          background: selectedLocation === location ? '#e8eef5' : 'transparent',
                          fontWeight: selectedLocation === location ? '600' : 'normal'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e8eef5'}
                        onMouseLeave={(e) => {
                          if (selectedLocation !== location) e.currentTarget.style.background = 'transparent';
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

        {/* Participants Grid */}
        {filteredParticipants.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '60px 20px',
            textAlign: 'center',
            animation: 'fadeIn 0.6s ease-out'
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            animation: 'fadeIn 0.6s ease-out'
          }}>
            {filteredParticipants.map((participant, index) => (
              <div
                key={participant.id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  animation: `slideUp 0.5s ease-out ${index * 0.05}s both`,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{
                  position: 'relative',
                  paddingBottom: '100%',
                  background: '#f8f9fa'
                }}>
                  {participant.photoUrl ? (
                    <img
                      src={participant.photoUrl}
                      alt={`Participant from ${participant.location}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      <FaCamera size={50} color="white" />
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '15px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '12px'
                  }}>
                    <FaMapMarkerAlt style={{ color: '#1e4fa3', fontSize: '12px' }} />
                    <span style={{
                      fontSize: '13px',
                      color: '#1e4fa3',
                      fontWeight: '500'
                    }}>
                      {participant.location}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleChat(participant)}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <FaComment />
                    LINKUP with ME
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default Gallery;