import Cookies from "js-cookie";


export const registerUser = async (data) => {
    //console.log(data);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/new`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-token': Cookies.get('x-token')
    },
    body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
};
