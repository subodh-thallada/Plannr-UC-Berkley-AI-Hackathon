// VAPI service for venue calling functionality
export interface CallStatus {
  id: string;
  status: 'idle' | 'calling' | 'connected' | 'ended' | 'error';
  error?: string;
}

let currentCall: CallStatus = { id: '', status: 'idle' };

export const callVenue = async (): Promise<CallStatus> => {
  const VAPI_API_KEY = import.meta.env.VITE_VAPI_API_KEY;
  const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;
  const VAPI_PHONE_NUMBER_ID = import.meta.env.VITE_VAPI_PHONE_NUMBER_ID;
  
  if (!VAPI_API_KEY) {
    return {
      id: '',
      status: 'error',
      error: 'VAPI API key is not configured. Please add VITE_VAPI_API_KEY to your .env file.'
    };
  }

  if (!VAPI_ASSISTANT_ID) {
    return {
      id: '',
      status: 'error',
      error: 'VAPI Assistant ID is not configured. Please add VITE_VAPI_ASSISTANT_ID to your .env file.'
    };
  }

  if (!VAPI_PHONE_NUMBER_ID) {
    return {
      id: '',
      status: 'error',
      error: 'VAPI Phone Number ID is not configured. Please add VITE_VAPI_PHONE_NUMBER_ID to your .env file.'
    };
  }

  try {
    currentCall = { id: '', status: 'calling' };
    
    // Make API call to VAPI to start the call using the correct format
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: VAPI_ASSISTANT_ID,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: '+17165134580', // Updated phone number as requested
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('VAPI API Error Response:', errorText);
      throw new Error(`VAPI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const callData = await response.json();
    console.log('VAPI Call Response:', callData);
    
    currentCall = { id: callData.id || callData.callId, status: 'connected' };
    
    return currentCall;
  } catch (error) {
    console.error('Error starting call:', error);
    currentCall = { 
      id: '', 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Failed to start call' 
    };
    return currentCall;
  }
};

export const getCurrentCallStatus = (): CallStatus => {
  return currentCall;
};

export const endCall = async (): Promise<void> => {
  if (currentCall.id && currentCall.status === 'connected') {
    const VAPI_API_KEY = import.meta.env.VITE_VAPI_API_KEY;
    
    try {
      const response = await fetch(`https://api.vapi.ai/call/${currentCall.id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      });
      
      if (response.ok) {
        currentCall.status = 'ended';
      } else {
        console.error('Error ending call:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }
};

export const callRestaurant = async (): Promise<CallStatus> => {
  const VAPI_API_KEY = import.meta.env.VITE_VAPI_API_KEY;
  const VAPI_RESTAURANT_ASSISTANT_ID = import.meta.env.VITE_VAPI_RESTAURANT_ASSISTANT_ID;
  const VAPI_RESTAURANT_PHONE_NUMBER_ID = import.meta.env.VITE_VAPI_RESTAURANT_PHONE_NUMBER_ID;
  
  if (!VAPI_API_KEY) {
    return {
      id: '',
      status: 'error',
      error: 'VAPI API key is not configured. Please add VITE_VAPI_API_KEY to your .env file.'
    };
  }

  if (!VAPI_RESTAURANT_ASSISTANT_ID) {
    return {
      id: '',
      status: 'error',
      error: 'VAPI Restaurant Assistant ID is not configured. Please add VITE_VAPI_RESTAURANT_ASSISTANT_ID to your .env file.'
    };
  }

  if (!VAPI_RESTAURANT_PHONE_NUMBER_ID) {
    return {
      id: '',
      status: 'error',
      error: 'VAPI Restaurant Phone Number ID is not configured. Please add VITE_VAPI_RESTAURANT_PHONE_NUMBER_ID to your .env file.'
    };
  }

  try {
    currentCall = { id: '', status: 'calling' };
    
    // Make API call to VAPI to start the restaurant call
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: VAPI_RESTAURANT_ASSISTANT_ID,
        phoneNumberId: VAPI_RESTAURANT_PHONE_NUMBER_ID,
        customer: {
          number: '+17165134580', // Restaurant phone number
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('VAPI API Error Response:', errorText);
      throw new Error(`VAPI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const callData = await response.json();
    console.log('VAPI Restaurant Call Response:', callData);
    
    currentCall = { id: callData.id || callData.callId, status: 'connected' };
    
    return currentCall;
  } catch (error) {
    console.error('Error starting restaurant call:', error);
    currentCall = { 
      id: '', 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Failed to start restaurant call' 
    };
    return currentCall;
  }
}; 