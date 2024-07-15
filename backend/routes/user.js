import express from "express";
import { Users } from "../db.js";
import zod from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const signupBody = zod.object({
    name: zod.string(),
    email: zod.string().email(),
    gender: zod.string(),
    contact: zod.string(),
    address: zod.string(),
    password: zod.string(),
})


router.post("/signup", async (req, res) => {
    try {
        const { success } = signupBody.safeParse(req.body);
        if (!success) {
            return res.status(400).json({
                msg: "incorrect inputs",
                errors: parseResult.error.errors,
            })
        }

        const existingUser = await Users.findOne({
            email: req.body.email
        })

        if (existingUser) {
            return res.status(400).json({ msg: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = await Users.create({
            name: req.body.name,
            email: req.body.email,
            gender: req.body.gender,
            contact: req.body.contact,
            address: req.body.address,
            password: hashedPassword,
        })

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        return res.status(201).json({
            msg: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                gender: user.gender,
                contact: user.contact,
                address: user.address
            },
            token,
        });
    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).json({ msg: "Error during signup" });
    }
});

const signinBody = zod.object({
    email: zod.string().email(),
    password: zod.string(),
})

router.post("/signin", async (req, res) => {
    try {
        console.log(req.body)
        const { success } = signinBody.safeParse(req.body);
        console.log(success);
        if (!success) {
            return res.status(400).json({ msg: "Invalid input fields" });
        }

        const user = await Users.findOne({ email: req.body.email });
        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(400).json({ msg: "Incorrect email or password" });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });


        return res.status(200).json({
            msg: "User logged in successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                gender: user.gender,
                contact: user.contact,
                address: user.address
            },
            token,
        });

    } catch (error) {
        console.error("Error during signin:", error);
        return res.status(500).json({ msg: "Error during signin" });
    }
})

export default router;