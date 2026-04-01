import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { FaArrowLeft, FaMapMarkerAlt, FaHeart, FaCamera, FaUsers, FaChevronDown, FaComment } from 'react-icons/fa';

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
        setFilteredParticipants(participantsList);
      } catch (err) {
        console.error("Error fetching participants:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [eventId, navigate]);

  // Filter participants when location changes
  useEffect(() => {
    if (selectedLocation === "all") {
      setFilteredParticipants(participants);
    } else {
      const filtered = participants.filter(p => p.location === selectedLocation);
      setFilteredParticipants(filtered);
    }
  }, [selectedLocation, participants]);

  const handleChat = (participant: Participant) => {
    // Don't allow chatting with yourself
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
          <p style={{ color: 'white' }}>Loading the LINKUP community...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 'clamp(20px, 5vh, 40px) 20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <button
            onClick={() => navigate(`/lollipop/${eventId}`)}
            style={{
              background: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1e4fa3',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <FaArrowLeft /> Back
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              color: 'white',
              fontSize: 'clamp(24px, 5vw, 36px)',
              fontWeight: '700',
              marginBottom: '5px'
            }}>
              LINKUPbyLOCATION
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
              {eventName}
            </p>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '8px 16px',
            borderRadius: '50px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaUsers />
            <span style={{ fontWeight: '600' }}>{participants.length}</span>
            <span style={{ fontSize: '12px' }}>linked up</span>
          </div>
        </div>

        {/* Location Filter Dropdown */}
        <div style={{
          background: 'white',
          borderRadius: '50px',
          padding: '5px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            padding: '10px 15px',
            background: '#f5f7fb',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaMapMarkerAlt style={{ color: '#1e4fa3' }} />
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>Filter by:</span>
          </div>
          
          <div style={{ position: 'relative', flex: 1 }}>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '10px 15px',
                borderRadius: '50px',
                fontSize: '14px',
                background: '#fafcfd',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                border: '1px solid #e8eef5'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1e4fa3'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e8eef5'}
            >
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
                  left: 0,
                  right: 0,
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

        {/* Stats Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '15px',
            textAlign: 'center',
            animation: 'slideUp 0.5s ease-out'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '5px' }}>👥</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
              {filteredParticipants.length}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
              {selectedLocation === 'all' ? 'Total Participants' : `in ${selectedLocation}`}
            </div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '15px',
            textAlign: 'center',
            animation: 'slideUp 0.5s ease-out 0.1s both'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '5px' }}>📍</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e4fa3' }}>
              {new Set(participants.map(p => p.location)).size}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Total Locations</div>
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
            {filteredParticipants.map((participant, index) => {
              const isCurrentUser = participant.id === currentUserId;
              return (
                <div
                  key={participant.id}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    animation: `slideUp 0.5s ease-out ${index * 0.05}s both`,
                    opacity: isCurrentUser ? 0.8 : 1,
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
                  {/* "You" badge for current user */}
                  {isCurrentUser && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: '#667eea',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      fontSize: '11px',
                      fontWeight: '600',
                      zIndex: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      YOU
                    </div>
                  )}
                  
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
                      disabled={isCurrentUser}
                      style={{
                        width: '100%',
                        background: isCurrentUser ? '#e8eef5' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: isCurrentUser ? '#95a5a6' : 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '50px',
                        cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease',
                        opacity: isCurrentUser ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentUser) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <FaComment />
                      {isCurrentUser ? 'This is You' : 'LINKUPwithME'}
                    </button>
                  </div>
                </div>
              );
            })}
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