import { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie';
import { useEffect } from "react";

export const AuthContext = createContext();


export const AuthContextProvider =  ({ children }) => {

    const [authUser, setAuthUser] = useState("");
    const [user,setUser] = useState(localStorage.getItem("CodeSync_token")|| null);
    useEffect(()=>{
        if(user)
            setAuthUser(JSON.parse(user));
    },[user]);
    return <AuthContext.Provider value={{ authUser, setAuthUser }}>{children}</AuthContext.Provider>;
};