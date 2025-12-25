// routes/uploadRouter.js
import express from "express";
import { saveUserImage, fetchUsers, deleteUser, editUser, loginUser, checkFace } from "../controllers/userController.js";

const router = express.Router();

// POST /userdata → create/register user
router.post("/userdata", saveUserImage);

// GET /fetch-users → fetch all users
router.get("/fetch-users", fetchUsers);

// DELETE /delete-user/:id → delete user
router.delete("/delete-user/:id", deleteUser);

// PUT /edit-user/:id → edit user
router.put("/edit-user/:id", editUser);

// POST /login → verify user
router.post("/login", loginUser);

router.post("/checkface", checkFace);
export default router;