import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { FaArrowLeft, FaMapMarkerAlt,  FaCamera, FaUsers, FaComments, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface Participant {
  id: string;
  photoUrl: string;
  location: string;
  choice: string;
  timestamp: string;
  eventName: string;
}

const Gallery: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<Participant | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!eventId) {
        navigate('/');
        return;
      }

      try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          setEventName(eventDoc.data().eventName || "LINK UP Event");
        }

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
            choice: data.choice,
            timestamp: data.timestamp,
            eventName: data.eventName
          });
        });

        setParticipants(participantsList);
      } catch (err) {
        console.error("Error fetching participants:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [eventId, navigate]);

  const openPhotoModal = (participant: Participant, index: number) => {
    setSelectedPhoto(participant);
    setCurrentIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedPhoto(null);
    document.body.style.overflow = 'auto';
  };

  const navigatePhoto = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentIndex < participants.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedPhoto(participants[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedPhoto(participants[currentIndex - 1]);
    }
  };

  const handleChat = (participant: Participant) => {
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
              🎉 LINKUP Gallery
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
            <div style={{ fontSize: '30px', marginBottom: '5px' }}>🍭</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#f5576c' }}>
              {participants.filter(p => p.choice === 'lollipop').length}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Lollipop Lovers</div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '15px',
            textAlign: 'center',
            animation: 'slideUp 0.5s ease-out 0.1s both'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '5px' }}>🍫</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#8B4513' }}>
              {participants.filter(p => p.choice === 'chocolate').length}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Chocolate Fans</div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '15px',
            textAlign: 'center',
            animation: 'slideUp 0.5s ease-out 0.2s both'
          }}>
            <div style={{ fontSize: '30px', marginBottom: '5px' }}>📍</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e4fa3' }}>
              {new Set(participants.map(p => p.location)).size}
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Locations</div>
          </div>
        </div>

        {/* Participants Grid */}
        {participants.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '60px 20px',
            textAlign: 'center',
            animation: 'fadeIn 0.6s ease-out'
          }}>
            <FaCamera size={60} color="#bdc3c7" />
            <h3 style={{ marginTop: '20px', color: '#333' }}>No participants yet</h3>
            <p style={{ color: '#7f8c8d', marginTop: '10px' }}>
              Be the first to LINK UP and share your moment!
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
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  animation: `slideUp 0.5s ease-out ${index * 0.05}s both`
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
                <div 
                  style={{
                    position: 'relative',
                    paddingBottom: '100%',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                  onClick={() => openPhotoModal(participant, index)}
                >
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
                  
                  {/* Choice Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: participant.choice === 'lollipop' 
                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      : 'linear-gradient(135deg, #a8c0ff 0%, #3f2b1d 100%)',
                    borderRadius: '50px',
                    padding: '5px 12px',
                    fontSize: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}>
                    {participant.choice === 'lollipop' ? '🍭' : '🍫'}
                  </div>
                </div>
                
                <div style={{ padding: '15px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px'
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
                      marginTop: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '50px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <FaComments /> Chat with me
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal with Zoom */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <button
            onClick={closeModal}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'white',
              border: 'none',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              zIndex: 1001
            }}
          >
            <FaTimes />
          </button>

          {currentIndex > 0 && (
            <button
              onClick={() => navigatePhoto('prev')}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(255,255,255,0.3)',
                border: 'none',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white',
                zIndex: 1001,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            >
              <FaChevronLeft />
            </button>
          )}

          {currentIndex < participants.length - 1 && (
            <button
              onClick={() => navigatePhoto('next')}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(255,255,255,0.3)',
                border: 'none',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white',
                zIndex: 1001,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            >
              <FaChevronRight />
            </button>
          )}

          <div style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            textAlign: 'center'
          }}>
            <img
              src={selectedPhoto.photoUrl}
              alt={`${selectedPhoto.location}`}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
              }}
            />
            <div style={{
              marginTop: '20px',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                <FaMapMarkerAlt />
                <span>{selectedPhoto.location}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <span style={{
                  background: selectedPhoto.choice === 'lollipop' ? '#f5576c' : '#8B4513',
                  padding: '4px 12px',
                  borderRadius: '50px',
                  fontSize: '12px'
                }}>
                  {selectedPhoto.choice === 'lollipop' ? '🍭 Lollipop Lover' : '🍫 Chocolate Fan'}
                </span>
              </div>
              <button
                onClick={() => handleChat(selectedPhoto)}
                style={{
                  marginTop: '20px',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FaComments /> Chat with me
              </button>
            </div>
          </div>
        </div>
      )}

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
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Gallery;