

export const login = async (data) => {
    
    const response = await fetch('http://localhost:4000/api/auth/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result;

  };
