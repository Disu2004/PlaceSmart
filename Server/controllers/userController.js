// controllers/userController.js
import cloudinary from "../utils/cloudinary.js";
import UserData from "../Schemas/userSchema.js";

// Simple Euclidean distance (no face-api needed)
const euclideanDistance = (vec1, vec2) => {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += (vec1[i] - vec2[i]) ** 2;
  }
  return Math.sqrt(sum);
};

// ================================
// 1. CHECK FACE (Prevent Duplicates)
// ================================
export const checkFace = async (req, res) => {
  try {
    const { descriptor } = req.body;

    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ success: false, error: "Invalid face descriptor" });
    }

    const users = await UserData.find({ descriptor: { $exists: true } }).lean();

    for (const user of users) {
      const distance = euclideanDistance(descriptor, user.descriptor);
      if (distance < 0.6) {
        return res.json({
          success: true,
          exists: true,
          user: {
            id: user.id,
            userDesignation: user.userDesignation,
            imageurl: user.imageurl,
          },
        });
      }
    }

    res.json({ success: true, exists: false });
  } catch (err) {
    console.error("Check face error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================
// 2. SAVE USER (Minimal)
// ================================
export const saveUserImage = async (req, res) => {
  try {
    const { image, userDesignation, descriptor } = req.body;

    if (!image) return res.status(400).json({ success: false, error: "Image required" });
    if (!userDesignation) return res.status(400).json({ success: false, error: "Role required" });
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ success: false, error: "Valid descriptor required" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, { folder: "mern_uploads" });

    // Generate role-based ID
    let baseNum;
    if (userDesignation === "student") baseNum = 1100;
    else if (userDesignation === "teacher") baseNum = 2100;
    else baseNum = 3000; // admin

    const lastUser = await UserData.findOne({ userDesignation }).sort({ id: -1 }).lean();
    const newNum = lastUser && !isNaN(parseInt(lastUser.id)) ? parseInt(lastUser.id) + 1 : baseNum + 1;

    // Save user
    const newUser = new UserData({
      id: newNum.toString(),
      userDesignation,
      imageurl: result.secure_url,
      descriptor,
    });

    await newUser.save();

    res.json({
      success: true,
      user: {
        id: newUser.id,
        userDesignation: newUser.userDesignation,
        imageurl: newUser.imageurl,
      },
    });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================
// 3. FETCH ALL USERS
// ================================
export const fetchUsers = async (req, res) => {
  try {
    const users = await UserData.find({}).sort({ id: 1 }).lean();
    // console.log(users)
    res.json({ success: true, users });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================
// 4. DELETE USER BY ID
// ================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({ success: false, error: "Invalid UserID (numeric only)" });
    }

    const user = await UserData.findOneAndDelete({ id });
    // console.log(user)
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================
// 5. EDIT USER BY ID
// ================================
export const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userDesignation, image } = req.body;

    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({ success: false, error: "Invalid UserID" });
    }

    const updateData = { userDesignation };
    if (image) {
      const result = await cloudinary.uploader.upload(image, { folder: "mern_uploads" });
      updateData.imageurl = result.secure_url;
    }

    const user = await UserData.findOneAndUpdate({ id }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Edit error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ================================
// 6. LOGIN BY ID
// ================================
export const loginUser = async (req, res) => {
  try {
    let { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: "UserID required" });

    userId = userId.toString().trim();
    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({ success: false, error: "Invalid UserID format" });
    }

    const user = await UserData.findOne({ id: userId }).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};