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

        // ==============================================
        // Generate numeric-only role-based ID
        // ==============================================
        // Assign base numbers per role
        let baseNum;
        if (userDesignation === "student") baseNum = 1000;
        else if (userDesignation === "teacher") baseNum = 2000;
        else baseNum = 3000; // admin

        // Get last user of same designation
        const lastUser = await UserData.findOne({ userDesignation })
            .sort({ id: -1 })
            .lean();

        // Determine next ID
        let newNum;

        if (lastUser && !isNaN(parseInt(lastUser.id))) {
            newNum = parseInt(lastUser.id) + 1;
        } else {
            newNum = baseNum + 1;
        }

        // Save user to DB
        const newUser = new UserData({
            id: newNum.toString(),
            userDesignation,
            imageurl: result.secure_url
        });

        await newUser.save();
        console.log(newUser)
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

        // Ensure numeric format only
        userId = userId.toString().trim();

        if (!/^\d+$/.test(userId))
            return res.status(400).json({ success: false, error: "Invalid UserID format (numeric only)" });

        const user = await UserData.findOne({ id: userId });
        if (!user)
            return res.status(404).json({ success: false, error: "User not found" });

        return res.json({ success: true, user });
    } catch (err) {
        console.error("Error fetching user image:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
