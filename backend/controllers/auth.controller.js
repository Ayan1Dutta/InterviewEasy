import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utilities/token.util.js";

export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Please fill all the fields" });

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters long" });

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: `User already exists with email ${email}` });
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hash,
    });

    const savedUser = await newUser.save();

    const authToken=generateToken(savedUser, res);

    return res.status(201).json({ message: "User created successfully",name,email,authToken});

  } catch (err) {
    console.error('Error creating user:', err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Please fill all the fields" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User does not exist with this email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });
    generateToken(user, res);
    res.status(200).json({ message: "Login successful",email});

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const logout = (req, res) => {
  res.clearCookie("CodeSyncToken"); 
  res.status(200).json({ message: "Logged out successfully" });
};
