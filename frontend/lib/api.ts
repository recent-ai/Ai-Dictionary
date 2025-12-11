const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}
export interface RegisterPayload {
    email: string;
    password: string;
}

export interface RegisterResponse {
    id: string;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    is_superuser: boolean;
}


export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
    try {
        const formData = new URLSearchParams();
        formData.append('grant_type', 'password');
        formData.append('username', payload.username);
        formData.append('password', payload.password);
        formData.append('scope', '');
        formData.append('client_id', '');
        formData.append('client_secret', '');
        const response = await fetch(`${API_URL}/auth/jwt/login`, {
            method: "POST",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        });
        console.log("Response from loginUser fetch:", response);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Login failed");

        return data as LoginResponse;
    }
    catch (error) {
        console.log("Error Occured while loginUser");
        throw error;
    }
}

// change in the production #prod.

export async function handleSignup(payload: RegisterPayload): Promise<RegisterResponse> {

    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
    }

    return data as RegisterResponse
}