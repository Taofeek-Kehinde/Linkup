import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMapMarkerAlt, 
  FaPlusCircle, 
  FaTrashAlt, 
  FaMusic, 
  FaQrcode, 
  FaMicrophoneAlt,
  FaMapPin,
  FaInfoCircle,
  FaCity,
  FaLocationArrow
} from 'react-icons/fa';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Nigeria states array - sorted alphabetically
const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
].sort();

// Types
interface LocationData {
  id: string;
  state: string;
  specificLocation: string;
  fullLocation: string;
}

// Custom Dropdown Component for States
const StateSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}> = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
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
          transition: 'all 0.3s ease',
          color: value ? '#333' : '#7f8c8d'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1e4fa3'}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = '#e8eef5';
        }}
      >
        <span>{value || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          <path d="M2 4L6 8L10 4" stroke="#1e4fa3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)}
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
            maxHeight: '280px',
            overflowY: 'auto',
            zIndex: 999,
            animation: 'dropdownFadeIn 0.2s ease-out'
          }}>
            <div style={{
              padding: '8px 0',
              background: '#fafcfd',
              borderRadius: '12px'
            }}>
              {options.map((option) => (
                <div
                  key={option}
                  onClick={() => handleSelect(option)}
                  style={{
                    padding: '10px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    color: '#333',
                    background: value === option ? '#e8eef5' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e8eef5';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main LINKUP Generator Component
const LinkupGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [specificLocation, setSpecificLocation] = useState("");
  const [locationsList, setLocationsList] = useState<LocationData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  const addLocation = useCallback(() => {
    if (!selectedState) {
      alert("Please select a state!");
      return;
    }
    if (!specificLocation.trim()) {
      alert("Please enter a specific location!");
      return;
    }
    
    const fullLocationText = `${specificLocation.trim()}, ${selectedState}`;
    
    if (locationsList.some(loc => loc.fullLocation === fullLocationText)) {
      alert("📍 This location has already been added!");
      return;
    }
    
    const newLocation: LocationData = {
      id: `${fullLocationText}-${Date.now()}`,
      state: selectedState,
      specificLocation: specificLocation.trim(),
      fullLocation: fullLocationText
    };
    
    setLocationsList(prev => [...prev, newLocation]);
    setSelectedState("");
    setSpecificLocation("");
  }, [selectedState, specificLocation, locationsList]);

  const removeLocation = useCallback((id: string) => {
    setLocationsList(prev => prev.filter(loc => loc.id !== id));
  }, []);

  const handleGenerateQR = useCallback(async () => {
    if (!eventName.trim()) {
      alert("Please enter your event/show name.");
      return;
    }
    if (locationsList.length === 0) {
      alert("Please add at least one location.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Prepare event data for Firebase
      const eventData = {
        eventName: eventName.trim(),
        locations: locationsList.map(loc => loc.fullLocation),
        locationDetails: locationsList.map(loc => ({
          state: loc.state,
          specificLocation: loc.specificLocation,
          fullLocation: loc.fullLocation
        })),
        createdAt: serverTimestamp(),
        totalLocations: locationsList.length
      };

      // Save to Firebase Firestore
      const docRef = await addDoc(collection(db, "events"), eventData);
      
      console.log("Event saved with ID:", docRef.id);
      
      // Store the event ID in sessionStorage to retrieve on the DateQr page
      sessionStorage.setItem('currentEventId', docRef.id);
      sessionStorage.setItem('currentEventName', eventName.trim());
      sessionStorage.setItem('currentEventLocations', JSON.stringify(locationsList.map(loc => loc.fullLocation)));
      
      // Redirect to DateQr page with the event ID
      navigate(`/date-qr/${docRef.id}`);
      
    } catch (err) {
      console.error("Error saving event to Firebase:", err);
      setError("Failed to save event. Please try again.");
      setIsGenerating(false);
    }
  }, [eventName, locationsList, navigate]);

  return (
    <div style={{ minHeight: 'auto', background: '#f5f7fb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(20px, 5vh, 50px) 20px' }}>
        {/* Header with music icon */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <div>
            <h1 style={{
              color: '#1e4fa3',
              letterSpacing: '6px',
              fontWeight: '700',
              fontSize: 'clamp(24px, 5vw, 38px)',
              marginBottom: '5px'
            }}>
              LINK UP
            </h1>
            <p style={{
              color: '#1e4fa3',
              fontStyle: 'italic',
              fontSize: 'clamp(12px, 3vw, 16px)'
            }}>
              in the moment
            </p>
          </div>
        </div>

        {/* Form Section Only */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: 'clamp(20px, 4vw, 35px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          animation: 'fadeIn 0.6s ease-out 0.1s both'
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Enter Name */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1e4fa3',
              fontWeight: '600',
              marginBottom: '10px',
              fontSize: '14px',
              letterSpacing: '1px'
            }}>
              <FaMicrophoneAlt /> ENTER NAME
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '2px solid #e8eef5',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                background: '#fafcfd'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#1e4fa3'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e8eef5'}
              placeholder="e.g., Lagos Vibes Fest, Abuja Comedy Night"
            />
          </div>

          {/* Add Location - Manual Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1e4fa3',
              fontWeight: '600',
              marginBottom: '10px',
              fontSize: '14px',
              letterSpacing: '1px'
            }}>
              <FaMapMarkerAlt /> ADD LOCATION(S)
            </label>
            
            {/* State Dropdown */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#5f6c80',
                fontSize: '12px',
                marginBottom: '6px'
              }}>
                <FaCity size={12} /> Select State
              </label>
              <StateSelect
                value={selectedState}
                onChange={setSelectedState}
                options={NIGERIA_STATES}
                placeholder="Select a state in Nigeria"
              />
            </div>
            
            {/* Specific Location Input */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#5f6c80',
                fontSize: '12px',
                marginBottom: '6px'
              }}>
                <FaLocationArrow size={12} /> Specific Location
              </label>
              <input
                type="text"
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '2px solid #e8eef5',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  background: '#fafcfd'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#1e4fa3'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e8eef5'}
                placeholder="e.g., Eko Hotel, Victoria Island, Ikeja City Mall, etc."
              />
            </div>
            
            {/* Add Button */}
            <button
              onClick={addLocation}
              style={{
                width: '100%',
                background: '#e8eef5',
                color: '#1e4fa3',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#d1d9e6'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#e8eef5'}
            >
              <FaPlusCircle /> Add Location
            </button>
            
            <p style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaInfoCircle /> Select a state and enter the specific venue/location
            </p>
          </div>

          {/* Added Locations List */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{
              color: '#1e4fa3',
              fontWeight: '600',
              marginBottom: '12px',
              fontSize: '14px',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaMapPin /> Added Locations ({locationsList.length})
            </h3>
            {locationsList.length === 0 ? (
              <div style={{
                background: '#fafcfd',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                color: '#95a5a6',
                fontSize: '13px',
                border: '2px dashed #e8eef5'
              }}>
                No locations added yet
                <br />
                <span style={{ fontSize: '11px' }}>Select a state and enter a specific location, then tap "Add Location"</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                {locationsList.map((loc) => (
                  <div
                    key={loc.id}
                    style={{
                      background: '#e8eef5',
                      borderRadius: '12px',
                      padding: '10px 14px 10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      width: 'calc(100% - 20px)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1e4fa3', fontSize: '14px' }}>
                        {loc.specificLocation}
                      </div>
                      <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>
                        {loc.state}
                      </div>
                    </div>
                    <button
                      onClick={() => removeLocation(loc.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#e74c3c',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fdecea'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <FaTrashAlt style={{ fontSize: '12px' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Another Location button */}
          {locationsList.length > 0 && (
            <button
              onClick={() => {
                const stateSelect = document.querySelector('[data-state-select]');
                if (stateSelect) (stateSelect as HTMLElement).click();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#1e4fa3',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '24px',
                padding: '0'
              }}
            >
              <FaPlusCircle style={{ fontSize: '12px' }} />
              Add Another Location
            </button>
          )}

          {/* Tips */}
          <div style={{
            background: '#fef9e6',
            borderRadius: '12px',
            padding: '16px 20px',
            marginTop: '10px',
            border: '1px solid #f5e6b8'
          }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <FaInfoCircle style={{ fontSize: '20px', color: '#b8860b' }} />
              <div>
                <p style={{ fontWeight: '600', color: '#b8860b', fontSize: '13px', marginBottom: '4px' }}>Tips</p>
                <p style={{ fontSize: '12px', color: '#8b6914', lineHeight: '1.5' }}>
                  "Add ALL  locations where your SHOW is happening. Generate a QR code for participants to scan at entry OR reservation.
                   QR expires after 72 hours"
                </p>
              </div>
            </div>
          </div>

          {/* Generate QR Button */}
          <button
            onClick={handleGenerateQR}
            disabled={isGenerating}
            style={{
              width: '100%',
              background: '#1e4fa3',
              color: 'white',
              border: 'none',
              padding: '16px 20px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '28px',
              boxShadow: '0 4px 15px rgba(30, 79, 163, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: isGenerating ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) e.currentTarget.style.background = '#163d7a';
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) e.currentTarget.style.background = '#1e4fa3';
            }}
          >
            {isGenerating ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Saving...
              </>
            ) : (
              <>
                <FaQrcode style={{ fontSize: '20px' }} />
                Generate QR & Save Event
              </>
            )}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #e8eef5',
          fontSize: '11px',
          color: '#95a5a6'
        }}>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FaMusic style={{ color: '#1e4fa3' }} />
            LINKUP Generator — Create QR codes for shows, events & spots across Nigeria
            <FaMusic style={{ color: '#1e4fa3' }} />
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
      `}</style>
    </div>
  );
};

export { LinkupGenerator };