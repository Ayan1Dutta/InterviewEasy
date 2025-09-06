import { createContext, useState, useMemo } from "react";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(() => {
        try {
            const stored = localStorage.getItem("CodeSync_token");
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error("Failed to parse auth token from localStorage", error);
            return null;
        }
    });

    const contextValue = useMemo(() => ({
        authUser,
        setAuthUser,
    }), [authUser]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};