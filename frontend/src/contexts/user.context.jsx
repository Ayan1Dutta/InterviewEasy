import { createContext, useState } from "react";
import { useEffect } from "react";

export const AuthContext = createContext();



export const AuthContextProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(() => {
        const stored = localStorage.getItem("CodeSync_token");
        return stored ? JSON.parse(stored) : null;
    });

    return <AuthContext.Provider value={{ authUser, setAuthUser }}>{children}</AuthContext.Provider>;
};
