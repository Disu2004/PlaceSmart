// controllers/uploadController.js
import cloudinary from "../utils/cloudinary.js";
import UserData from "../Schemas/userSchema.js";

// ================================
// 1️⃣ Save user image
// ================================
export const saveUserImage = async (req, res) => {
    try {
        const { image } = req.body; // base64 from frontend
        if (!image) return res.status(400).json({ success: false, error: "No image provided" });

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(image, { folder: "mern_uploads" });

        // Generate new user id
        const lastUser = await UserData.findOne().sort({ _id: -1 });
        const newId = lastUser ? lastUser.id + 1 : 1100;

        // Save user record in MongoDB
        const newUser = new UserData({ id: newId, imageurl: result.secure_url });
        await newUser.save();

        return res.json({ success: true, user: newUser });
    } catch (err) {
        console.error("Error saving user image:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// ================================
// 2️⃣ Fetch user by ID
// ================================
// controllers/uploadController.js

export const loginUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, error: "UserID required" });

        const user = await UserData.findOne({ id: userId });
        if (!user) return res.status(404).json({ success: false, error: "User not found" });
        console.log(user);

        return res.json({ success: true, imageurl: user.imageurl });
    } catch (err) {
        console.error("Error fetching user image:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
