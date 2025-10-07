import cloudinary from "../utils/cloudinary.js";
import UserData from "../Schemas/userSchema.js";

// ================================
// 1️⃣ Save user image & designation
// ================================
export const saveUserImage = async (req, res) => {
    try {
        const { image, userDesignation } = req.body;

        if (!image)
            return res.status(400).json({ success: false, error: "No image provided" });
        if (!userDesignation)
            return res.status(400).json({ success: false, error: "User designation is required" });

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(image, { folder: "mern_uploads" });

        // Generate new role-based ID
        const lastUser = await UserData.findOne({ userDesignation }).sort({ _id: -1 });
        const prefix = userDesignation === "student" ? "S" :
            userDesignation === "teacher" ? "T" : "A";
        const newNum = lastUser ? parseInt(lastUser.id.slice(1)) + 1 : 1102;
        const newId = prefix + newNum;

        // Save user to DB
        const newUser = new UserData({
            id: newId,
            userDesignation,
            imageurl: result.secure_url
        });

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
export const loginUser = async (req, res) => {
    try {
        let { userId } = req.body;
        console.log("Received userId:", userId);

        if (!userId)
            return res.status(400).json({ success: false, error: "UserID required" });

        // normalize: uppercase letter + trim
        userId = userId.toString().trim().toUpperCase();

        const user = await UserData.findOne({ id: userId });
        if (!user)
            return res.status(404).json({ success: false, error: "User not found" });

        return res.json({ success: true, user });
    } catch (err) {
        console.error("Error fetching user image:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
