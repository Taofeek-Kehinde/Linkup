import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, getDocs, orderBy } from 'firebase/firestore';
import { FaChevronDown, FaHeart, FaCandyCane, FaArrowRight } from 'react-icons/fa';
import { GiChocolateBar } from 'react-icons/gi';

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
            border: '3px solid #e8eef5',
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 'clamp(20px, 5vh, 40px) 20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            color: 'white',
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

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Left Column - Choice Selection */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: 'clamp(25px, 4vw, 35px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            animation: 'slideUp 0.5s ease-out'
          }}>
            <h2 style={{
              color: '#1e4fa3',
              fontSize: 'clamp(20px, 4vw, 24px)',
              marginBottom: '30px',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              What's your vibe?
            </h2>

            {/* Choice Options */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '35px'
            }}>
              {/* Lollipop Option */}
              <div
                onClick={() => setSelectedChoice('lollipop')}
                style={{
                  background: selectedChoice === 'lollipop' 
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
                    : '#f8f9fa',
                  borderRadius: '20px',
                  padding: '25px 15px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: selectedChoice === 'lollipop' ? '3px solid #f5576c' : '2px solid #e8eef5',
                  transform: selectedChoice === 'lollipop' ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (selectedChoice !== 'lollipop') {
                    e.currentTarget.style.background = '#f0f0f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedChoice !== 'lollipop') {
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
              >
                <FaCandyCane style={{
                  fontSize: 'clamp(40px, 8vw, 60px)',
                  color: selectedChoice === 'lollipop' ? 'white' : '#f5576c',
                  marginBottom: '15px'
                }} />
                <h3 style={{
                  fontSize: 'clamp(16px, 3vw, 18px)',
                  fontWeight: '600',
                  color: selectedChoice === 'lollipop' ? 'white' : '#333',
                  marginBottom: '5px'
                }}>
                  🍭 Lollipop
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: selectedChoice === 'lollipop' ? 'rgba(255,255,255,0.9)' : '#7f8c8d'
                }}>
                  Sweet & Colorful
                </p>
              </div>

              {/* Chocolate Option */}
              <div
                onClick={() => setSelectedChoice('chocolate')}
                style={{
                  background: selectedChoice === 'chocolate' 
                    ? 'linear-gradient(135deg, #a8c0ff 0%, #3f2b1d 100%)' 
                    : '#f8f9fa',
                  borderRadius: '20px',
                  padding: '25px 15px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: selectedChoice === 'chocolate' ? '3px solid #8B4513' : '2px solid #e8eef5',
                  transform: selectedChoice === 'chocolate' ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (selectedChoice !== 'chocolate') {
                    e.currentTarget.style.background = '#f0f0f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedChoice !== 'chocolate') {
                    e.currentTarget.style.background = '#f8f9fa';
                  }
                }}
              >
                <GiChocolateBar style={{
                  fontSize: 'clamp(40px, 8vw, 60px)',
                  color: selectedChoice === 'chocolate' ? 'white' : '#8B4513',
                  marginBottom: '15px'
                }} />
                <h3 style={{
                  fontSize: 'clamp(16px, 3vw, 18px)',
                  fontWeight: '600',
                  color: selectedChoice === 'chocolate' ? 'white' : '#333',
                  marginBottom: '5px'
                }}>
                  🍫 Chocolate
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: selectedChoice === 'chocolate' ? 'rgba(255,255,255,0.9)' : '#7f8c8d'
                }}>
                  Rich & Creamy
                </p>
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
                opacity: submitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
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
          </div>

          {/* Right Column - Preview & Info */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: 'clamp(25px, 4vw, 35px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            animation: 'slideUp 0.5s ease-out 0.1s both'
          }}>
            <h2 style={{
              color: '#1e4fa3',
              fontSize: 'clamp(20px, 4vw, 24px)',
              marginBottom: '20px',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              Your LINKUP Preview
            </h2>

            {/* Preview Circles */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '30px',
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: selectedChoice === 'lollipop' 
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : '#e8eef5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedChoice === 'lollipop' ? '0 10px 20px rgba(245,87,108,0.3)' : 'none'
                }}>
                  <FaCandyCane size={50} color={selectedChoice === 'lollipop' ? 'white' : '#bdc3c7'} />
                </div>
                <p style={{ fontSize: '12px', color: '#7f8c8d' }}>Your Choice</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: selectedChoice === 'chocolate'
                    ? 'linear-gradient(135deg, #a8c0ff 0%, #3f2b1d 100%)'
                    : '#e8eef5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedChoice === 'chocolate' ? '0 10px 20px rgba(63,43,29,0.3)' : 'none'
                }}>
                  <GiChocolateBar size={50} color={selectedChoice === 'chocolate' ? 'white' : '#bdc3c7'} />
                </div>
                <p style={{ fontSize: '12px', color: '#7f8c8d' }}>Flavor</p>
              </div>
            </div>

            {/* Selected Info Display */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>
                  Selected Location
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: selectedLocation ? '#1e4fa3' : '#95a5a6'
                }}>
                  {selectedLocation || "Not selected yet"}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>
                  Your Treat
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: selectedChoice ? '#764ba2' : '#95a5a6'
                }}>
                  {selectedChoice ? (selectedChoice === 'lollipop' ? '🍭 Lollipop' : '🍫 Chocolate') : "Not chosen yet"}
                </p>
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '15px',
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