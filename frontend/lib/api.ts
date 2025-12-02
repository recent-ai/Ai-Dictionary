import axios from 'axios';
export async function loginUser(username: string, password: string) {
    try {
        const formData = new URLSearchParams();
        formData.append('grant_type', 'password');
        formData.append('username', username);
        formData.append('password', password);
        formData.append('scope', '');
        formData.append('client_id', '');
        formData.append('client_secret', '');
        const response = await axios.post(
            "http://127.0.0.1:8000/auth/auth/jwt/login",
            formData,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
            }
        );
        if (response.status === 200) {
            // console.log("Working from api.ts - Login");
        }
        else {
            // console.log(`Error Status - ${response.status}: Login Failed`);
        }
        return response.data;
    }
    catch (error) {
        console.log("Error Occured while loginUser");
    }
}